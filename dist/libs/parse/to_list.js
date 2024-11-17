"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUtils = exports.toList = void 0;
/**
 * Convert various input types to a list
 *
 * @param input - Input to convert to list
 * @param options - Conversion options
 * @returns Converted list
 */
function toList(input, options = {}) {
    const { flatten = false, dropna = false, unique = false, useValues = false } = options;
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
exports.toList = toList;
/**
 * Convert input to list type based on its type
 */
function toListType(input, useValues) {
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
        return useValues ? Array.from(input) : [input];
    }
    // Handle Buffers
    if (input instanceof Buffer) {
        return useValues ? Array.from(input.toString()) : [input];
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
        }
        catch {
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
function processList(list, options) {
    const { flatten, dropna } = options;
    const result = [];
    for (const item of list) {
        if (isNestedStructure(item)) {
            if (flatten) {
                result.push(...processList(Array.isArray(item) ? item : Array.from(item), options));
            }
            else {
                result.push(processList(Array.isArray(item) ? item : Array.from(item), options));
            }
        }
        else if (!dropna || item != null) {
            result.push(item);
        }
    }
    return result;
}
/**
 * Check if value is a plain object
 */
function isPlainObject(value) {
    if (value === null || typeof value !== 'object')
        return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
/**
 * Check if value is a nested structure that should be processed
 */
function isNestedStructure(value) {
    return (value != null &&
        typeof value === 'object' &&
        !(value instanceof Date) &&
        !(value instanceof RegExp) &&
        !(typeof value === 'string') &&
        !(value instanceof Buffer) &&
        !(isPlainObject(value)));
}
/**
 * Utility functions for working with lists
 */
exports.listUtils = {
    /**
     * Flatten a list to specified depth
     */
    flatten(list, depth = Infinity) {
        const flattenRecursive = (arr, currentDepth) => {
            return arr.reduce((acc, val) => {
                if (Array.isArray(val) && currentDepth > 0) {
                    acc.push(...flattenRecursive(val, currentDepth - 1));
                }
                else {
                    acc.push(val);
                }
                return acc;
            }, []);
        };
        return flattenRecursive(list, depth);
    },
    /**
     * Remove null and undefined values
     */
    dropNulls(list) {
        return list.filter(item => item != null);
    },
    /**
     * Get unique values from list
     */
    unique(list) {
        return Array.from(new Set(list));
    },
    /**
     * Check if value is list-like
     */
    isListLike(value) {
        return Array.isArray(value) ||
            value instanceof Set ||
            (typeof value?.[Symbol.iterator] === 'function' &&
                typeof value?.length === 'number');
    }
};
