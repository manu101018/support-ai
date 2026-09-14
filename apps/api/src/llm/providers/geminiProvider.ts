import { GoogleGenAI } from "@google/genai";
import { LLMProvider, GenerateReplyOptions } from "../types";
import { SUPPORT_AI_SYSTEM_PROMPT } from "../prompts";
import { IntentResult, IntentResultSchema, geminiIntentResponseSchema } from "../schemas/intentSchema";
import { allToolDeclarations, toolRegistry } from "../../tools/registry";
import { withRetry } from "../retry";
import { createConversationContext, addTrustedValue, authorizeToolArgs } from "../../tools/authorization";
import { toolError } from "../../tools/toolError";

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
            { role: "user", parts: [{ text: userMessage }] },
        ];

        const context = createConversationContext(userMessage);

        const MAX_TOOL_ROUNDS = process.env.MAX_TOOL_ROUNDS ? parseInt(process.env.MAX_TOOL_ROUNDS) : 3; // safety cap — never loop forever

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const response = await withRetry(() =>
                this.ai.models.generateContent({
                    model: this.model,
                    contents,
                    config: {
                        systemInstruction: SUPPORT_AI_SYSTEM_PROMPT,
                        temperature: 0.3,
                        tools: [{ functionDeclarations: allToolDeclarations }],
                    },
                })
            );

            const functionCall = response.functionCalls?.[0];

            // No tool requested — model is done, return its answer
            if (!functionCall) {
                return response.text ?? "Sorry, I couldn't generate a response.";
            }

            const tool = toolRegistry[functionCall.name!];
            if (!tool) {
                return `I tried to use a tool ("${functionCall.name}") that isn't available.`;
            }

            // Preserve the model's ACTUAL content (thought_signature intact)
            const modelContent = response.candidates?.[0]?.content;
            if (!modelContent) {
                throw new Error("Expected model content with function call, got none.");
            }
            contents.push(modelContent);

            // --- AUTHORIZATION CHECK — before any execution ---

            const authCheck = authorizeToolArgs(context, functionCall.args ?? {});
            let toolResult: any;

            if (!authCheck.authorized) {
                console.warn(`[round ${round}] BLOCKED unauthorized args:`, functionCall.args, authCheck.reason);
                toolResult = toolError("UNAUTHORIZED_ARGUMENT", authCheck.reason!);
            } else {
                console.log(`[round ${round}] tool call: ${functionCall.name}(${JSON.stringify(functionCall.args)})`);
                toolResult = await tool.execute(functionCall.args);
                console.log(`[round ${round}] tool result:`, JSON.stringify(toolResult));

                // Legitimate identity resolution — trust the derived value going forward
                if (functionCall.name === "getCustomerByEmail" && toolResult?.id) {
                    addTrustedValue(context, toolResult.id);
                }
            }


            console.log(`[round ${round}] tool call: ${functionCall.name}(${JSON.stringify(functionCall.args)})`);
            console.log(`[round ${round}] tool result:`, JSON.stringify(toolResult));

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

            // loop continues — model gets another turn, may call another tool or finally answer
        }

        return "I wasn't able to complete this request after several steps — could you rephrase or provide more details?";
    }
}