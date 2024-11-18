import { ValueError } from '../errors';
import { ParseError, ToListOptions } from './types';

/**
 * List utility functions
 */
export const listUtils = {
    createArray,
    range,
    createArraySubclass,
    flatten(arr: any[], depth: number = Infinity): any[] {
        return depth < 1 ? arr.slice() :
            arr.reduce((flat: any[], item: any) => {
                if (Array.isArray(item)) {
                    return flat.concat(this.flatten(item, depth - 1));
                }
                if (item instanceof Set || item instanceof Map) {
                    return flat.concat(this.flatten(Array.from(item.values()), depth - 1));
                }
                if (item && typeof item === 'object' && !Buffer.isBuffer(item)) {
                    return flat.concat(Object.values(item));
                }
                return flat.concat(item);
            }, []);
    },
    dropNulls<T>(arr: T[]): T[] {
        return arr.filter(x => x != null);
    },
    unique<T>(arr: T[]): T[] {
        return Array.from(new Set(arr));
    },
    isListLike(value: any): boolean {
        try {
            return Array.isArray(value) ||
                   value instanceof Set ||
                   value instanceof Map ||
                   (value != null && 
                    typeof value === 'object' && 
                    Symbol.iterator in value && 
                    typeof value[Symbol.iterator] === 'function');
        } catch {
            return false;
        }
    },
    hasValidIterator(value: any): boolean {
        try {
            return value != null && 
                   typeof value === 'object' && 
                   Symbol.iterator in value && 
                   typeof value[Symbol.iterator] === 'function' &&
                   typeof value[Symbol.iterator]() === 'object';
        } catch {
            return false;
        }
    }
};

/**
 * Convert any input to an array.
 * 
 * @param input - Value to convert to array
 * @param options - Conversion options
 * @returns Array representation of input
 * @throws ValueError if options are invalid
 * @throws ParseError if conversion fails and suppress is false
 * 
 * @example
 * ```typescript
 * toList('abc', { useValues: true }) // ['a', 'b', 'c']
 * toList({ a: 1, b: 2 }, { useValues: true }) // [1, 2]
 * toList([1, [2, 3]], { flatten: true }) // [1, 2, 3]
 * ```
 */
export function toList<T = any>(
    input: any,
    options: Partial<ToListOptions> = {}
): T[] {
    const {
        flatten = false,
        dropna = false,
        unique = false,
        useValues = false,
        suppress = false
    } = options;

    try {
        // Validate options
        if (unique && !flatten) {
            throw new ValueError('unique=true requires flatten=true');
        }

        // Handle null/undefined
        if (input === null || input === undefined) {
            return [];
        }

        // Convert input to array
        let result: any[];

        if (Array.isArray(input)) {
            result = [...input];
        } else if (typeof input === 'string') {
            result = useValues ? Array.from(input) : [input];
        } else if (input instanceof Buffer) {
            result = useValues ? Array.from(input.toString()) : [input];
        } else if (typeof input === 'object') {
            // Handle invalid iterators
            if (Symbol.iterator in input && !listUtils.hasValidIterator(input)) {
                if (suppress) {
                    return [];
                }
                throw new ParseError('Invalid iterator');
            }

            if (input instanceof Set) {
                result = Array.from(input);
            } else if (input instanceof Map) {
                result = useValues ? Array.from(input.values()) : Array.from(input.entries());
            } else if (listUtils.isListLike(input)) {
                try {
                    result = Array.from(input);
                } catch {
                    if (suppress) {
                        return [];
                    }
                    throw new ParseError('Failed to convert input to array');
                }
            } else if (useValues) {
                try {
                    result = Object.values(input);
                } catch {
                    if (suppress) {
                        return [];
                    }
                    throw new ParseError('Failed to get object values');
                }
            } else {
                result = [input];
            }
        } else {
            result = [input];
        }

        // Apply transformations
        if (flatten) {
            try {
                result = listUtils.flatten(result);
            } catch {
                if (suppress) {
                    return [];
                }
                throw new ParseError('Failed to flatten array');
            }
        }

        if (dropna) {
            try {
                result = result.map(item => 
                    Array.isArray(item) ? listUtils.dropNulls(item) : item
                );
                result = listUtils.dropNulls(result);
            } catch {
                if (suppress) {
                    return [];
                }
                throw new ParseError('Failed to drop null values');
            }
        }

        if (unique) {
            try {
                result = listUtils.unique(result);
            } catch {
                if (suppress) {
                    return [];
                }
                throw new ParseError('Failed to remove duplicates');
            }
        }

        return result;
    } catch (error) {
        if (suppress) {
            return [];
        }
        throw error instanceof ParseError ? error : new ParseError(String(error));
    }
}

/**
 * Create a new array with the specified length and initial value.
 */
export function createArray<T>(length: number, initialValue: T): T[] {
    return Array(length).fill(initialValue);
}

/**
 * Create a range array from start to end (exclusive) with optional step.
 */
export function range(start: number, end: number, step: number = 1): number[] {
    const length = Math.max(Math.ceil((end - start) / step), 0);
    return Array(length).fill(0).map((_, i) => start + (i * step));
}

/**
 * Create a new array subclass instance.
 */
export function createArraySubclass<T extends Array<any>>(
    arrayClass: new () => T,
    items: any[] = []
): T {
    const instance = new arrayClass();
    instance.push(...items);
    return instance;
}

/**
 * Flatten an array to the specified depth.
 */
export function flatten(arr: any[], depth: number = Infinity): any[] {
    return listUtils.flatten(arr, depth);
}

/**
 * Remove null and undefined values from an array.
 */
export function dropNulls<T>(arr: T[]): T[] {
    return listUtils.dropNulls(arr);
}

/**
 * Remove duplicate values from an array.
 */
export function unique<T>(arr: T[]): T[] {
    return listUtils.unique(arr);
}

/**
 * Check if a value is array-like.
 */
export function isListLike(value: any): boolean {
    return listUtils.isListLike(value);
}
