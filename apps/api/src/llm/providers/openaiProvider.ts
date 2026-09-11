import { LLMProvider, GenerateReplyOptions } from "../types";

export class OpenAIProvider implements LLMProvider {
    name = "openai";

    async generateReply(_userMessage: string, _options?: GenerateReplyOptions): Promise<string> {
        throw new Error("OpenAIProvider not implemented yet — planned for Phase 9 guardrail comparisons.");
    }
}