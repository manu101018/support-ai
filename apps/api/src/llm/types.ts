export interface GenerateReplyOptions {
    temperature?: number;
    systemInstruction?: string;
}

export interface LLMProvider {
    name: string;
    generateReply: (userMessage: string, options?: GenerateReplyOptions) => Promise<string>;
}
