import { z } from "zod";
import { Type } from '@google/genai';

export const IntentResultSchema = z.object({
    intent: z.enum([
        "order_status",
        "payment_issue",
        "refund_request",
        "cancellation_request",
        "policy_question",
        "damaged_product",
        "general_question",
    ]),
    confidence: z.number().min(0).max(1),
    response: z.string(),
});

export type IntentResult = z.infer<typeof IntentResultSchema>;

// Gemini responseSchema — used to constrain the model's generation
export const geminiIntentResponseSchema = {
    type: Type.OBJECT,
    properties: {
        intent: {
            type: Type.STRING,
            enum: [
                "order_status",
                "payment_issue",
                "refund_request",
                "cancellation_request",
                "policy_question",
                "damaged_product",
                "general_question",
            ],
        },
        confidence: { type: Type.NUMBER },
        response: { type: Type.STRING },
    },
    required: ["intent", "confidence", "response"],
};