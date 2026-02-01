import express from "express";
import db from "./db/database.js";

const app = express();
app.use(express.json());

app.use((_req, res, next) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    next();
});

app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
});

// récupérer tous les items
app.get("/api/items", (_req, res) => {
    const items = db.prepare("SELECT * FROM items").all();
    res.json(items);
});

// ajouter un item
app.post("/api/items", (req, res) => {
    const { name, quantity, expiration_date } = req.body;

    if (!name) {
        return res.status(400).json({ error: "name required" });
    }

    const stmt = db.prepare(`
    INSERT INTO items (name, quantity, expiration_date, created_at)
    VALUES (?, ?, ?, ?)
  `);

    const result = stmt.run(
        name,
        quantity ?? 0,
        expiration_date ?? null,
        new Date().toISOString()
    );

    res.status(201).json({ id: result.lastInsertRowid });
});

// supprimer un item
app.delete("/api/items/:id", (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM items WHERE id = ?");
    stmt.run(id);
    res.status(204).send();
});

// supprimer tous les items
app.delete("/api/items", (_req, res) => {
    const stmt = db.prepare("DELETE FROM items");
    stmt.run();
    res.status(204).send();
});

// mettre à jour la quantité d'un item
app.patch("/api/items/:id", (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
        return res.status(400).json({ error: "quantity required" });
    }

    const stmt = db.prepare("UPDATE items SET quantity = ? WHERE id = ?");
    stmt.run(quantity, id);
    res.status(200).json({ ok: true });
});

const port = 3000;
app.listen(port, "0.0.0.0", () => {
    console.log(`API running on http://localhost:${port}`);
});
