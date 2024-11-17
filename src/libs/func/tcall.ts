import { ucall } from './ucall';
import { isCoroutineFunc } from './utils';

type ErrorHandler<T> = (error: Error) => T | Promise<T>;
type ErrorMap<T> = Record<string, ErrorHandler<T>>;

interface TimingOptions<T> {
    initialDelay?: number;
    errorMsg?: string | null;
    suppressErr?: boolean;
    retryTiming?: boolean;
    retryTimeout?: number | null;
    retryDefault?: T;
    errorMap?: ErrorMap<T> | null;
}

/**
 * Execute a function asynchronously with timing and error handling.
 *
 * @param func The function to execute (coroutine or regular)
 * @param arg The argument to pass to the function
 * @param options Configuration options
 * @returns Function result, optionally with duration
 * 
 * @throws {Error} If execution exceeds the timeout
 * @throws {Error} If an error occurs and suppressErr is false
 * 
 * @example
 * ```typescript
 * async function slowFunc(x: number) {
 *     await new Promise(resolve => setTimeout(resolve, 1000));
 *     return x * 2;
 * }
 * 
 * const [result, duration] = await tcall(slowFunc, 5, { retryTiming: true });
 * console.log(`Result: ${result}, Duration: ${duration.toFixed(2)}s`);
 * // Result: 10, Duration: 1.00s
 * ```
 */
export async function tcall<T, U>(
    func: (arg: T) => U | Promise<U>,
    arg: T,
    options: TimingOptions<U> & { retryTiming: true }
): Promise<[U, number]>;
export async function tcall<T, U>(
    func: (arg: T) => U | Promise<U>,
    arg: T,
    options?: TimingOptions<U>
): Promise<U>;
export async function tcall<T, U>(
    func: (arg: T) => U | Promise<U>,
    arg: T,
    options: TimingOptions<U> = {}
): Promise<U | [U, number]> {
    const {
        initialDelay = 0,
        errorMsg = null,
        suppressErr = false,
        retryTiming = false,
        retryTimeout = null,
        retryDefault = null,
        errorMap = null
    } = options;

    const start = performance.now();

    try {
        if (initialDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, initialDelay * 1000));
        }

        async function executeWithTimeout(): Promise<U> {
            if (!retryTimeout) {
                return ucall(func, arg);
            }
            const timeoutPromise = new Promise<never>((_, reject) => {
                const timeoutId = setTimeout(() => {
                    clearTimeout(timeoutId);
                    reject(new Error('Timeout'));
                }, retryTimeout * 1000);
            });
            return Promise.race([
                ucall(func, arg),
                timeoutPromise
            ]);
        }

        const result = await executeWithTimeout();
        const duration = (performance.now() - start) / 1000;
        
        return retryTiming ? [result, duration] as [U, number] : result;

    } catch (e) {
        const error = e as Error;
        const duration = (performance.now() - start) / 1000;

        if (error instanceof Error && error.message === 'Timeout') {
            const errMsg = `${errorMsg || ''} Timeout ${retryTimeout} seconds exceeded`;
            if (suppressErr) {
                return retryTiming ? [retryDefault as U, duration] : retryDefault as U;
            }
            throw new Error(errMsg);
        }

        if (errorMap && error.constructor.name in errorMap) {
            const handler = errorMap[error.constructor.name];
            const handlerResult = await ucall(handler, error);
            return retryTiming ? [handlerResult, duration] : handlerResult;
        }

        const errMsg = errorMsg
            ? `${errorMsg} Error: ${error}`
            : `An error occurred in async execution: ${error}`;

        if (suppressErr) {
            return retryTiming ? [retryDefault as U, duration] : retryDefault as U;
        }

        throw new Error(errMsg);
    }
}
