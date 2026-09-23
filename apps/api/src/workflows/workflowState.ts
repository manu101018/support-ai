export interface WorkflowState {
    orderChecked: boolean;
    paymentChecked: boolean;
    policyChecked: boolean;
    orderStatus: string | null;
    paymentStatus: string | null;
    toolCallSequence: string[];
}

export function createWorkflowState(): WorkflowState {
    return {
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
 * Detects the specific "paid but not shipped" pattern from accumulated state —
 * used to decide whether this looks like something worth flagging/escalating.
 */
export function isPaidButStuck(state: WorkflowState): boolean {
    return (
        state.paymentStatus === "success" &&
        state.orderStatus !== null &&
        ["placed", "processing"].includes(state.orderStatus)
    );
}