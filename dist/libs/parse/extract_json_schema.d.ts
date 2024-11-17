/**
 * Options for schema extraction
 */
interface SchemaOptions {
    sep?: string;
    coerceKeys?: boolean;
    dynamic?: boolean;
    coerceSequence?: 'dict' | 'list' | null;
    maxDepth?: number;
}
/**
 * JSON Schema type definitions
 */
type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null' | 'any';
interface JsonSchema {
    type: JsonSchemaType;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema | {
        oneOf: JsonSchema[];
    };
}
/**
 * Extract a JSON schema from JSON data
 *
 * @param data - JSON data to extract schema from
 * @param options - Extraction options
 * @returns JSON Schema object
 */
export declare function extractJsonSchema(data: unknown, options?: SchemaOptions): JsonSchema;
/**
 * Options for flattening objects
 */
interface FlattenOptions {
    sep?: string;
    coerceKeys?: boolean;
    dynamic?: boolean;
    coerceSequence?: 'dict' | 'list' | null;
    maxDepth?: number;
}
/**
 * Flatten a nested object structure
 *
 * @param data - Object to flatten
 * @param options - Flattening options
 * @returns Flattened object
 */
export declare function flatten(data: unknown, options?: FlattenOptions): Record<string, unknown>;
export {};
