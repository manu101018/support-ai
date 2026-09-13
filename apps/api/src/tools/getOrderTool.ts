import { Type, FunctionDeclaration } from "@google/genai";
import { getOrderById } from "../db/queries";

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
export async function executeGetOrderTool(args: { orderId: number }) {
    if(typeof args.orderId != 'number' || args.orderId <= 0){
        return { error: "Invalid orderId provided." };
    }

    const order = await getOrderById(args.orderId);

    if(!order){
        return { error: `No order found with ID ${args.orderId}.` };
    }

    return order;
}