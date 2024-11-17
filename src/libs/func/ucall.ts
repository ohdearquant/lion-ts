import { isCoroutineFunc } from './utils';

/**
 * Execute a function asynchronously.
 *
 * @param func The function to be executed (coroutine or regular)
 * @param arg The argument to pass to the function
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
    arg: T
): Promise<U> {
    if (isCoroutineFunc(func)) {
        return await func(arg);
    } else {
        const result = func(arg);
        return await Promise.resolve(result);
    }
}
