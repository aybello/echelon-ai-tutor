# Read-only question bank bridge

This bridge reads `questions` and `question_bank_meta` from Echelon's DigitalOcean Managed MySQL database. It offers a local CLI and an MCP stdio server. It cannot edit questions and has no arbitrary SQL tool. The default allowed bank is `class3-water-dist`; add other keys explicitly with `ECHELON_ALLOWED_BANKS`.

## One-time setup

1. Create a **dedicated** MySQL user for question review in DigitalOcean. Grant `SELECT` on only `questions` and `question_bank_meta` in the application database. For example, from a privileged administrative connection, adapting the database and user names:

   ```sql
   GRANT SELECT ON `app_database`.`questions` TO 'question_review'@'%';
   GRANT SELECT ON `app_database`.`question_bank_meta` TO 'question_review'@'%';
   SHOW GRANTS FOR 'question_review'@'%';
   ```

   Confirm the grants show no write privileges. Do not use `doadmin` for the bridge. Add the runner's IP or VPC to the database's trusted sources.

2. Place the DigitalOcean cluster CA certificate in a private path accessible to the runner. Supply these **environment variables through a secrets manager or protected runtime configuration**, not in Git:

   | Variable                      | Example shape                                                                                         |
   | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
   | `ECHELON_REVIEW_DATABASE_URL` | `mysql://question_review:<URL-encoded password>@<cluster>.db.ondigitalocean.com:25060/<app_database>` |
   | `ECHELON_DB_CA_FILE`          | `/private/ca-certificate.crt`                                                                         |
   | `ECHELON_ALLOWED_BANKS`       | `class3-water-dist` (optional)                                                                        |

   The bridge always validates the CA and server hostname. It rejects the `doadmin` account. Do not paste a database password into chat, a command argument, or a committed MCP config.

3. Install the repository dependencies with the lockfile: `pnpm install --frozen-lockfile`. Run the bridge from a network location allowed by the DigitalOcean trusted sources.

## CLI

```sh
pnpm question-bridge doctor
pnpm question-bridge summary --bank class3-water-dist
pnpm question-bridge list --bank class3-water-dist --after 0 --limit 50
pnpm question-bridge get --bank class3-water-dist --number 116
pnpm question-bridge export --bank class3-water-dist > /private/class3-water-dist.json
```

`doctor` checks the live connection and counts. `list` returns `nextAfter` for the next page; `export` reads the entire allowed bank in pages. Export files contain unpublished answers; keep them in private storage and delete incomplete files if an export fails.

## MCP stdio

Configure an MCP host to launch `node /absolute/path/to/repo/scripts/question-bridge/mcp.mjs` with the three environment variables above. The host must be able to inherit the secrets securely and reach the DigitalOcean database. The tools are `question_bank_summary`, `list_questions`, and `get_question`; `list_questions` is limited to 100 records per call.

The MCP process runs locally over stdio. It does not open a public HTTP endpoint. Registering it in a particular AI application is a separate host configuration step; simply running the script does not connect this ChatGPT conversation to the database.
