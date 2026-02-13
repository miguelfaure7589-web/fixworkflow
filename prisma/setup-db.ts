import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const migrationPath = path.resolve(process.cwd(), "prisma/migrations/20260213030541_init/migration.sql");

// Delete existing DB if it exists
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

// Create DB and apply migration
const db = new Database(dbPath);
const sql = fs.readFileSync(migrationPath, "utf-8");
db.exec(sql);
console.log("Database created and migration applied successfully.");
db.close();
