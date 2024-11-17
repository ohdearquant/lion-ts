import { ucall } from './ucall';
import { isCoroutineFunc } from './utils';

type ErrorHandler<T> = (error: Error) => T | Promise<T>;
type ErrorMap<T> = Record<string, ErrorHandler<T>>;

interface ParallelOptions<T> {
    numRetries?: number;
    initialDelay?: number;
    retryDelay?: number;
    backoffFactor?: number;
    retryDefault?: T;
    retryTimeout?: number | null;
    retryTiming?: boolean;
    verboseRetry?: boolean;
    errorMsg?: string | null;
    errorMap?: ErrorMap<T> | null;
    maxConcurrent?: number | null;
    throttlePeriod?: number | null;
    arg?: any;
}

/**
 * Execute multiple functions asynchronously in parallel with options.
 * 
 * @param funcs Array of functions to execute in parallel
 * @param options Configuration options
 * @returns List of results, optionally with execution times if retryTiming is true
 * 
 * @throws {Error} If execution exceeds retryTimeout
 * @throws {Error} Any unhandled exception from function executions
 * 
 * @example
 * ```typescript
 * async function func1(x: number) {
 *     await new Promise(resolve => setTimeout(resolve, 1000));
 *     return x * 2;
 * }
 * 
 * async function func2(x: number) {
 *     await new Promise(resolve => setTimeout(resolve, 500));
 *     return x + 10;
 * }
 * 
 * const results = await pcall([func1, func2], { 
 *     retryTiming: true,
 *     arg: 5
 * });
 * // Results: [[10, 1.00], [15, 0.50]]
 * ```
 */
export async function pcall<T, A>(
    funcs: Array<(arg: A) => T | Promise<T>>,
    options: ParallelOptions<T> & { arg?: A } = {}
): Promise<T[] | Array<[T, number]>> {
    const {
        numRetries = 0,
        initialDelay = 0,
        retryDelay = 0,
        backoffFactor = 1,
        retryDefault = undefined,
        retryTimeout = null,
        retryTiming = false,
        verboseRetry = true,
        errorMsg = null,
        errorMap = null,
        maxConcurrent = null,
        throttlePeriod = null,
        arg
    } = options;

    if (initialDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, initialDelay * 1000));
    }

    const semaphore = maxConcurrent ? {
        queue: [] as Array<() => void>,
        count: 0,
        async acquire() {
            if (this.count >= maxConcurrent) {
                await new Promise<void>(resolve => this.queue.push(resolve));
            }
            this.count++;
        },
        release() {
            this.count--;
            const next = this.queue.shift();
            if (next) next();
        }
    } : null;

    const throttleDelay = throttlePeriod ? throttlePeriod * 1000 : 0;

    async function executeTask(
        func: (arg: A) => T | Promise<T>,
        index: number
    ): Promise<[number, T, number?]> {
        let attempts = 0;
        let currentDelay = retryDelay;

        while (true) {
            try {
                if (retryTiming) {
                    const startTime = performance.now();
                    let result: T;
                    if (retryTimeout) {
                        const timeoutPromise = new Promise<never>((_, reject) => {
                            setTimeout(() => reject(new Error('Timeout')), retryTimeout * 1000);
                        });
                        result = await Promise.race([
                            ucall(func, arg),
                            timeoutPromise
                        ]);
                    } else {
                        result = await ucall(func, arg);
                    }
                    const endTime = performance.now();
                    return [index, result, (endTime - startTime) / 1000];
                }

                let result: T;
                if (retryTimeout) {
                    const timeoutPromise = new Promise<never>((_, reject) => {
                        setTimeout(() => reject(new Error('Timeout')), retryTimeout * 1000);
                    });
                    result = await Promise.race([
                        ucall(func, arg),
                        timeoutPromise
                    ]);
                } else {
                    result = await ucall(func, arg);
                }
                return [index, result];
            } catch (e) {
                const error = e as Error;
                if (errorMap && error.constructor.name in errorMap) {
                    const handler = errorMap[error.constructor.name];
                    const handlerResult = await ucall(handler, error);
                    return [index, handlerResult];
                }

                attempts++;
                if (attempts <= numRetries) {
                    if (verboseRetry) {
                        console.log(
                            `Attempt ${attempts}/${numRetries + 1} failed: ${error}, retrying...`
                        );
                    }
                    await new Promise(resolve => 
                        setTimeout(resolve, currentDelay * 1000)
                    );
                    currentDelay *= backoffFactor;
                } else {
                    if (retryDefault !== undefined) {
                        return [index, retryDefault];
                    }
                    throw error;
                }
            }
        }
    }

    async function task(
        func: (arg: A) => T | Promise<T>,
        index: number
    ): Promise<[number, T, number?]> {
        if (semaphore) {
            await semaphore.acquire();
            try {
                return await executeTask(func, index);
            } finally {
                semaphore.release();
            }
        }
        return executeTask(func, index);
    }

    const tasks = funcs.map((func, index) => task(func, index));
    const results: Array<[number, T, number?]> = [];

    for (const promise of tasks) {
        const result = await promise;
        results.push(result);
        if (throttleDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, throttleDelay));
        }
    }

    results.sort((a, b) => a[0] - b[0]);

    return retryTiming
        ? results.map(result => [result[1], result[2]!] as [T, number])
        : results.map(result => result[1]);
}
