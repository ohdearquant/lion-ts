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
type Productions = Production[];
/**
 * Convert JSON schema to context-free grammar productions
 */
export declare function jsonSchemaToGrammar(schema: JsonSchema, startSymbol?: string): Productions;
export declare const grammarUtils: {
    /**
     * Get all non-terminal symbols in the grammar
     */
    getNonTerminals(productions: Productions): Set<string>;
    /**
     * Get all terminal symbols in the grammar
     */
    getTerminals(productions: Productions): Set<string>;
    /**
     * Verify grammar is context-free
     */
    isContextFree(productions: Productions): boolean;
};
export {};
