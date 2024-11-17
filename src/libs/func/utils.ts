/**
 * Convert a synchronous function to an asynchronous function
 * using Promise resolution.
 *
 * @param fn The synchronous function to convert
 * @returns The asynchronous version of the function
 */
export function forceAsync<T, Args extends any[]>(
    fn: (...args: Args) => T
): (...args: Args) => Promise<T> {
    return async (...args: Args) => {
        const result = fn(...args);
        return result;
    };
}

/**
 * Check if a function is a coroutine function (async function).
 *
 * @param func The function to check
 * @returns True if the function is a coroutine function, False otherwise
 */
export function isCoroutineFunc(func: (...args: any[]) => any): boolean {
    return func.constructor.name === 'AsyncFunction' || 
           func.toString().includes('async');
}

/**
 * Custom error handler for mapping error types to handlers.
 *
 * @param error The error to handle
 * @param errorMap Dictionary mapping exception types to error handlers
 * @returns Result from the error handler if found, otherwise logs error
 */
export async function customErrorHandler<T>(
    error: Error,
    errorMap: Record<string, (error: Error) => T | Promise<T>>
): Promise<T | null> {
    for (const [errorType, handler] of Object.entries(errorMap)) {
        if (error.constructor.name === errorType) {
            if (isCoroutineFunc(handler)) {
                return await handler(error);
            }
            return await Promise.resolve(handler(error));
        }
    }
    console.error(`Unhandled error: ${error}`);
    return null;
}

/**
 * Limit the concurrency of function execution using a semaphore.
 *
 * @param func The function to limit concurrency for
 * @param limit The maximum number of concurrent executions
 * @returns The function wrapped with concurrency control
 */
export function maxConcurrent<T, Args extends any[]>(
    func: (...args: Args) => T | Promise<T>,
    limit: number
): (...args: Args) => Promise<T> {
    let asyncFunc = isCoroutineFunc(func) 
        ? func 
        : forceAsync(func);

    const semaphore = {
        queue: [] as Array<() => void>,
        count: 0,
        async acquire() {
            if (this.count >= limit) {
                await new Promise<void>(resolve => this.queue.push(resolve));
            }
            this.count++;
        },
        release() {
            this.count--;
            const next = this.queue.shift();
            if (next) next();
        }
    };

    return async (...args: Args) => {
        await semaphore.acquire();
        try {
            const result = await asyncFunc(...args);
            return result;
        } finally {
            semaphore.release();
        }
    };
}
