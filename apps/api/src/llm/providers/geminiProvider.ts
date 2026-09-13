import { GoogleGenAI } from "@google/genai";
import { LLMProvider, GenerateReplyOptions } from "../types";
import { SUPPORT_AI_SYSTEM_PROMPT } from "../prompts";
import { IntentResult, IntentResultSchema, geminiIntentResponseSchema } from "../schemas/intentSchema";
import { allToolDeclarations, toolRegistry } from "../../tools/registry";
import { withRetry } from "../retry";

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
        const response = await withRetry(() => this.ai.models.generateContent({
            model: this.model,
            contents: userMessage,
            config: {
                systemInstruction: options.systemInstruction ?? SUPPORT_AI_SYSTEM_PROMPT,
                temperature: options.temperature ?? 0.3,
            },
        }));

        return response.text ?? "Sorry, I couldn't generate a response.";
    }

    async classifyIntent(userMessage: string): Promise<IntentResult> {
        const response = await withRetry(() => this.ai.models.generateContent({
            model: this.model,
            contents: userMessage,
            config: {
                systemInstruction: `${SUPPORT_AI_SYSTEM_PROMPT}\n\nClassify the user's message and respond ONLY in the given JSON schema. The "response" field should be a short, professional reply consistent with the rules above.`,
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: geminiIntentResponseSchema,
            },
        }));

        const rawText = response.text ?? "{}";
        const parsed = JSON.parse(rawText);

        // Never trust the model blindly — validate even though we constrained the schema
        const result = IntentResultSchema.safeParse(parsed);
        if (!result.success) {
            throw new Error(`Model returned invalid structured output: ${result.error.message}`);
        }

        return result.data;
    }

    async chatWithTools(userMessage: string): Promise<string> {
        const contents: any[] = [
            { role: 'user', parts: [{ text: userMessage }] }
        ]

        const first = await this.ai.models.generateContent({
            model: this.model,
            contents,
            config: {
                systemInstruction: SUPPORT_AI_SYSTEM_PROMPT,
                temperature: 0.3,
                tools: [{ functionDeclarations: allToolDeclarations }]
            }
        })

        const functionCall = first.functionCalls?.[0];

        if (!functionCall) {
            return first.text ?? "Sorry, I couldn't generate a response.";
        }

        const tool = toolRegistry[functionCall.name!];
        if (!tool) {
            return `I tried to use a tool ("${functionCall.name}") that isn't available.`;
        }

        console.log(`[tool call] ${functionCall.name}(${JSON.stringify(functionCall.args)})`);
        const toolResult = await tool.execute(functionCall.args);

        // Use the model's ACTUAL returned content (preserves thought_signature) —
        // do not hand-construct this turn, or Gemini 3.x rejects it.

        const modelContent = first.candidates?.[0]?.content;
        if (!modelContent) {
            throw new Error("Expected model content with function call, got none.");
        }
        contents.push(modelContent);

        // Second call: send the tool's real result back so the model can respond using it
        contents.push({
            role: "user",
            parts: [
                {
                    functionResponse: {
                        name: functionCall.name!,
                        response: { result: toolResult },
                    },
                },
            ],
        });

        const second = await this.ai.models.generateContent({
            model: this.model,
            contents,
            config: {
                systemInstruction: SUPPORT_AI_SYSTEM_PROMPT,
                temperature: 0.3,
                tools: [{ functionDeclarations: allToolDeclarations }],
            },
        });

        return second.text ?? "Sorry, I couldn't generate a response.";
    }
}