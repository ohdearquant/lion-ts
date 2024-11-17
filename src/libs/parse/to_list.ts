/**
 * Options for list conversion
 */
interface ListOptions {
    flatten?: boolean;
    dropna?: boolean;
    unique?: boolean;
    useValues?: boolean;
}

/**
 * Convert various input types to a list
 * 
 * @param input - Input to convert to list
 * @param options - Conversion options
 * @returns Converted list
 */
export function toList<T = any>(
    input: any,
    options: ListOptions = {}
): T[] {
    const {
        flatten = false,
        dropna = false,
        unique = false,
        useValues = false
    } = options;

    if (unique && !flatten) {
        throw new Error('unique=true requires flatten=true');
    }

    // Initial conversion
    let result = toListType(input, useValues);

    // Process list if needed
    if (flatten || dropna) {
        result = processList(result, {
            flatten,
            dropna
        });
    }

    // Make unique if requested
    if (unique) {
        return Array.from(new Set(result));
    }

    return result;
}

/**
 * Convert input to list type based on its type
 */
function toListType(input: any, useValues: boolean): any[] {
    // Handle null/undefined
    if (input == null) {
        return [];
    }

    // Handle arrays
    if (Array.isArray(input)) {
        return input;
    }

    // Handle strings and buffers
    if (typeof input === 'string' || input instanceof Buffer) {
        return useValues ? Array.from(input) : [input];
    }

    // Handle Maps
    if (input instanceof Map) {
        return useValues ? Array.from(input.values()) : [input];
    }

    // Handle Sets
    if (input instanceof Set) {
        return Array.from(input);
    }

    // Handle objects with values method
    if (useValues && typeof input?.values === 'function') {
        try {
            return Array.from(input.values());
        } catch {
            // Fall through to default handling
        }
    }

    // Handle plain objects
    if (isPlainObject(input)) {
        return useValues ? Object.values(input) : [input];
    }

    // Handle iterables
    if (Symbol.iterator in Object(input)) {
        return Array.from(input);
    }

    // Default to single item array
    return [input];
}

/**
 * Process list with flattening and null removal
 */
function processList(
    list: any[],
    options: { flatten: boolean; dropna: boolean }
): any[] {
    const { flatten, dropna } = options;
    const result: any[] = [];

    for (const item of list) {
        if (isNestedStructure(item)) {
            if (flatten) {
                result.push(
                    ...processList(
                        Array.isArray(item) ? item : Array.from(item),
                        options
                    )
                );
            } else {
                result.push(
                    processList(
                        Array.isArray(item) ? item : Array.from(item),
                        options
                    )
                );
            }
        } else if (!dropna || item != null) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: any): boolean {
    if (value === null || typeof value !== 'object') return false;
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
     */
    flatten<T>(list: T[], depth: number = Infinity): T[] {
        return list.flat(depth);
    },

    /**
     * Remove null and undefined values
     */
    dropNulls<T>(list: T[]): NonNullable<T>[] {
        return list.filter(item => item != null) as NonNullable<T>[];
    },

    /**
     * Get unique values from list
     */
    unique<T>(list: T[]): T[] {
        return Array.from(new Set(list));
    },

    /**
     * Check if value is list-like
     */
    isListLike(value: any): boolean {
        return Array.isArray(value) ||
               value instanceof Set ||
               (typeof value?.[Symbol.iterator] === 'function' &&
                typeof value?.length === 'number');
    }
};

// Example usage:
/*
// Basic conversion
const numbers = toList(1);  // [1]
const letters = toList('abc', { useValues: true });  // ['a', 'b', 'c']

// Flatten nested structures
const nested = toList([1, [2, [3, 4]]], { flatten: true });  // [1, 2, 3, 4]

// Remove null values
const withNulls = toList([1, null, 2, undefined], { dropna: true });  // [1, 2]

// Get unique values
const duplicates = toList([1, 2, 2, 3], { flatten: true, unique: true });  // [1, 2, 3]

// Convert object values
const obj = { a: 1, b: 2 };
const values = toList(obj, { useValues: true });  // [1, 2]
*/