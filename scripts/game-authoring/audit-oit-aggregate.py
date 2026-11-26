#!/usr/bin/env python3
"""Audit original OIT aggregate receipts offline; output is NOT an approval registry.

The later repair ledgers and proposed holds require independent reconciliation.
This tool intentionally cannot publish or authorize any item. It checks the exact
request items against saved inputs and raw provider responses; it does not trust
review.json, metadata embedded in overlays, or a summary's approval claims.

Usage: python3 scripts/game-authoring/audit-oit-aggregate.py REVIEW_DIR OVERLAY_DIR OUTPUT.json
Keep OUTPUT outside the repository and public assets. No network access is used.
"""
import hashlib
import json
import pathlib
import sys


def load(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def audit(root, overlays):
    paths = sorted(root.glob("batch-[0-9][0-9][0-9]"))
    require(len(paths) == 68, "expected all 68 original aggregate batches")
    current = {}
    for path in sorted(overlays.glob("2026-11-14-oit-batch-[1234].json")):
        doc = load(path)
        for row in doc["additions"]:
            key = row["example"]["id"]
            require(key not in current, f"duplicate current item {key}")
            current[key] = {k: row[k] for k in ("courseKey", "topicId", "difficulty", "example")}
    require(len(current) == 675, "expected 675 distinct current OIT additions")
    seen, request_ids, trace = set(), set(), []
    props = {"id", "verdict", "factual_assessment", "answer_mode_assessment", "assumptions", "safety_assessment", "course_applicability", "duplication_concern", "source_status", "issue_and_fix"}
    for directory in paths:
        saved = load(directory / "items.json")
        request = load(directory / "request.json")
        status = load(directory / "status.json")
        receipt = load(directory / "response.json")
        require(status.get("state") == "completed", f"{directory}: incomplete")
        require(request.get("model") == "gpt-6.1-sol", f"{directory}: unexpected request model")
        messages = request.get("messages", [])
        require(len(messages) == 2 and messages[1].get("role") == "user", f"{directory}: unexpected messages")
        payload = json.loads(messages[1]["content"])
        require(payload.get("items") == saved, f"{directory}: input differs from dispatched request")
        require(receipt.get("http_status") == 200, f"{directory}: bad HTTP status")
        request_id = receipt.get("provider_request_id")
        require(isinstance(request_id, str) and request_id.startswith("req_") and len(request_id) > 4 and request_id not in request_ids, f"{directory}: missing or reused provider request id")
        request_ids.add(request_id)
        body = receipt.get("body", {})
        require(body.get("model") == "gpt-6.1-sol" and not body.get("error"), f"{directory}: invalid model/response")
        choices = body.get("choices", [])
        require(len(choices) == 1 and choices[0].get("finish_reason") == "stop" and not choices[0].get("message", {}).get("refusal"), f"{directory}: incomplete response")
        result = json.loads(choices[0]["message"]["content"])
        require(set(result) == {"reviews"} and isinstance(result["reviews"], list), f"{directory}: invalid results")
        input_ids = [row["example"]["id"] for row in saved]
        output_ids = [row.get("id") for row in result["reviews"]]
        require(len(input_ids) == len(set(input_ids)) and len(output_ids) == len(set(output_ids)) and set(input_ids) == set(output_ids), f"{directory}: ID coverage mismatch")
        require(status.get("ids") == input_ids, f"{directory}: status ID mismatch")
        result_by_id = {row["id"]: row for row in result["reviews"]}
        for row in saved:
            item_id = row["example"]["id"]
            require(item_id not in seen and item_id in current, f"duplicate or unknown item {item_id}")
            seen.add(item_id)
            review = result_by_id[item_id]
            require(set(review) == props and all(isinstance(v, str) and v.strip() for v in review.values()), f"invalid review {item_id}")
            require(review["verdict"] in ("issue", "uncertain", "no_material_issue_found") and review["source_status"] == "unverified", f"invalid verdict {item_id}")
            reviewed = {k: row[k] for k in ("courseKey", "topicId", "difficulty", "example")}
            trace.append({"id": item_id, "courseKey": row["courseKey"], "batch": directory.name,
                          "provider_request_id": request_id, "request_sha256_canonical": digest(request),
                          "response_sha256_canonical": digest(body), "reviewed_payload_sha256_canonical": digest(reviewed),
                          "current_payload_sha256_canonical": digest(current[item_id]),
                          "exact_current_payload_match": reviewed == current[item_id],
                          "verdict": review["verdict"], "source_status": review["source_status"],
                          "activation": "not_authorized_by_audit"})
    require(seen == set(current), "current and reviewed ID sets differ")
    return {"format": "oit-aggregate-audit-v1", "approval": False,
            "limitation": "Original aggregate only; later reviews and safety holds are not reconciled. Not a runtime registry; never activate from this report.",
            "items": trace}


def main():
    require(len(sys.argv) == 4, __doc__)
    root, overlays, output = map(pathlib.Path, sys.argv[1:])
    repo = pathlib.Path(__file__).resolve().parents[2]
    require(not output.resolve().is_relative_to(repo), "output must be outside repository")
    result = audit(root, overlays)
    with output.open("x", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"Audited {len(result['items'])} items; no runtime approval generated: {output}")


if __name__ == "__main__":
    main()
