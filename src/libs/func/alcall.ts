import { toList } from '../parse';
import { ucall } from './ucall';

interface AsyncListOptions<T> {
    numRetries?: number;
    initialDelay?: number;
    retryDelay?: number;
    backoffFactor?: number;
    retryDefault?: T;
    retryTimeout?: number | null;
    retryTiming?: boolean;
    verboseRetry?: boolean;
    errorMsg?: string | null;
    maxConcurrent?: number | null;
    throttlePeriod?: number | null;
    flatten?: boolean;
    dropna?: boolean;
    unique?: boolean;
}

type TimedResult<T> = [T, number];

/**
 * Apply a function to each element of a list asynchronously with options.
 *
 * @param input List of inputs to be processed
 * @param func Async or sync function to apply to each input element
 * @param options Configuration options
 * @returns List of results, optionally with execution times if retryTiming is true
 * 
 * @throws {Error} If execution exceeds retryTimeout
 * @throws {Error} Any unhandled exception from function executions
 */
export async function alcall<T, U>(
    input: T | T[],
    func: (arg: T) => U | Promise<U>,
    options: AsyncListOptions<U> & { retryTiming: true }
): Promise<TimedResult<U>[]>;
export async function alcall<T, U>(
    input: T | T[],
    func: (arg: T) => U | Promise<U>,
    options?: AsyncListOptions<U>
): Promise<U[]>;
export async function alcall<T, U>(
    input: T | T[],
    func: (arg: T) => U | Promise<U>,
    options: AsyncListOptions<U> = {}
): Promise<U[] | TimedResult<U>[]> {
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
        maxConcurrent = null,
        throttlePeriod = null,
        flatten = false,
        dropna = false,
        unique = false
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

    type TaskResult = [number, U, number?];

    async function executeTask(
        item: T,
        index: number
    ): Promise<TaskResult> {
        let attempts = 0;
        let currentDelay = retryDelay;
        const startTime = retryTiming ? performance.now() : 0;

        async function executeWithTimeout(): Promise<U> {
            if (!retryTimeout) {
                return ucall(func, item);
            }
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), retryTimeout * 1000);
            });
            return Promise.race([
                ucall(func, item),
                timeoutPromise
            ]);
        }

        while (true) {
            try {
                const result = await executeWithTimeout();
                if (retryTiming) {
                    const duration = (performance.now() - startTime) / 1000;
                    return [index, result, duration];
                }
                return [index, result];
            } catch (e) {
                const error = e as Error;

                if (error.message === 'Timeout') {
                    if (retryDefault !== undefined) {
                        if (retryTiming) {
                            const duration = (performance.now() - startTime) / 1000;
                            return [index, retryDefault, duration];
                        }
                        return [index, retryDefault];
                    }
                    throw error;
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
                        if (retryTiming) {
                            const duration = (performance.now() - startTime) / 1000;
                            return [index, retryDefault, duration];
                        }
                        return [index, retryDefault];
                    }
                    throw error;
                }
            }
        }
    }

    async function task(
        item: T,
        index: number
    ): Promise<TaskResult> {
        if (semaphore) {
            await semaphore.acquire();
            try {
                return await executeTask(item, index);
            } finally {
                semaphore.release();
            }
        }
        return executeTask(item, index);
    }

    const inputList = toList(input);
    const tasks = inputList.map((item, index) => task(item, index));
    const results: TaskResult[] = [];

    for (const promise of tasks) {
        const result = await promise;
        results.push(result);
        if (throttleDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, throttleDelay));
        }
    }

    results.sort((a, b) => a[0] - b[0]);

    if (retryTiming) {
        const timedResults = results.map(result => [result[1], result[2]!] as TimedResult<U>);
        const processedResults = toList(timedResults, { flatten, dropna, unique });
        return processedResults as TimedResult<U>[];
    }

    const plainResults = results.map(result => result[1]);
    const processedResults = toList(plainResults, { flatten, dropna, unique });
    return processedResults as U[];
}
