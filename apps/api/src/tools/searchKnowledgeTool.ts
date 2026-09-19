import { Type, FunctionDeclaration } from "@google/genai";
import { searchKnowledge } from "../rag/search";
import { z } from "zod";
import { toolError } from "./toolError";

export const SearchKnowledgeArgsSchema = z.object({
    query: z.string().min(3),
});

export const searchKnowledgeToolDeclaration: FunctionDeclaration = {
    name: "searchKnowledgeBase",
    description:
        "Searches company policy documents (return, refund, shipping policies) for information relevant to the customer's question. Use this whenever the customer asks about policies, rules, timelines, or 'what happens if...' scenarios — do NOT answer policy questions from memory.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            query: {
                type: Type.STRING,
                description: "The customer's question or topic to search for in company policy documents.",
            },
        },
        required: ["query"],
    },
};

export async function executeSearchKnowledgeTool(args: unknown) {
    const parsed = SearchKnowledgeArgsSchema.safeParse(args);
    if (!parsed.success) {
        return toolError("INVALID_ARGUMENTS", `Invalid arguments for searchKnowledgeBase: ${parsed.error.message}`);
    }

    try {
        const results = await searchKnowledge(parsed.data.query);
        if (results.length === 0) {
            return toolError("NOT_FOUND", "No relevant policy information found.");
        }
        return {
            results: results.map((r) => ({ source: r.sourceFile, content: r.content })),
        };
    } catch (err) {
        console.error("searchKnowledgeBase execution error:", err);
        return toolError("EXECUTION_ERROR", "Something went wrong searching company policies. Please try again.");
    }
}