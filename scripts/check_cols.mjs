import { createConnection } from "mysql2/promise";
const db = await createConnection(process.env.DATABASE_URL);
const [cols] = await db.query("DESCRIBE questions");
cols.forEach(c => console.log(c.Field, c.Type));
await db.end();
