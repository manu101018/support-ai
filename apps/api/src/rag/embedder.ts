import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
    if (ai) {
        return ai;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not set. Add it to .env before running ingest.");
    }

    ai = new GoogleGenAI({ apiKey });
    return ai;
}

export async function embedText(text: string): Promise<number[]> {
    const response = await getClient().models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: { outputDimensionality: 768 },
    });

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
        throw new Error("Embedding API returned no values.");
    }
    return embedding;
}

export async function embedDocument(text: string): Promise<number[]> {
    const response = await getClient().models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 },
    });
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) throw new Error("Embedding API returned no values.");
    return embedding;
}

export async function embedQuery(text: string): Promise<number[]> {
    const response = await getClient().models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
        config: { taskType: "RETRIEVAL_QUERY", outputDimensionality: 768 },
    });
    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) throw new Error("Embedding API returned no values.");
    return embedding;
}