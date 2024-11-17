import { toList } from '../parse';
import { alcall } from './alcall';

interface BatchOptions<T> {
    batchSize: number;
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
    dropna?: boolean;
}

/**
 * Asynchronously call a function in batches with retry and timing options.
 *
 * @param input The input data to process
 * @param func The function to call
 * @param options Configuration options including batch size
 * @yields A list of results for each batch of inputs
 * 
 * @example
 * ```typescript
 * async function sampleFunc(x: number) {
 *     return x * 2;
 * }
 * 
 * for await (const batchResults of bcall([1, 2, 3, 4, 5], sampleFunc, { 
 *     batchSize: 2,
 *     numRetries: 3, 
 *     retryDelay: 1 
 * })) {
 *     console.log(batchResults);
 * }
 * ```
 */
export async function* bcall<T, U>(
    input: T | T[],
    func: (arg: T) => U | Promise<U>,
    options: BatchOptions<U>
): AsyncGenerator<U[] | Array<[U, number]>, void, unknown> {
    const {
        batchSize,
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
        dropna = false
    } = options;

    if (!batchSize || batchSize <= 0) {
        throw new Error("Batch size must be a positive number");
    }

    const inputList = toList(input, { flatten: true, dropna: true });

    const commonOptions = {
        numRetries,
        initialDelay,
        retryDelay,
        backoffFactor,
        retryDefault,
        retryTimeout,
        retryTiming,
        verboseRetry,
        errorMsg,
        maxConcurrent,
        throttlePeriod,
        dropna
    };

    async function processBatchWithTimeout(batch: T[]): Promise<U[]> {
        if (!retryTimeout) {
            return alcall(batch, func, commonOptions);
        }

        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), retryTimeout * 1000);
        });

        const result = await Promise.race([
            alcall(batch, func, commonOptions),
            timeoutPromise
        ]);
        return result;
    }

    for (let i = 0; i < inputList.length; i += batchSize) {
        const batch = inputList.slice(i, i + batchSize);
        const batchResults = await processBatchWithTimeout(batch);
        yield batchResults;
    }
}

/**
 * Create a batch processor with fixed configuration.
 * 
 * @param options Default batch processing options
 * @returns A configured batch processor function
 * 
 * @example
 * ```typescript
 * const batchProcessor = bcall.configure({ 
 *     batchSize: 2,
 *     numRetries: 3
 * });
 * 
 * for await (const results of batchProcessor([1, 2, 3, 4], x => x * 2)) {
 *     console.log(results);
 * }
 * ```
 */
export namespace bcall {
    export function configure<T, U>(defaultOptions: BatchOptions<U>) {
        return async function*(
            input: T | T[],
            func: (arg: T) => U | Promise<U>,
            options: Partial<BatchOptions<U>> = {}
        ): AsyncGenerator<U[] | Array<[U, number]>, void, unknown> {
            const mergedOptions = {
                ...defaultOptions,
                ...options
            };
            yield* bcall(input, func, mergedOptions);
        };
    }
}
