import { JsonSchema, JsonSchemaType } from './types';

/**
 * Options for schema extraction
 */
export interface SchemaOptions {
    /** Separator for flattened paths */
    sep?: string;
    /** Convert keys to strings */
    coerceKeys?: boolean;
    /** Handle arrays dynamically */
    dynamic?: boolean;
    /** How to handle sequences */
    coerceSequence?: 'dict' | 'list' | null;
    /** Maximum depth to process */
    maxDepth?: number;
}

/**
 * Extract a JSON schema from JSON data
 * 
 * @param data - JSON data to extract schema from
 * @param options - Extraction options
 * @returns JSON Schema object
 */
export function extractJsonSchema(
    data: unknown,
    options: SchemaOptions = {}
): JsonSchema {
    const {
        maxDepth = Infinity,
        dynamic = false,
        coerceSequence = null
    } = options;

    if (data === null || data === undefined) {
        return {
            type: 'object',
            properties: {}
        };
    }

    // Handle array coercion
    if (Array.isArray(data) && (dynamic || coerceSequence)) {
        const arrayAsObject: Record<string, unknown> = {};
        data.forEach((item, index) => {
            arrayAsObject[index.toString()] = item;
        });
        const schema = buildSchema(arrayAsObject, 0, maxDepth);
        schema.type = 'object';  // Force type to be object when coercing arrays
        return schema;
    }

    return buildSchema(data, 0, maxDepth);
}

/**
 * Build schema recursively with depth tracking
 */
function buildSchema(data: unknown, depth: number, maxDepth: number): JsonSchema {
    if (depth >= maxDepth) {
        return { type: 'any' };
    }

    if (data === null) {
        return { type: 'null' };
    }

    switch (typeof data) {
        case 'string':
            return { type: 'string' };
        case 'boolean':
            return { type: 'boolean' };
        case 'number':
            return Number.isInteger(data) ? 
                { type: 'integer' } : 
                { type: 'number' };
        case 'object':
            if (Array.isArray(data)) {
                return buildArraySchema(data, depth, maxDepth);
            }
            return {
                type: 'object',
                properties: buildObjectProperties(data as Record<string, unknown>, depth, maxDepth)
            };
        default:
            return { type: 'any' };
    }
}

/**
 * Build schema for array type
 */
function buildArraySchema(arr: unknown[], depth: number, maxDepth: number): JsonSchema {
    if (arr.length === 0) {
        return { type: 'array', items: { type: 'any' } };
    }

    // Get schema for first item to use as base
    const baseSchema = buildSchema(arr[0], depth + 1, maxDepth);

    // Check if all items match the base schema
    const allSame = arr.every(item => {
        const itemSchema = buildSchema(item, depth + 1, maxDepth);
        return JSON.stringify(itemSchema) === JSON.stringify(baseSchema);
    });

    if (allSame) {
        return {
            type: 'array',
            items: baseSchema
        };
    }

    // If items have different schemas, include all variations
    const itemSchemas = arr.map(item => buildSchema(item, depth + 1, maxDepth));
    return {
        type: 'array',
        items: { type: 'any' },
        oneOf: itemSchemas
    };
}

/**
 * Build properties for object type
 */
function buildObjectProperties(
    obj: Record<string, unknown>,
    depth: number,
    maxDepth: number
): Record<string, JsonSchema> {
    const properties: Record<string, JsonSchema> = {};

    for (const [key, value] of Object.entries(obj)) {
        properties[key] = buildSchema(value, depth + 1, maxDepth);
    }

    return properties;
}
