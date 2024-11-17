import { UNDEFINED } from '../../constants';
import { ucall } from './ucall';

interface RetryOptions<T> {
    numRetries?: number;
    initialDelay?: number;
    retryDelay?: number;
    backoffFactor?: number;
    retryDefault?: T;
    retryTimeout?: number | null;
    retryTiming?: boolean;
    verboseRetry?: boolean;
    errorMsg?: string | null;
}

/**
 * Retry a function asynchronously with customizable options.
 * 
 * @param func The function to execute (coroutine or regular)
 * @param arg The argument to pass to the function
 * @param options Configuration options
 * @returns Function result, optionally with duration
 * 
 * @throws {Error} If function fails after all retries
 * @throws {Error} If execution exceeds retryTimeout
 * 
 * @example
 * ```typescript
 * async function flakyFunc(x: number) {
 *     if (Math.random() < 0.5) {
 *         throw new Error("Random failure");
 *     }
 *     return x * 2;
 * }
 * 
 * const result = await rcall(flakyFunc, 5, { numRetries: 3 });
 * console.log(result); // 10
 * ```
 */
export async function rcall<T, U>(
    func: (arg: T) => U | Promise<U>,
    arg: T,
    options: RetryOptions<U> & { retryTiming: true }
): Promise<[U, number]>;
export async function rcall<T, U>(
    func: (arg: T) => U | Promise<U>,
    arg: T,
    options?: RetryOptions<U>
): Promise<U>;
export async function rcall<T, U>(
    func: (arg: T) => U | Promise<U>,
    arg: T,
    options: RetryOptions<U> = {}
): Promise<U | [U, number]> {
    const {
        numRetries = 0,
        initialDelay = 0,
        retryDelay: initialRetryDelay = 0,
        backoffFactor = 1,
        retryDefault = undefined,
        retryTimeout = null,
        retryTiming = false,
        verboseRetry = true,
        errorMsg = null
    } = options;

    let lastException: Error | null = null;
    let currentDelay = initialRetryDelay;
    const startTime = retryTiming ? performance.now() : 0;

    if (initialDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * 1000));
    }

    async function executeWithTimeout<V>(
        operation: () => Promise<V>
    ): Promise<V> {
        if (!retryTimeout) {
            return operation();
        }
        const timeoutPromise = new Promise<never>((_, reject) => {
            const timeoutId = setTimeout(() => {
                clearTimeout(timeoutId);
                reject(new Error('Timeout'));
            }, retryTimeout * 1000);
        });
        return Promise.race([
            operation(),
            timeoutPromise
        ]);
    }

    for (let attempt = 0; attempt <= numRetries; attempt++) {
        try {
            const result = await executeWithTimeout(() => ucall(func, arg));
            if (retryTiming) {
                const duration = (performance.now() - startTime) / 1000;
                return [result, duration] as [U, number];
            }
            return result;
        } catch (e) {
            const error = e as Error;
            lastException = error;

            if (attempt < numRetries) {
                if (verboseRetry) {
                    console.log(
                        `Attempt ${attempt + 1}/${numRetries + 1} failed: ${error}, retrying...`
                    );
                }
                await new Promise(resolve => 
                    setTimeout(resolve, currentDelay * 1000)
                );
                currentDelay *= backoffFactor;
            }
        }
    }

    if (retryDefault !== undefined) {
        if (retryTiming) {
            const duration = (performance.now() - startTime) / 1000;
            return [retryDefault, duration] as [U, number];
        }
        return retryDefault;
    }

    if (lastException) {
        throw new Error(
            `${errorMsg || ''} Operation failed after ${numRetries + 1} attempts: ${lastException}`
        );
    }

    throw new Error(
        `${errorMsg || ''} Operation failed after ${numRetries + 1} attempts`
    );
}
