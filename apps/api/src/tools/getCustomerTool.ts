import { Type, FunctionDeclaration } from "@google/genai";
import { getCustomerByEmail } from "../db/queries";
import { GetCustomerArgsSchema } from "./schemas";
import { toolError } from "./toolError";

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
export async function executeGetCustomerTool(args: unknown) {
    const parsed = GetCustomerArgsSchema.safeParse(args);
    if (!parsed.success) {
        return toolError("INVALID_ARGUMENTS", `Invalid arguments for getCustomerByEmail: ${parsed.error.message}`);
    }

    try {
        const customer = await getCustomerByEmail(parsed.data.email);
        if (!customer) {
            return toolError("NOT_FOUND", `No customer found with email ${parsed.data.email}.`);
        }
        return customer;
    } catch (err) {
        console.error("getCustomerByEmail execution error:", err);
        return toolError("EXECUTION_ERROR", "Something went wrong looking up this customer. Please try again.");
    }
}