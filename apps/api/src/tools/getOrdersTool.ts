import { Type, FunctionDeclaration } from "@google/genai";
import { getOrdersByUserId } from "../db/queries";

export const getOrdersToolDeclaration: FunctionDeclaration = {
    name: "getOrdersByUserId",
    description:
        "Retrieves the list of all orders belonging to a customer, most recent first. Use this when the customer asks to see their orders, order history, or 'what did I order' without giving a specific order ID. Requires the customer's internal user ID, which you should only have after calling getCustomerByEmail.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            userId: {
                type: Type.NUMBER,
                description: "The customer's internal numeric user ID, obtained from getCustomerByEmail.",
            },
        },
        required: ["userId"],
    },
};

export async function executeGetOrdersTool(args: { userId: number }) {
    if (typeof args.userId !== "number" || args.userId <= 0) {
        return { error: "Invalid userId provided." };
    }

    const orders = await getOrdersByUserId(args.userId);

    if (orders.length === 0) {
        return { message: `No orders found for user ${args.userId}.`, orders: [] };
    }

    return { orders };
}