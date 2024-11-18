import { ParseError } from './types';
import type { ReadableJsonOptions } from './types';

/**
 * Convert input to a human-readable JSON string
 * 
 * @param input - Value to convert to readable JSON
 * @param options - Formatting options
 * @returns Formatted JSON string
 * @throws ParseError if conversion fails
 * 
 * @example
 * ```typescript
 * const obj = { name: 'John', age: 30 };
 * const json = asReadableJson(obj);
 * // {
 * //     "name": "John",
 * //     "age": 30
 * // }
 * ```
 */
export function asReadableJson(
    input: any,
    options: Partial<ReadableJsonOptions> = {}
): string {
    const {
        indent = 4,
        ensureAscii = false,
        useDictDump = true,
        fuzzyParse = true,
        recursive = true,
        recursivePythonOnly = true,
        maxRecursiveDepth = 5
    } = options;

    // Handle empty input
    if (input === null || input === undefined) {
        return '{}';
    }

    // Handle arrays
    if (Array.isArray(input)) {
        if (input.length === 0) {
            return '';
        }
        try {
            // For arrays of objects, format each object separately
            if (input.every(item => typeof item === 'object' && item !== null)) {
                return input.map(item => 
                    asReadableJson(item, options)
                ).join('\n\n');
            }
            // For other arrays, use standard JSON formatting
            const indentStr = typeof indent === 'number' ? ' '.repeat(indent) : indent;
            return JSON.stringify(input, customReplacer, indentStr);
        } catch (error) {
            throw new ParseError(
                `Failed to convert array to readable JSON: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    try {
        // Handle string input
        if (typeof input === 'string') {
            try {
                const parsed = JSON.parse(input);
                return asReadableJson(parsed, options);
            } catch {
                return JSON.stringify(input);
            }
        }

        // Convert to string with proper indentation
        const indentStr = typeof indent === 'number' ? ' '.repeat(indent) : indent;
        return JSON.stringify(input, customReplacer, indentStr);
    } catch (error) {
        throw new ParseError(
            `Failed to convert input to readable JSON: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

// Custom replacer function to handle special cases
function customReplacer(key: string, value: any): any {
    if (value === undefined) {
        return null;
    }
    if (typeof value === 'bigint') {
        return value.toString();
    }
    if (value instanceof Set) {
        return Array.from(value);
    }
    if (value instanceof Map) {
        return Object.fromEntries(value);
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (value instanceof RegExp) {
        return value.toString();
    }
    if (typeof value === 'function') {
        return value.toString();
    }
    return value;
}

/**
 * Convert input to readable string with optional markdown formatting
 * 
 * @param input - Value to convert to readable string
 * @param options - Formatting options
 * @param md - Whether to wrap output in markdown code block
 * @returns Formatted string
 * 
 * @example
 * ```typescript
 * const obj = { name: 'John' };
 * const str = asReadable(obj, {}, true);
 * // ```json
 * // {
 * //     "name": "John"
 * // }
 * // ```
 * ```
 */
export function asReadable(
    input: any,
    options: Partial<ReadableJsonOptions> = {},
    md: boolean = false
): string {
    try {
        let result: string;
        if (typeof input === 'string') {
            result = JSON.stringify(input);
        } else if (typeof input === 'number' || typeof input === 'boolean') {
            result = String(input);
        } else {
            result = asReadableJson(input, options);
        }

        return md ? `\`\`\`json\n${result}\n\`\`\`` : result;
    } catch (error) {
        // On error, try basic string conversion
        if (input === null || input === undefined) {
            return String(input);
        }
        if (typeof input === 'object') {
            try {
                if (typeof input.toString === 'function' && 
                    input.toString !== Object.prototype.toString) {
                    return input.toString();
                }
                return JSON.stringify(input);
            } catch {
                return String(input);
            }
        }
        return String(input);
    }
}
