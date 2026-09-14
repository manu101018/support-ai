import { Type, FunctionDeclaration } from "@google/genai";
import { getCustomerByEmail } from "../db/queries";

// What the MODEL sees — name, description, and expected arguments
export const getCustomerToolDeclaration: FunctionDeclaration = {
    name: "getCustomerByEmail",
    description:
        "Retrieves a customer's profile (name, email, phone, account creation date) by their email address. Use this when you need to confirm who the customer is, or before looking up their orders if no order ID was given. Only use the email address the customer has provided in this conversation.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            email: {
                type: Type.STRING,
                description: "The customer's email address, exactly as provided by them.",
            },
        },
        required: ["email"],
    },
}

// What YOUR CODE actually runs when the model requests this tool
export async function executeGetCustomerTool(args: { email: string }) {
    if (typeof args.email !== "string" || !args.email.includes("@")) {
        return { error: "Invalid email provided." };
    }

    const customer = await getCustomerByEmail(args.email);

    if (!customer) {
        return { error: `No customer found with email ${args.email}.` };
    }

    return customer;
}