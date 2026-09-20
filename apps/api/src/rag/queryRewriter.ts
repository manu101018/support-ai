import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const REWRITE_INSTRUCTION = `
You rewrite customer support messages into short, clear search queries
for a policy knowledge base about returns, refunds, and shipping.

Rules:
- Strip emotion, filler words, and irrelevant details.
- Keep only the core topic and any specific product category mentioned.
- Output ONLY the rewritten query, nothing else. No punctuation like quotes.
- If the message is already a clear, direct policy question, return it mostly unchanged.

Examples:
Input: "ugh this stupid mouse broke can I send it back lol"
Output: return policy for a broken mouse

Input: "hey so like i paid for stuff but never got confirmation is that normal"
Output: payment deducted but order not confirmed

Input: "What is your return policy?"
Output: return policy
`.trim();

export async function rewriteQuery(userMessage: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
            contents: userMessage,
            config: {
                systemInstruction: REWRITE_INSTRUCTION,
                temperature: 0.1,
            },
        });

        const rewritten = response.text?.trim();
        return rewritten && rewritten.length > 0 ? rewritten : userMessage;
    } catch (err) {
        console.error("Query rewrite failed, falling back to original message:", err);
        return userMessage;
    }
}