import { GoogleGenAI } from "@google/genai";
import { SUPPORT_AI_SYSTEM_PROMPT } from "./prompts";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function generateReply(userMessage: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
        contents: userMessage,
        config: {
            systemInstruction: SUPPORT_AI_SYSTEM_PROMPT,
            temperature: 0.3,
        },
    });

    return response.text ?? "Sorry, I couldn't generate a response.";
}