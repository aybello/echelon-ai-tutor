#!/usr/bin/env python3
"""Private-evidence integration tests. Skipped when the private receipts are absent."""
import importlib.util
import json
import pathlib
import shutil
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("oit_audit", HERE / "audit-oit-aggregate.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
ROOT = pathlib.Path("/home/ubuntu/outputs/pr63-readiness-20261113/content-review")
OVERLAYS = HERE.parents[1] / "server/interactiveContent/overlay"


@unittest.skipUnless(ROOT.is_dir() and OVERLAYS.is_dir(), "private receipts not available")
class RawReceiptAudit(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = pathlib.Path(self.tmp.name) / "review"
        self.overlays = pathlib.Path(self.tmp.name) / "overlays"
        shutil.copytree(ROOT, self.root, ignore=shutil.ignore_patterns("*.py", "*.md", "*.jsonl"))
        shutil.copytree(OVERLAYS, self.overlays)

    def modify(self, relative, mutation):
        path = self.root / relative
        data = json.loads(path.read_text())
        mutation(data)
        path.write_text(json.dumps(data))

    def test_raw_aggregate_and_stale_payload_detection(self):
        result = module.audit(self.root, self.overlays)
        self.assertEqual(len(result["items"]), 675)
        self.assertFalse(result["approval"])
        path = self.overlays / "2026-11-14-oit-batch-1.json"
        data = json.loads(path.read_text())
        item_id = data["additions"][0]["example"]["id"]
        data["additions"][0]["difficulty"] = "hard" if data["additions"][0]["difficulty"] != "hard" else "easy"
        path.write_text(json.dumps(data))
        item = next(x for x in module.audit(self.root, self.overlays)["items"] if x["id"] == item_id)
        self.assertFalse(item["exact_current_payload_match"])
        self.assertEqual(item["activation"], "not_authorized_by_audit")

    def test_request_input_mismatch_rejected(self):
        self.modify("batch-001/items.json", lambda x: x[0]["example"].update(prompt="altered"))
        with self.assertRaisesRegex(ValueError, "input differs"):
            module.audit(self.root, self.overlays)

    def test_missing_request_id_rejected(self):
        self.modify("batch-001/response.json", lambda x: x.pop("provider_request_id"))
        with self.assertRaisesRegex(ValueError, "request id"):
            module.audit(self.root, self.overlays)

    def test_incomplete_or_duplicate_responses_rejected(self):
        def mutate(x):
            body = json.loads(x["body"]["choices"][0]["message"]["content"])
            body["reviews"][0]["id"] = body["reviews"][1]["id"]
            x["body"]["choices"][0]["message"]["content"] = json.dumps(body)
        self.modify("batch-001/response.json", mutate)
        with self.assertRaisesRegex(ValueError, "coverage mismatch"):
            module.audit(self.root, self.overlays)

    def test_unknown_verdict_rejected(self):
        def mutate(x):
            body = json.loads(x["body"]["choices"][0]["message"]["content"])
            body["reviews"][0]["verdict"] = "approved"
            x["body"]["choices"][0]["message"]["content"] = json.dumps(body)
        self.modify("batch-001/response.json", mutate)
        with self.assertRaisesRegex(ValueError, "invalid verdict"):
            module.audit(self.root, self.overlays)


if __name__ == "__main__":
    unittest.main()
