# Official vacancy evidence fixtures

Reused the public HTML already captured on **2026-10-17** by job `job_NTu9HL7f`; no requests, authentication or browser activity were needed for these regressions.

- `ottawa-process-operator-20261017.html`: exact `jobDisplayShell` container (source lines 698–812) from `ottawa-detail.html`. Page-wide scripts, anonymous anti-CSRF/configuration fields and unrelated navigation are intentionally not committed. Source URL: <https://jobs-emplois.ottawa.ca/city-jobs/job/Ottawa%2C-ON-Process-OperatorProcess-Operator-in-Training-42hrs-ON-Ottawa%2C-ON/1291635047/>.
- `manitoba-water-operations-20261017.html`: captured `manitoba-detail.html`, with only the unrelated printer-icon URL's anonymous `;jsessionid` replaced by `;jsessionid=REDACTED_PUBLIC_SESSION`. Source URL: <https://jobsearch.gov.mb.ca/advancedResult.action?ID=128944>.

The title, visible employer evidence, application/print links, detail IDs, closing dates, and container nesting remain as captured. Complete unmodified originals and the prior findings are retained outside Git at `/home/ubuntu/jobs/job_NTu9HL7f/`.
