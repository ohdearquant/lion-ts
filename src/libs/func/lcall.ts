import { toList } from '../parse';

interface ListCallOptions {
    flatten?: boolean;
    dropna?: boolean;
    unique?: boolean;
}

/**
 * Apply a function to each element of a list synchronously.
 *
 * @param input List of inputs to be processed
 * @param func Function to apply to each input element
 * @param options Additional options for processing
 * @returns List of results after applying func to each input element
 * 
 * @throws {Error} If more than one function is provided
 * 
 * @example
 * ```typescript
 * lcall([1, 2, 3], x => x * 2)
 * // [2, 4, 6]
 * 
 * lcall([[1, 2], [3, 4]], arr => arr.reduce((a, b) => a + b), { flatten: true })
 * // [3, 7]
 * 
 * lcall([1, 2, 2, 3], x => x, { unique: true, flatten: true })
 * // [1, 2, 3]
 * ```
 */
export function lcall<T, U>(
    input: T | T[],
    func: ((arg: T) => U) | Array<(arg: T) => U>,
    options: ListCallOptions = {}
): U[] {
    const {
        flatten = false,
        dropna = false,
        unique = false
    } = options;

    // Handle input normalization
    const inputList = toList(input);

    // Handle function normalization and validation
    let processFunc: (arg: T) => U;
    if (Array.isArray(func)) {
        const funcList = toList(func, { flatten: true, dropna: true });
        if (funcList.length !== 1) {
            throw new Error("There must be one and only one function for list calling.");
        }
        processFunc = funcList[0];
    } else {
        processFunc = func;
    }

    // Process the list
    const results = inputList.map(item => processFunc(item));

    // Apply post-processing options
    return toList(results, { flatten, dropna, unique });
}
