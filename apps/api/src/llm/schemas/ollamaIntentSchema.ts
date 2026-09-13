export const ollamaIntentJsonSchema = {
    type: "object",
    properties: {
        intent: {
            type: "string",
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
        confidence: { type: "number" },
        response: { type: "string" },
    },
    required: ["intent", "confidence", "response"],
};