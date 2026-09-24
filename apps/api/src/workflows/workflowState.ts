import { ScenarioResult } from "../llm/schemas/scenarioSchema";

export interface WorkflowState {
    scenario: ScenarioResult["scenario"];
    orderChecked: boolean;
    paymentChecked: boolean;
    policyChecked: boolean;
    orderStatus: string | null;
    paymentStatus: string | null;
    toolCallSequence: string[];
}

export function createWorkflowState(scenario: ScenarioResult["scenario"]): WorkflowState {
    return {
        scenario,
        orderChecked: false,
        paymentChecked: false,
        policyChecked: false,
        orderStatus: null,
        paymentStatus: null,
        toolCallSequence: [],
    };
}

/**
 * Updates workflow state based on a tool call that just executed.
 * This is intentionally simple pattern-matching on tool name + result shape —
 * NOT a generic solution, just enough to track THIS scenario's key facts.
 * A more general workflow engine (explicit graphs/state machines) is a
 * reasonable next step once you have more than one or two workflow shapes,
 * but that's premature to build with only one real scenario in hand.
 */
export function updateWorkflowState(
    state: WorkflowState,
    toolName: string,
    toolResult: any
): void {
    state.toolCallSequence.push(toolName);

    if (toolName === "getOrderById" && !toolResult?.error) {
        state.orderChecked = true;
        state.orderStatus = toolResult.status ?? null;
    }

    if (toolName === "getPaymentByOrderId" && !toolResult?.error) {
        state.paymentChecked = true;
        state.paymentStatus = toolResult.status ?? null;
    }

    if (toolName === "searchKnowledgeBase" && toolResult?.results?.length > 0) {
        state.policyChecked = true;
    }
}

/**
 * Scenario-specific guidance, looked up by classified scenario rather than
 * hardcoded to one case. Each entry checks whether ITS relevant state
 * conditions are met before returning guidance — deliberately still simple
 * per-scenario functions, not a generic rule engine. Add a new scenario by
 * adding a new case here, nothing else needs to change.
 */

export function getScenarioGuidance(state: WorkflowState): string {
    switch (state.scenario) {
        case "payment_stuck_shipping":
            if (state.paymentStatus === "success" && ["placed", "processing"].includes(state.orderStatus ?? "")) {
                return " NOTE: payment succeeded but the order status suggests it may be stuck — consider offering escalation to a human agent.";
            }
            return "";

        case "payment_failed_confused":
            if (state.paymentStatus === "failed") {
                return " NOTE: payment genuinely failed. Reassure the customer no charge should be pending, and mention they can retry the order.";
            }
            return "";

        case "policy_question":
            if (!state.policyChecked) {
                return " NOTE: this looks like a general policy question — make sure searchKnowledgeBase was actually used before answering, rather than answering from general knowledge.";
            }
            return "";

        default:
            return "";
    }
}