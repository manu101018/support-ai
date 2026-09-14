import { Type, FunctionDeclaration } from "@google/genai";
import { getPaymentByOrderId } from "../db/queries";
import { GetPaymentArgsSchema } from "./schemas";
import { toolError } from "./toolError";

// What the MODEL sees — name, description, and expected arguments
export const getPaymentToolDeclaration: FunctionDeclaration = {
    name: "getPaymentByOrderId",
    description:
        "Retrieves payment status, transaction ID, and amount for a given order ID. Use this when the customer asks whether their payment went through, was deducted, or failed — as distinct from asking about shipping/delivery status.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            orderId: {
                type: Type.NUMBER,
                description: "The numeric ID of the order to look up.",
            },
        },
        required: ["orderId"],
    },
}

// What YOUR CODE actually runs when the model requests this tool
export async function executeGetPaymentTool(args: unknown) {
    const parsed = GetPaymentArgsSchema.safeParse(args);
    if (!parsed.success) {
        return toolError("INVALID_ARGUMENTS", `Invalid arguments for getPaymentByOrderId: ${parsed.error.message}`);
    }

    try {
        const payment = await getPaymentByOrderId(parsed.data.orderId);
        if (!payment) {
            return toolError("NOT_FOUND", `No payment record found for order ${parsed.data.orderId}.`);
        }
        return payment;
    } catch (err) {
        console.error("getPaymentByOrderId execution error:", err);
        return toolError("EXECUTION_ERROR", "Something went wrong looking up this payment. Please try again.");
    }
}