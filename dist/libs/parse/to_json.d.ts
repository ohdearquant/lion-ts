/**
 * Options for JSON extraction
 */
interface JsonOptions {
    fuzzyParse?: boolean;
}
/**
 * Extract and parse JSON content from a string or markdown code blocks
 *
 * @param input - Input string or array of strings to parse
 * @param options - Parsing options
 * @returns Parsed JSON object(s) or empty array if no valid JSON found
 */
export declare function toJson(input: string | string[], options?: JsonOptions): Record<string, unknown> | Array<Record<string, unknown>>;
/**
 * Utility functions for working with extracted JSON
 */
export declare const jsonUtils: {
    /**
     * Validate extracted JSON block
     */
    validateJson(str: string): boolean;
    /**
     * Count JSON blocks in content
     */
    countJsonBlocks(content: string): number;
    /**
     * Test if content contains valid JSON blocks
     */
    hasValidJsonBlocks(content: string): boolean;
};
export {};
