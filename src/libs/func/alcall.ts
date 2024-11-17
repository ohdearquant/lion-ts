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

    const inputList = toList(input);
    const results: Array<TaskResult<U>> = [];

    const concurrency = maxConcurrent || inputList.length;
    const throttleDelay = throttlePeriod ? throttlePeriod * 1000 : 0;

    type TaskResult<T> = [number, T, number?];

    let currentIndex = 0;

    async function worker(): Promise<void> {
        while (currentIndex < inputList.length) {
            const index = currentIndex++;
            const item = inputList[index];

            const startTime = performance.now();
            let attempts = 0;
            let currentDelay = retryDelay;
            const timeoutMillis = retryTimeout !== null && retryTimeout !== undefined ? retryTimeout * 1000 : null;

            while (true) {
                attempts++;

                try {
                    let result: U;
                    const elapsedTime = performance.now() - startTime;
                    const remainingTime = timeoutMillis !== null ? timeoutMillis - elapsedTime : null;

                    if (remainingTime !== null && remainingTime <= 0) {
                        throw new Error('Timeout');
                    }

                    if (remainingTime !== null) {
                        result = await Promise.race([
                            ucall(func, item),
                            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), remainingTime))
                        ]);
                    } else {
                        result = await ucall(func, item);
                    }

                    const duration = (performance.now() - startTime) / 1000;
                    const taskResult: TaskResult<U> = retryTiming ? [index, result, duration] : [index, result];
                    results.push(taskResult);
                    break;

                } catch (error) {
                    const err = error as Error;

                    if (err.message === 'Timeout') {
                        if (retryDefault !== undefined) {
                            const duration = (performance.now() - startTime) / 1000;
                            const taskResult: TaskResult<U> = retryTiming ? [index, retryDefault, duration] : [index, retryDefault];
                            results.push(taskResult);
                            break;
                        }
                        throw new Error('Timeout');
                    }

                    if (attempts > numRetries) {
                        if (retryDefault !== undefined) {
                            const duration = (performance.now() - startTime) / 1000;
                            const taskResult: TaskResult<U> = retryTiming ? [index, retryDefault, duration] : [index, retryDefault];
                            results.push(taskResult);
                            break;
                        }
                        throw err;
                    }

                    if (verboseRetry) {
                        console.log(
                            `Attempt ${attempts}/${numRetries + 1} failed: ${err}, retrying...`
                        );
                    }

                    await new Promise(resolve =>
                        setTimeout(resolve, currentDelay * 1000)
                    );
                    currentDelay *= backoffFactor;
                }
            }

            if (throttleDelay > 0) {
                await new Promise(resolve => setTimeout(resolve, throttleDelay));
            }
        }
    }

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

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