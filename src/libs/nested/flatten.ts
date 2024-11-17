/**
 * Options for flattening nested structures
 */
export interface FlattenOptions {
    /** Separator for flattened keys */
    sep?: string;
    /** Convert all keys to strings */
    coerceKeys?: boolean;
    /** Handle arrays dynamically based on content */
    dynamic?: boolean;
    /** How to handle sequences (arrays) */
    coerceSequence?: 'dict' | 'list' | null;
    /** Maximum depth to flatten */
    maxDepth?: number;
}

/**
 * Type guard for primitive values
 */
function isPrimitive(value: unknown): boolean {
    return value === null ||
           value === undefined ||
           typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean';
}

/**
 * Type guard for plain objects
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' &&
           value !== null &&
           !Array.isArray(value) &&
           Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Flatten a nested object or array structure into a flat dictionary.
 * 
 * @param data - Object or array to flatten
 * @param options - Flattening options
 * @returns Flattened dictionary
 * 
 * @example
 * ```typescript
 * const nested = {
 *     a: 1,
 *     b: {
 *         c: 2,
 *         d: [3, 4],
 *         e: { f: 5 }
 *     }
 * };
 * 
 * flatten(nested);
 * // {
 * //     'a': 1,
 * //     'b|c': 2,
 * //     'b|d|0': 3,
 * //     'b|d|1': 4,
 * //     'b|e|f': 5
 * // }
 * ```
 */
export function flatten(
    data: unknown,
    options: FlattenOptions = {}
): Record<string, unknown> {
    const {
        sep = '|',
        coerceKeys = true,
        dynamic = true,
        coerceSequence = null,
        maxDepth = undefined
    } = options;

    const result: Record<string, unknown> = {};

    function flattenHelper(
        obj: unknown,
        prefix: string[] = [],
        depth: number = 0
    ): void {
        // Check depth limit
        if (maxDepth !== undefined && depth > maxDepth) {
            const key = prefix.join(sep);
            result[key] = obj;
            return;
        }

        // Handle null/undefined
        if (obj === null || obj === undefined) {
            const key = prefix.join(sep);
            result[key] = obj;
            return;
        }

        // Handle arrays
        if (Array.isArray(obj)) {
            if (obj.length === 0) {
                const key = prefix.join(sep);
                result[key] = obj;
                return;
            }

            if (coerceSequence === 'dict') {
                obj.forEach((item, index) => {
                    flattenHelper(item, [...prefix, String(index)], depth + 1);
                });
            } else if (coerceSequence === 'list') {
                const key = prefix.join(sep);
                result[key] = obj;
            } else {
                // Handle based on content type
                const allPrimitive = obj.every(isPrimitive);
                if (allPrimitive || !dynamic) {
                    const key = prefix.join(sep);
                    result[key] = obj;
                } else {
                    obj.forEach((item, index) => {
                        flattenHelper(item, [...prefix, String(index)], depth + 1);
                    });
                }
            }
            return;
        }

        // Handle objects
        if (isPlainObject(obj)) {
            const entries = Object.entries(obj);
            if (entries.length === 0) {
                const key = prefix.join(sep);
                result[key] = obj;
                return;
            }

            entries.forEach(([key, value]) => {
                const newKey = coerceKeys ? String(key) : key;
                flattenHelper(value, [...prefix, newKey], depth + 1);
            });
            return;
        }

        // Handle primitive values
        const key = prefix.join(sep);
        result[key] = obj;
    }

    flattenHelper(data);
    return result;
}

/**
 * Unflatten a dictionary back into a nested structure
 * 
 * @param data - Flattened dictionary
 * @param options - Unflattening options
 * @returns Nested structure
 * 
 * @example
 * ```typescript
 * const flat = {
 *     'a': 1,
 *     'b|c': 2,
 *     'b|d|0': 3,
 *     'b|d|1': 4
 * };
 * 
 * unflatten(flat);
 * // {
 * //     a: 1,
 * //     b: {
 * //         c: 2,
 * //         d: [3, 4]
 * //     }
 * // }
 * ```
 */
export function unflatten(
    data: Record<string, unknown>,
    options: { sep?: string } = {}
): unknown {
    const { sep = '|' } = options;
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        const parts = key.split(sep);
        let current = result;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            const nextPart = parts[i + 1];
            const isNextNumeric = /^\d+$/.test(nextPart);

            if (!(part in current)) {
                current[part] = isNextNumeric ? [] : {};
            }

            const next = current[part];
            if (typeof next === 'object' && next !== null) {
                current = next as Record<string, unknown>;
            }
        }

        const lastPart = parts[parts.length - 1];
        current[lastPart] = value;
    }

    // Convert numeric arrays back to proper arrays
    function convertArrays(obj: Record<string, unknown>): unknown {
        if (!isPlainObject(obj)) {
            return obj;
        }

        const entries = Object.entries(obj);
        const isNumericArray = entries.every(([key]) => /^\d+$/.test(key));

        if (isNumericArray) {
            const maxIndex = Math.max(...entries.map(([key]) => parseInt(key, 10)));
            const arr = new Array(maxIndex + 1);
            for (const [key, value] of entries) {
                arr[parseInt(key, 10)] = isPlainObject(value) 
                    ? convertArrays(value as Record<string, unknown>)
                    : value;
            }
            return arr;
        }

        const converted: Record<string, unknown> = {};
        for (const [key, value] of entries) {
            converted[key] = isPlainObject(value)
                ? convertArrays(value as Record<string, unknown>)
                : value;
        }
        return converted;
    }

    return convertArrays(result);
}
