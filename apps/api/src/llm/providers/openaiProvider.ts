import { LLMProvider, GenerateReplyOptions } from "../types";
import { IntentResult } from "../schemas/intentSchema";

export class OpenAIProvider implements LLMProvider {
    name = "openai";

    async generateReply(_userMessage: string, _options?: GenerateReplyOptions): Promise<string> {
        throw new Error("OpenAIProvider not implemented yet — planned for Phase 9 guardrail comparisons.");
    }

    async classifyIntent(_userMessage: string): Promise<IntentResult> {
        throw new Error("OpenAIProvider not implemented yet.");
    }

    async chatWithTools(_userMessage: string): Promise<string> {
        throw new Error("OpenAIProvider not implemented yet.");
    }
}