import { z } from "zod";
import { Type } from "@google/genai";

export const CitationSchema = z.object({
    source: z.string(),
    heading: z.string(),
});

export const ChatResponseSchema = z.object({
    message: z.string(),
    citations: z.array(CitationSchema),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const geminiChatResponseSchema = {
    type: Type.OBJECT,
    properties: {
        message: { type: Type.STRING, description: "The natural-language reply to the customer." },
        citations: {
            type: Type.ARRAY,
            description: "List of policy sources actually used to answer, if any. Empty array if no knowledge base search was needed.",
            items: {
                type: Type.OBJECT,
                properties: {
                    source: { type: Type.STRING, description: "The source_file value from a searchKnowledgeBase result." },
                    heading: { type: Type.STRING, description: "The heading value from that same result." },
                },
                required: ["source", "heading"],
            },
        },
    },
    required: ["message", "citations"],
};