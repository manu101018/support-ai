import { LLMProvider } from "./types";
import { GeminiProvider } from "./providers/geminiProvider";
import { OpenAIProvider } from "./providers/openaiProvider";

export function createLLMProvider(providerName?: string): LLMProvider {
    const selected = (providerName ?? process.env.LLM_PROVIDER ?? "gemini").toLowerCase();

    switch (selected) {
        case "gemini":
            return new GeminiProvider(process.env.GEMINI_API_KEY ?? "", process.env.GEMINI_MODEL ?? "gemini-3.7-flash");
        case "openai":
            return new OpenAIProvider();
        default:
            throw new Error(`Unsupported LLM provider: "${selected}"`);
    }
}