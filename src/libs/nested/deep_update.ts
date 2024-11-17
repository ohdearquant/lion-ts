/**
 * Type for any object with string keys
 */
export type AnyObject = { [key: string]: any };

/**
 * Recursively merge two dictionaries, updating values instead of overwriting.
 * 
 * @param original - Original dictionary to update
 * @param update - Dictionary containing updates to apply
 * @returns Updated dictionary
 * 
 * @example
 * ```typescript
 * const original = { a: 1, b: { c: 2 } };
 * const update = { b: { d: 3 } };
 * deepUpdate(original, update);
 * // { a: 1, b: { c: 2, d: 3 } }
 * ```
 */
export function deepUpdate(
    original: AnyObject,
    update: Partial<AnyObject>
): AnyObject {
    // Handle null/undefined cases
    if (!update || typeof update !== 'object') {
        return original;
    }

    if (!original || typeof original !== 'object') {
        return update;
    }

    // Create a copy to avoid modifying the original
    const result = { ...original };

    // Iterate through update keys
    for (const [key, value] of Object.entries(update)) {
        if (value === null || value === undefined) {
            continue;
        }

        // If both values are objects, recursively update
        if (isPlainObject(value) && isPlainObject(result[key])) {
            result[key] = deepUpdate(
                result[key],
                value
            );
        }
        // Otherwise assign the new value
        else {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Type guard for checking if a value is a plain object
 */
function isPlainObject(value: unknown): value is AnyObject {
    return typeof value === 'object' &&
           value !== null &&
           !Array.isArray(value) &&
           Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Deep update multiple objects
 * 
 * @param target - Target object to update
 * @param sources - Source objects to merge in
 * @returns Updated object
 * 
 * @example
 * ```typescript
 * const obj1 = { a: 1, b: { c: 2 } };
 * const obj2 = { b: { d: 3 } };
 * const obj3 = { b: { e: 4 } };
 * deepUpdateAll(obj1, obj2, obj3);
 * // { a: 1, b: { c: 2, d: 3, e: 4 } }
 * ```
 */
export function deepUpdateAll(
    target: AnyObject,
    ...sources: Partial<AnyObject>[]
): AnyObject {
    return sources.reduce((acc, source) => deepUpdate(acc, source), target);
}
