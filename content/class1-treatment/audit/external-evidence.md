# External evidence for residual Treatment remediation

## Class 1 Wastewater Treatment question 2071: rotating biological contactor drive

The Canadian Centre for Occupational Health and Safety (CCOHS) lockout/tag-out guidance was retrieved on 2026-09-11 from https://www.ccohs.ca/oshanswers/hsprograms/lockout.html.

CCOHS defines lockout as placing a lockout device on an energy-isolating device under an established procedure. It describes de-energization as disconnecting and isolating a system from energy to prevent release of hazardous energy. For maintenance, repair, set-up, jam removal, or work that may remove or bypass safeguarding, it explains that lockout/tag-out procedures reduce injury risk from unintended energy release or start-up. The guidance calls for equipment-specific procedures, trained/authorized workers, shutdown, isolation, control of stored energy, lockout/tag-out, and verification of isolation before work begins.

**Release-use boundary:** This supports the revised general safety statement that a tripped RBC drive must remain isolated and be assessed under the site’s authorized procedure before inspection. It does not prescribe an Ontario-specific legal duty, a specific RBC procedure, or a specific lockout sequence.

## Separate final reviewer protocol

The Anthropic Messages API documentation was retrieved from https://docs.anthropic.com/en/api/messages. It specifies `POST /v1/messages`, a top-level `system` prompt, a `messages` array with user/assistant turns, and `max_tokens`. This protocol will be used only for a separate independent review of candidate revisions; it will not make content changes or insert production data.

The live Anthropic `GET /v1/models` catalog was checked on 2026-09-11. It lists `claude-opus-4-7` as the current highest-capability Opus model with adaptive thinking and structured-output support. The residual-review step will use that model independently from the GPT candidate writer.
