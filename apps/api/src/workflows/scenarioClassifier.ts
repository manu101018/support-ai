import { GoogleGenAI } from "@google/genai";
import { ScenarioResult, ScenarioResultSchema, geminiScenarioSchema } from "../llm/schemas/scenarioSchema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const CLASSIFY_INSTRUCTION = `
Classify the customer's support message into exactly one scenario category
based on the underlying situation, not just keywords.

- payment_stuck_shipping: customer says they paid, and their order seems delayed/stuck/not shipped.
- payment_failed_confused: customer is confused or worried about a payment that may have failed or not gone through.
- policy_question: a general question about return/refund/shipping rules, not tied to their specific order's current state.
- order_status_check: a simple, direct request to check an order's current status.
- other: anything that doesn't clearly fit the above.

Respond only in the given JSON schema.
`.trim();

export async function classifyScenario(userMessage: string): Promise<ScenarioResult> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userMessage,
            config: {
                systemInstruction: CLASSIFY_INSTRUCTION,
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: geminiScenarioSchema,
            },
        });

        const parsed = JSON.parse(response.text ?? "{}");
        const result = ScenarioResultSchema.safeParse(parsed);

        if (!result.success) {
            console.warn("Scenario classification failed validation, defaulting to 'other':", result.error.message);
            return { scenario: "other", reasoning: "classification failed" };
        }

        return result.data;
    } catch (err) {
        console.error("Scenario classification failed, defaulting to 'other':", err);
        return { scenario: "other", reasoning: "classification error" };
    }
}