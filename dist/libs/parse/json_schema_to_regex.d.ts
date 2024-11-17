/**
 * Types for JSON Schema and Grammar Productions
 */
type JsonSchema = {
    type?: string;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    [key: string]: any;
};
type Production = [string, string[]];
/**
 * Convert JSON schema to regular expression pattern
 */
export declare function jsonSchemaToRegex(schema: JsonSchema): string;
/**
 * Print context-free grammar productions
 */
export declare function printCFG(productions: Production[]): string;
/**
 * Utility functions for working with generated patterns
 */
export declare const regexUtils: {
    /**
     * Test if a string matches the generated pattern
     */
    testPattern(pattern: string, input: string): boolean;
    /**
     * Validate a generated pattern
     */
    validatePattern(pattern: string): boolean;
    /**
     * Get a simplified version of the pattern
     */
    simplifyPattern(pattern: string): string;
};
export {};
