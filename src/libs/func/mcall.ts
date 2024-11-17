import { toList } from '../parse';
import { rcall } from './rcall';
import { alcall } from './alcall';

type ErrorHandler<T> = (error: Error) => T | Promise<T>;
type ErrorMap<T> = Record<string, ErrorHandler<T>>;

interface MultiCallOptions<T> {
    explode?: boolean;
    numRetries?: number;
    initialDelay?: number;
    retryDelay?: number;
    backoffFactor?: number;
    retryDefault?: T;
    retryTimeout?: number | null;
    verboseRetry?: boolean;
    errorMsg?: string | null;
    errorMap?: ErrorMap<T> | null;
    maxConcurrent?: number | null;
    throttlePeriod?: number | null;
    dropna?: boolean;
}

/**
 * Apply functions over inputs asynchronously with customizable options.
 *
 * @param input The input data to be processed
 * @param func The function or array of functions to be applied
 * @param options Configuration options
 * @returns List of results
 * 
 * @throws {Error} If the length of inputs and functions don't match when not exploding
 */
export async function mcall<T, U>(
    input: T | T[],
    func: ((arg: T) => Promise<U> | U) | Array<(arg: T) => Promise<U> | U>,
    options: MultiCallOptions<U> = {}
): Promise<U[] | U[][]> {
    const inputList = toList(input);
    const funcList = Array.isArray(func) ? func : [func];
    const opts = { ...options, retryTiming: false };

    if (opts.explode) {
        const results = await Promise.all(
            funcList.map(async f => {
                const result = await alcall(inputList, f, opts);
                return result as U[];
            })
        );
        return results;
    }

    if (funcList.length === 1) {
        const result = await alcall(inputList, funcList[0], opts);
        return result as U[];
    }

    if (inputList.length === funcList.length) {
        const results = await Promise.all(
            inputList.map(async (item, idx) => {
                const result = await rcall(funcList[idx], item, opts);
                return result as U;
            })
        );
        return results;
    }

    throw new Error("Inputs and functions must be the same length for map calling.");
}
