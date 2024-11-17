// Type definitions
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
type ToJsonOptions = {
    indent?: number;
    ensureAscii?: boolean;
    separators?: [string, string];
    recursive?: boolean;
    recursivePythonOnly?: boolean;
    maxRecursiveDepth?: number;
    useModelDump?: boolean;
    fuzzyParse?: boolean;
};

/**
 * Convert input to a human-readable JSON string.
 * 
 * @param input - Object to convert to readable JSON
 * @param options - Additional formatting options
 * @returns Formatted, human-readable JSON string
 * @throws Error if conversion fails
 */
export function asReadableJson(input: unknown, options: Partial<ToJsonOptions> = {}): string {
    // Default options
    const defaultOptions: ToJsonOptions = {
        indent: 4,
        ensureAscii: false,
        recursive: true,
        recursivePythonOnly: true,
        maxRecursiveDepth: 5,
        useModelDump: true,
        fuzzyParse: true
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Handle empty input
    if (!input) {
        if (Array.isArray(input)) return "";
        return "{}";
    }

    try {
        if (Array.isArray(input)) {
            // Handle array input
            const items = input.map(item => {
                const dict = toDict(item, finalOptions);
                return JSON.stringify(dict, jsonReplacer, finalOptions.indent);
            });
            return items.join("\n\n");
        }

        // Handle single item
        const dict = toDict(input, finalOptions);
        return JSON.stringify(dict, jsonReplacer, finalOptions.indent);

    } catch (error) {
        throw new Error(`Failed to convert input to readable JSON: ${error}`);
    }
}

/**
 * Convert input to readable string with optional markdown formatting.
 * 
 * @param input - Object to convert
 * @param options - Conversion options
 * @param md - Whether to wrap in markdown code block
 * @returns Formatted string representation
 */
export function asReadable(
    input: unknown, 
    options: Partial<ToJsonOptions> = {}, 
    md: boolean = false
): string {
    try {
        const result = asReadableJson(input, options);
        if (md) {
            return "```json\n" + result + "\n```";
        }
        return result;
    } catch {
        return String(input);
    }
}

// Helper functions
function toDict(input: unknown, options: ToJsonOptions): JsonValue {
    // Handle recursive conversion
    if (options.recursive && options.maxRecursiveDepth > 0) {
        return convertRecursive(input, options);
    }
    
    // Basic conversion for non-recursive case
    if (typeof input === 'object' && input !== null) {
        if (isToJsonable(input)) {
            return input.toJSON();
        }
        return Object.fromEntries(
            Object.entries(input).map(([k, v]) => [k, toDict(v, options)])
        );
    }
    
    return input as JsonValue;
}

function convertRecursive(input: unknown, options: ToJsonOptions): JsonValue {
    const newOptions = { 
        ...options, 
        maxRecursiveDepth: options.maxRecursiveDepth - 1 
    };

    if (Array.isArray(input)) {
        return input.map(item => toDict(item, newOptions));
    }

    if (typeof input === 'object' && input !== null) {
        return Object.fromEntries(
            Object.entries(input).map(([k, v]) => [k, toDict(v, newOptions)])
        );
    }

    return input as JsonValue;
}

// Type guard for objects with toJSON method
function isToJsonable(value: unknown): value is { toJSON(): JsonValue } {
    return value !== null && 
           typeof value === 'object' && 
           'toJSON' in value &&
           typeof (value as any).toJSON === 'function';
}

// Custom JSON replacer function
function jsonReplacer(key: string, value: unknown): unknown {
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
    return value;
}