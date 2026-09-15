// Postgres/network error codes that represent a TRANSIENT problem —
// worth retrying. Everything else (bad SQL, constraint violation,
// invalid input) is permanent and must fail immediately.
const RETRYABLE_ERROR_CODES = new Set([
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "57P01", // Postgres: admin shutdown / connection terminated
    "53300", // Postgres: too many connections
]);

function isRetryableError(err: any): boolean {
    const code = err?.code;
    return typeof code === "string" && RETRYABLE_ERROR_CODES.has(code);
}

export async function withToolRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    baseDelayMs = 300
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            if (!isRetryableError(err) || attempt === maxRetries) {
                throw err;
            }

            const delay = baseDelayMs * Math.pow(2, attempt);
            console.warn(`[tool retry] transient error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}):`, err);
            await new Promise((r) => setTimeout(r, delay));
        }
    }

    throw lastError;
}

export async function withToolTimeout<T>(fn: () => Promise<T>, ms = 5000): Promise<T> {
    return Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(Object.assign(new Error("Tool execution timed out"), { code: "TOOL_TIMEOUT" })), ms)
        ),
    ]);
}