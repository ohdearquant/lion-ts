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
export declare function asReadableJson(input: unknown, options?: Partial<ToJsonOptions>): string;
/**
 * Convert input to readable string with optional markdown formatting.
 *
 * @param input - Object to convert
 * @param options - Conversion options
 * @param md - Whether to wrap in markdown code block
 * @returns Formatted string representation
 */
export declare function asReadable(input: unknown, options?: Partial<ToJsonOptions>, md?: boolean): string;
export {};
