import { Type, FunctionDeclaration } from "@google/genai";
import { getOrderById } from "../db/queries";
import { GetOrderArgsSchema } from "./schemas";
import { toolError } from "./toolError";

// What the MODEL sees — name, description, and expected arguments
export const getOrderToolDeclaration: FunctionDeclaration = {
    name: "getOrderById",
    description:
        "Retrieves a single order's status, payment status, total amount, and customer info by order ID. Use this whenever the customer asks about the status of a specific order.",
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
export async function executeGetOrderTool(args: unknown) {
    const parsed = GetOrderArgsSchema.safeParse(args);
    if (!parsed.success) {
        return toolError("INVALID_ARGUMENTS", `Invalid arguments for getOrderById: ${parsed.error.message}`);
    }

    try {
        const order = await getOrderById(parsed.data.orderId);
        if (!order) {
            return toolError("NOT_FOUND", `No order found with ID ${parsed.data.orderId}.`);
        }
        return order;
    } catch (err) {
        console.error("getOrderById execution error:", err);
        return toolError("EXECUTION_ERROR", "Something went wrong looking up this order. Please try again.");
    }
}