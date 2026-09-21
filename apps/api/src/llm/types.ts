import { IntentResult } from "./schemas/intentSchema";
import { ChatResponse } from "./schemas/chatResponseSchema";

export interface GenerateReplyOptions {
    temperature?: number;
    systemInstruction?: string;
}

export interface LLMProvider {
    name: string;
    generateReply: (userMessage: string, options?: GenerateReplyOptions) => Promise<string>;
    classifyIntent: (userMessage: string) => Promise<IntentResult>;
    chatWithTools(userMessage: string): Promise<ChatResponse>;
}
