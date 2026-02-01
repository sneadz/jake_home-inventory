import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.resolve("data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, "inventory.db");
const db = new Database(dbPath);

// création des tables (si elles n'existent pas)
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    expiration_date TEXT,
    created_at TEXT NOT NULL
  );
`);

// Migration : ajout de la colonne expiration_date si elle n'existe pas
const tableInfo = db.prepare("PRAGMA table_info(items)").all() as any[];
const hasExpirationDate = tableInfo.some(col => col.name === "expiration_date");
if (!hasExpirationDate) {
    db.exec("ALTER TABLE items ADD COLUMN expiration_date TEXT");
}

export default db;
