export interface ConversationContext {
    trustedValues: Set<string>;
}

export function createConversationContext(userMessage: string): ConversationContext {
    const trustedValues = new Set<string>();

    const emailMatches = userMessage.match(/[\w.-]+@[\w.-]+\.\w+/g) ?? [];
    emailMatches.forEach((e) => trustedValues.add(e.toLowerCase()));

    const numberMatches = userMessage.match(/\b\d+\b/g) ?? [];
    numberMatches.forEach((n) => trustedValues.add(n));

    return { trustedValues };
}

/** Call this after a tool legitimately resolves an identifier (e.g. email -> userId). */
export function addTrustedValue(context: ConversationContext, value: string | number) {
    context.trustedValues.add(String(value).toLowerCase());
}

const IDENTIFIER_FIELDS = ["orderId", "userId", "email"];

/*
 * Checks whether every identifier-shaped argument the model wants to pass
 * was either stated by the customer directly, or derived from a prior
 * verified tool result in this same conversation.
 */

export function authorizeToolArgs(context: ConversationContext, args: Record<string, unknown>): { authorized: boolean, reason?: string } {
    for (const field of IDENTIFIER_FIELDS) {
        if (field in args) {
            const value = String(args[field]).toLowerCase();
            if (!context.trustedValues.has(value)) {
                return {
                    authorized: false,
                    reason: `The value provided for "${field}" (${args[field]}) was not stated by the customer in this conversation and was not obtained from a verified lookup. Ask the customer to confirm this value directly instead of assuming it.`,
                }
            }
        }
    }
    return { authorized: true };
}