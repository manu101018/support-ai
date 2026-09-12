import "dotenv/config";
import express from "express";
import { pool } from "./db";
import { redisClient } from "./redis";
import { createLLMProvider } from "./llm/llmFactory";

const llmProvider = createLLMProvider();

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message || typeof message != 'string') {
        return res.status(400).json({ error: "Field 'message' (string) is required." });
    }

    try {
        const reply = await Promise.race([
            llmProvider.classifyIntent(message),
            new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error("LLM Call Timed Out. Please try again.")), 20000);
            })
        ])
        res.status(200).json({ message: reply });
    } catch (err) {
        console.error("LLM call failed:", err);
        res.status(502).json({ error: "AI service unavailable, please try again." });
    }
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