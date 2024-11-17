import { isCoroutineFunc, forceAsync, customErrorHandler } from './utils';

type ErrorHandler = (error: Error) => any;
type ErrorMap = Record<string, ErrorHandler>;

/**
 * Execute a function asynchronously with error handling.
 *
 * @param func The function to be executed (coroutine or regular)
 * @param arg The argument to pass to the function
 * @param options Configuration options
 * @returns The result of the function call
 * 
 * @throws {Error} Any unhandled exception from the function execution
 * 
 * @example
 * ```typescript
 * async function exampleFunc(x: number) {
 *     return x * 2;
 * }
 * await ucall(exampleFunc, 5);  // 10
 * 
 * await ucall(x => x + 1, 5);  // Non-coroutine function, returns 6
 * ```
 */
export async function ucall<T, U>(
    func: (arg: T) => U | Promise<U>,
    arg: T,
    options: {
        errorMap?: ErrorMap | null;
    } = {}
): Promise<U> {
    const { errorMap = null } = options;

    try {
        if (isCoroutineFunc(func)) {
            return await func(arg);
        } else {
            const result = func(arg);
            return await Promise.resolve(result);
        }
    } catch (e) {
        const error = e as Error;
        if (errorMap) {
            const result = await customErrorHandler(error, errorMap);
            if (result !== null) {
                return result as U;
            }
        }
        throw error;
    }
}
