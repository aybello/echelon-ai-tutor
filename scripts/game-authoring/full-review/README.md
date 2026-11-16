# Full-review tools

These are the scripts used for the full review of 2026-11-15/16. They were written as one-off tools, so **every path inside them points to a scratchpad folder that no longer exists**. Search each file for `/tmp/claude-0/` and set `S` (the working folder) and `SNAP` (a copy of `main`) to your own paths before running.

| File | Job |
|---|---|
| `rows.mts` | Reads every authoring table and the older base bank, makes one unit per distinct row, and splits them into chunks of 300 |
| `INSTRUCTIONS.md` | The brief given to each reviewer. The reply format is one JSON line per problem, with a replacement row |
| `canary.py` | Plants known errors in chunks to prove a reviewer is reading |
| `apply.py` | Applies reviewer fixes to the tables. Checks the row shape, skips what it already applied, ignores canaries |
| `tsser.py` | Writes a row back out in the same text form the tables use, so a replacement matches exactly |
| `coverage.mts` | Matches live items to units by content and lists live items that need excluding. Use it again after any change |
| `topup.mts` | Fills a course that fell under 150 per mode, using generic rows from the matching western table |

Work in waves of at most six reviewers. A larger wave hit the usage limit and lost work.
