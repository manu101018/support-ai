export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    baseDelayMs = 1500
): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err: any) {
            lastError = err;
            const isRateLimited = err?.status === 429;
            const isRetryable = isRateLimited || err?.status === 503;

            if (!isRetryable || attempt === maxRetries) break;

            const delay = baseDelayMs * Math.pow(2, attempt);
            console.warn(`Retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries}) due to:`, err?.message);
            await new Promise((r) => setTimeout(r, delay));
        }
    }

    throw lastError;
}