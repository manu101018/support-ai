import ollama from "ollama";
import { LLMProvider, GenerateReplyOptions } from "../types";
import { SUPPORT_AI_SYSTEM_PROMPT } from "../prompts";
import { IntentResult, IntentResultSchema } from "../schemas/intentSchema";
import { ollamaIntentJsonSchema } from "../schemas/ollamaIntentSchema";
import { toOllamaTools, stripThinkTags } from "./ollamaAdapters";
import { toolRegistry } from "../../tools/registry";

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

    async chatWithTools(userMessage: string): Promise<string> {
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
            return stripThinkTags(first.message.content);
        }

        const tool = toolRegistry[toolCall.function.name];
        if (!tool) {
            return `I tried to use a tool ("${toolCall.function.name}") that isn't available.`;
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

        return stripThinkTags(second.message.content);
    }
}