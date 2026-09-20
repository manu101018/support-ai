import { Type, FunctionDeclaration } from "@google/genai";
import { searchKnowledge } from "../rag/search";
import { z } from "zod";
import { toolError } from "./toolError";
import { rewriteQuery } from "../rag/queryRewriter";

export const SearchKnowledgeArgsSchema = z.object({
    query: z.string().min(3),
});

export const searchKnowledgeToolDeclaration: FunctionDeclaration = {
    name: "searchKnowledgeBase",
    description: `Searches company policy documents (return, refund, shipping policies) for information relevant to the customer's question. Use this for GENERAL policy questions — including 'what happens if payment was deducted but my order was never confirmed', return windows, refund timelines, and shipping coverage — even if the customer describes their own situation, as long as they haven't given a specific order ID to look up. Only use getOrderById/getPaymentByOrderId instead when the customer gives a specific order ID and wants that order's actual current status.`,
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
        return {
            message: "No sufficiently relevant policy information was found for this question. Do not guess — tell the customer you'll need to check and follow up, or ask a clarifying question.",
            results: [],
        };
    }

    try {
        const rewritten = await rewriteQuery(parsed.data.query);

        if (rewritten !== parsed.data.query) {
            console.log(`[query rewrite] "${parsed.data.query}" -> "${rewritten}"`);
        };

        const results = await searchKnowledge(rewritten);
        if (results.length === 0) {
            return toolError("NOT_FOUND", "No sufficiently relevant policy information was found for this question. Do not guess — tell the customer you'll need to check and follow up, or ask a clarifying question.");
        }
        return {
            results: results.map((r) => ({ source: r.sourceFile, heading: r.heading, content: r.content })),
        };
    } catch (err) {
        console.error("searchKnowledgeBase execution error:", err);
        return toolError("EXECUTION_ERROR", "Something went wrong searching company policies. Please try again.");
    }
}