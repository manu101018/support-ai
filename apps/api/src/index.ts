import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { redisClient } from "./redis";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.post("/chat", (_req, res) => {
    res.json({ message: "I am your AI support assistant." });
});

const PORT = process.env.PORT || 3000;

async function start() {
    await redisClient.connect();
    await pool.query("SELECT 1"); // sanity check
    app.listen(PORT, () => console.log(`SupportAI API running on port ${PORT}`));
}

start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});