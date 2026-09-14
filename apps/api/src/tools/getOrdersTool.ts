import { Type, FunctionDeclaration } from "@google/genai";
import { getOrdersByUserId } from "../db/queries";
import { GetOrdersArgsSchema } from "./schemas";
import { toolError } from "./toolError";

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

export async function executeGetOrdersTool(args: unknown) {
    const parsed = GetOrdersArgsSchema.safeParse(args);
    if (!parsed.success) {
        return toolError("INVALID_ARGUMENTS", `Invalid arguments for getOrdersByUserId: ${parsed.error.message}`);
    }

    try {
        const orders = await getOrdersByUserId(parsed.data.userId);
        if (orders.length === 0) {
            return { message: `No orders found for user ${parsed.data.userId}.`, orders: [] };
        }
        return { orders };
    } catch (err) {
        console.error("getOrdersByUserId execution error:", err);
        return toolError("EXECUTION_ERROR", "Something went wrong looking up orders. Please try again.");
    }
}