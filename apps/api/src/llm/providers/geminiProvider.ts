import { GoogleGenAI } from "@google/genai";
import { LLMProvider, GenerateReplyOptions } from "../types";
import { SUPPORT_AI_SYSTEM_PROMPT } from "../prompts";
import { IntentResult, IntentResultSchema, geminiIntentResponseSchema } from "../schemas/intentSchema";

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

    async classifyIntent(userMessage: string): Promise<IntentResult> {
        const response = await this.ai.models.generateContent({
            model: this.model,
            contents: userMessage,
            config: {
                systemInstruction: `${SUPPORT_AI_SYSTEM_PROMPT}\n\nClassify the user's message and respond ONLY in the given JSON schema. The "response" field should be a short, professional reply consistent with the rules above.`,
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: geminiIntentResponseSchema,
            },
        });

        const rawText = response.text ?? "{}";
        const parsed = JSON.parse(rawText);

        // Never trust the model blindly — validate even though we constrained the schema
        const result = IntentResultSchema.safeParse(parsed);
        if (!result.success) {
            throw new Error(`Model returned invalid structured output: ${result.error.message}`);
        }

        return result.data;
    }
}