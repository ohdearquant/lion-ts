import { ToListOptions, ParseError } from './types';

/**
 * Convert various input types to a list
 * 
 * @param input - Input to convert to list
 * @param options - Conversion options
 * @returns Converted list
 * 
 * @example
 * ```typescript
 * toList('abc', { useValues: true }) // ['a', 'b', 'c']
 * toList([1, [2, 3]], { flatten: true }) // [1, 2, 3]
 * toList([1, null, 2], { dropna: true }) // [1, 2]
 * ```
 */
export function toList<T = any>(
    input: any,
    options: ToListOptions = {}
): T[] {
    const {
        flatten = false,
        dropna = false,
        unique = false,
        useValues = false,
        suppress = false
    } = options;

    try {
        if (unique && !flatten) {
            throw new ParseError('unique=true requires flatten=true');
        }

        // Initial conversion
        let result = toListType<T>(input, useValues, suppress);

        // Process list if needed
        if (flatten || dropna) {
            result = processList<T>(result, {
                flatten,
                dropna,
                suppress
            });
        }

        // Make unique if requested
        if (unique) {
            return Array.from(new Set(result));
        }

        return result;
    } catch (error) {
        if (suppress) {
            return [];
        }
        throw error;
    }
}

/**
 * Convert input to list type based on its type
 */
function toListType<T>(
    input: any,
    useValues: boolean,
    suppress: boolean
): T[] {
    try {
        // Handle null/undefined
        if (input == null) {
            return [];
        }

        // Handle arrays
        if (Array.isArray(input)) {
            return input;
        }

        // Handle strings
        if (typeof input === 'string') {
            return (useValues ? Array.from(input) : [input]) as T[];
        }

        // Handle Buffers
        if (input instanceof Buffer) {
            return (useValues ? Array.from(input.toString()) : [input]) as T[];
        }

        // Handle Maps
        if (input instanceof Map) {
            return (useValues ? Array.from(input.values()) : [input]) as T[];
        }

        // Handle Sets
        if (input instanceof Set) {
            return Array.from(input) as T[];
        }

        // Handle objects with values method
        if (useValues && typeof input?.values === 'function') {
            try {
                return Array.from(input.values()) as T[];
            } catch {
                // Fall through to default handling
            }
        }

        // Handle plain objects
        if (isPlainObject(input)) {
            return (useValues ? Object.values(input) : [input]) as T[];
        }

        // Handle iterables
        if (Symbol.iterator in Object(input)) {
            return Array.from(input) as T[];
        }

        // Default to single item array
        return [input] as T[];
    } catch (error) {
        if (suppress) {
            return [];
        }
        throw error;
    }
}

/**
 * Process list with flattening and null removal
 */
function processList<T>(
    list: T[],
    options: {
        flatten: boolean;
        dropna: boolean;
        suppress?: boolean;
    }
): T[] {
    const { flatten, dropna, suppress = false } = options;
    const result: T[] = [];

    try {
        for (const item of list) {
            if (isNestedStructure(item)) {
                if (flatten) {
                    result.push(
                        ...processList(
                            Array.isArray(item) ? item : Array.from(item as any),
                            options
                        )
                    );
                } else {
                    result.push(
                        processList(
                            Array.isArray(item) ? item : Array.from(item as any),
                            options
                        ) as any
                    );
                }
            } else if (!dropna || item != null) {
                result.push(item);
            }
        }

        return result;
    } catch (error) {
        if (suppress) {
            return list;
        }
        throw error;
    }
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: any): boolean {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}

/**
 * Check if value is a nested structure that should be processed
 */
function isNestedStructure(value: any): boolean {
    return (
        value != null &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        !(value instanceof RegExp) &&
        !(typeof value === 'string') &&
        !(value instanceof Buffer) &&
        !(isPlainObject(value))
    );
}

/**
 * Utility functions for working with lists
 */
export const listUtils = {
    /**
     * Flatten a list to specified depth
     * 
     * @example
     * ```typescript
     * flatten([1, [2, [3, 4]]], 1) // [1, 2, [3, 4]]
     * flatten([1, [2, [3, 4]]]) // [1, 2, 3, 4]
     * ```
     */
    flatten<T>(list: T[], depth: number = Infinity): T[] {
        const flattenRecursive = (arr: any[], currentDepth: number): any[] => {
            return arr.reduce((acc, val) => {
                if (Array.isArray(val) && currentDepth > 0) {
                    acc.push(...flattenRecursive(val, currentDepth - 1));
                } else {
                    acc.push(val);
                }
                return acc;
            }, []);
        };

        return flattenRecursive(list, depth);
    },

    /**
     * Remove null and undefined values
     * 
     * @example
     * ```typescript
     * dropNulls([1, null, 2, undefined]) // [1, 2]
     * ```
     */
    dropNulls<T>(list: T[]): NonNullable<T>[] {
        return list.filter((item): item is NonNullable<T> => item != null);
    },

    /**
     * Get unique values from list
     * 
     * @example
     * ```typescript
     * unique([1, 2, 2, 3, 3]) // [1, 2, 3]
     * ```
     */
    unique<T>(list: T[]): T[] {
        return Array.from(new Set(list));
    },

    /**
     * Check if value is list-like
     * 
     * @example
     * ```typescript
     * isListLike([1, 2, 3]) // true
     * isListLike(new Set([1, 2])) // true
     * isListLike({ length: 1 }) // false
     * ```
     */
    isListLike(value: any): boolean {
        return Array.isArray(value) ||
               value instanceof Set ||
               (typeof value?.[Symbol.iterator] === 'function' &&
                typeof value?.length === 'number');
    }
};
