import ollama from "ollama";
import { LLMProvider, GenerateReplyOptions } from "../types";
import { SUPPORT_AI_SYSTEM_PROMPT } from "../prompts";
import { IntentResult, IntentResultSchema } from "../schemas/intentSchema";
import { ollamaIntentJsonSchema } from "../schemas/ollamaIntentSchema";
import { toOllamaTools, stripThinkTags } from "./ollamaAdapters";
import { toolRegistry } from "../../tools/registry";
import { ChatResponse, ChatResponseSchema } from "../schemas/chatResponseSchema";

export class OllamaProvider implements LLMProvider {
    name = "ollama";
    private model: string;

    constructor(model = "qwen3:4b") {
        this.model = model;
    }

    async generateReply(userMessage: string, options: GenerateReplyOptions = {}): Promise<string> {
        const response = await ollama.chat({
            model: this.model,
            messages: [
                { role: "system", content: options.systemInstruction ?? SUPPORT_AI_SYSTEM_PROMPT },
                { role: "user", content: userMessage },
            ],
            options: { temperature: options.temperature ?? 0.3 },
        });

        return stripThinkTags(response.message.content);
    }

    async classifyIntent(userMessage: string): Promise<IntentResult> {
        const response = await ollama.chat({
            model: this.model,
            messages: [
                {
                    role: "system",
                    content: `${SUPPORT_AI_SYSTEM_PROMPT}\n\nClassify the user's message and respond ONLY with valid JSON matching the given schema. No extra text, no thinking, just the JSON object.`,
                },
                { role: "user", content: userMessage },
            ],
            format: ollamaIntentJsonSchema,
            options: { temperature: 0.2 },
        });

        const cleaned = stripThinkTags(response.message.content);

        let parsed: unknown;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            throw new Error(`Ollama returned non-JSON output: ${cleaned}`);
        }

        const result = IntentResultSchema.safeParse(parsed);
        if (!result.success) {
            throw new Error(`Model returned invalid structured output: ${result.error.message}`);
        }

        return result.data;
    }

    async chatWithTools(userMessage: string): Promise<ChatResponse> {
        const messages: any[] = [
            { role: "system", content: SUPPORT_AI_SYSTEM_PROMPT },
            { role: "user", content: userMessage },
        ];

        const first = await ollama.chat({
            model: this.model,
            messages,
            tools: toOllamaTools(),
            options: { temperature: 0.3 },
        });

        const toolCall = first.message.tool_calls?.[0];

        if (!toolCall) {
            return this.finalizeResponse(messages, stripThinkTags(first.message.content));
        }

        const tool = toolRegistry[toolCall.function.name];
        if (!tool) {
            return this.finalizeResponse(messages, `I tried to use a tool ("${toolCall.function.name}") that isn't available.`);
        }

        const args =
            typeof toolCall.function.arguments === "string"
                ? JSON.parse(toolCall.function.arguments)
                : toolCall.function.arguments;

        console.log(`[tool call - ollama] ${toolCall.function.name}(${JSON.stringify(args)})`);
        const toolResult = await tool.execute(args);

        messages.push(first.message);
        messages.push({
            role: "tool",
            content: JSON.stringify(toolResult),
        });

        const second = await ollama.chat({
            model: this.model,
            messages,
            tools: toOllamaTools(),
            options: { temperature: 0.3 },
        });

        return this.finalizeResponse(messages, stripThinkTags(second.message.content));
    }

    private async finalizeResponse(messages: any[], draftAnswer: string): Promise<ChatResponse> {
        messages.push({
            role: "user",
            content: `Based on the conversation so far, provide your final answer in the required JSON format. If you used searchKnowledgeBase results, list each one used in "citations" with its exact source and heading. If you didn't need to search policies (e.g. this was a pure order/payment lookup, or no tool was used), return an empty citations array. Draft answer for reference: ${draftAnswer}`,
        });

        const response = await ollama.chat({
            model: this.model,
            messages,
            options: { temperature: 0.2 },
        });

        const cleaned = stripThinkTags(response.message.content);

        let parsed: unknown;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            throw new Error(`Ollama returned non-JSON output: ${cleaned}`);
        }

        const result = ChatResponseSchema.safeParse(parsed);
        if (!result.success) {
            throw new Error(`Model returned invalid structured output: ${result.error.message}`);
        }

        return result.data;
    }
}