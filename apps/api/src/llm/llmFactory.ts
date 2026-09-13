import { LLMProvider } from "./types";
import { GeminiProvider } from "./providers/geminiProvider";
import { OpenAIProvider } from "./providers/openaiProvider";
import { OllamaProvider } from "./providers/ollamaProvider";

export function createLLMProvider(providerName?: string): LLMProvider {
    const selected = (providerName ?? process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
    console.log(`[llmFactory] selected: ${selected}`);
    switch (selected) {
        case "gemini":
            return new GeminiProvider(process.env.GEMINI_API_KEY ?? "", process.env.GEMINI_MODEL ?? "gemini-3.7-flash");
        case "openai":
            return new OpenAIProvider();
        case "ollama":
            return new OllamaProvider(process.env.OLLAMA_MODEL ?? "qwen3:4b");
        default:
            throw new Error(`Unsupported LLM provider: "${selected}"`);
    }
}