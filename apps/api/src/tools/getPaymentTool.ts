import { Type, FunctionDeclaration } from "@google/genai";
import { getPaymentByOrderId } from "../db/queries";

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
export async function executeGetPaymentTool(args: { orderId: number }) {
    if (typeof args.orderId != 'number' || args.orderId <= 0) {
        return { error: "Invalid orderId provided." };
    }

    const payment = await getPaymentByOrderId(args.orderId);

    if (!payment) {
        return { error: `No payment record found for order ${args.orderId}.` };
    }

    return payment;
}