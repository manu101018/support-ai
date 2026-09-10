import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function generateReply(userMessage: string): Promise<string> {
    const interaction = await ai.interactions.create({
        model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
        input: userMessage,
    });

    return interaction.output_text ?? "Sorry, I couldn't generate a response.";
}