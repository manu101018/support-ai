import { z } from "zod";
import { Type } from "@google/genai";

export const SCENARIOS = [
    "payment_stuck_shipping",   // paid, but order status suggests it's not moving
    "payment_failed_confused",  // customer confused about a failed/pending payment
    "policy_question",          // general policy question, no specific order involved
    "order_status_check",       // simple, direct "where's my order" with an ID
    "other",                    // doesn't fit a known pattern — handled generically
] as const;

export const ScenarioResultSchema = z.object({
    scenario: z.enum(SCENARIOS),
    reasoning: z.string(),
});

export type ScenarioResult = z.infer<typeof ScenarioResultSchema>;

export const geminiScenarioSchema = {
    type: Type.OBJECT,
    properties: {
        scenario: { type: Type.STRING, enum: [...SCENARIOS] },
        reasoning: { type: Type.STRING, description: "One short sentence explaining the classification." },
    },
    required: ["scenario", "reasoning"],
};