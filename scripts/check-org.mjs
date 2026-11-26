import { createRequire } from 'module';
import { execSync } from 'child_process';

// Use the running dev server's DB connection via a quick SQL query
const result = execSync(
  `mysql --defaults-extra-file=<(echo "[client]\npassword=${process.env.DB_PASS}") -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${process.env.DB_NAME} -e "SELECT id, name, managerEmail, seatsTotal, status, termEnd FROM organizations; SELECT id, orgId, email, role, status FROM organization_members;" 2>/dev/null`,
  { shell: '/bin/bash', env: process.env }
);
console.log(result.toString());
