import { GoogleGenAI } from "@google/genai";
import { LLMProvider, GenerateReplyOptions } from "../types";
import { SUPPORT_AI_SYSTEM_PROMPT } from "../prompts";

export class GeminiProvider implements LLMProvider {
    name = "gemini";
    private ai: GoogleGenAI;
    private model: string;

    constructor(apikey: string | undefined, model: string | 'gemini-3.7-flash') {
        this.ai = new GoogleGenAI({
            apiKey: apikey
        });
        this.model = model;
    }


    async generateReply(userMessage: string, options: GenerateReplyOptions = {}): Promise<string> {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: userMessage,
            config: {
                systemInstruction: options.systemInstruction ?? SUPPORT_AI_SYSTEM_PROMPT,
                temperature: options.temperature ?? 0.3,
            },
        });

        return response.text ?? "Sorry, I couldn't generate a response.";
    }
}