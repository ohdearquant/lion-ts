import { flatten } from '../nested/flatten';
import { ValueError } from '../errors';
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
 * 
 * @example
 * ```typescript
 * const data = {
 *     name: 'John',
 *     age: 30,
 *     addresses: [
 *         { street: '123 Main St', city: 'Anytown' },
 *         { street: '456 Oak Rd', city: 'Somewhere' }
 *     ]
 * };
 * 
 * const schema = extractJsonSchema(data);
 * // {
 * //     type: 'object',
 * //     properties: {
 * //         name: { type: 'string' },
 * //         age: { type: 'integer' },
 * //         addresses: {
 * //             type: 'array',
 * //             items: {
 * //                 type: 'object',
 * //                 properties: {
 * //                     street: { type: 'string' },
 * //                     city: { type: 'string' }
 * //                 }
 * //             }
 * //         }
 * //     }
 * // }
 * ```
 */
export function extractJsonSchema(
    data: unknown,
    options: SchemaOptions = {}
): JsonSchema {
    const {
        sep = '|',
        coerceKeys = true,
        dynamic = true,
        coerceSequence = null,
        maxDepth = undefined
    } = options;

    // Flatten the data structure
    const flattened = flatten(data, {
        sep,
        coerceKeys,
        dynamic,
        coerceSequence,
        maxDepth
    });

    // Build initial schema structure
    const schema: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(flattened)) {
        const keyParts = key.split(sep);
        let current = schema;
        
        // Build nested structure
        for (let i = 0; i < keyParts.length - 1; i++) {
            const part = keyParts[i];
            current[part] = current[part] || {};
            const next = current[part];
            if (typeof next === 'object' && next !== null) {
                current = next as Record<string, unknown>;
            }
        }

        current[keyParts[keyParts.length - 1]] = getType(value);
    }

    return {
        type: 'object',
        properties: consolidateSchema(schema)
    };
}

/**
 * Get JSON Schema type for a value
 */
function getType(value: unknown): JsonSchema {
    if (value === null) {
        return { type: 'null' };
    }

    switch (typeof value) {
        case 'string':
            return { type: 'string' };
        case 'boolean':
            return { type: 'boolean' };
        case 'number':
            return Number.isInteger(value) ? 
                { type: 'integer' as JsonSchemaType } : 
                { type: 'number' as JsonSchemaType };
        case 'object':
            if (Array.isArray(value)) {
                return getArraySchema(value);
            }
            return {
                type: 'object',
                properties: consolidateSchema(
                    Object.fromEntries(
                        Object.entries(value)
                            .map(([k, v]) => [k, getType(v)])
                    )
                )
            };
        default:
            return { type: 'any' as JsonSchemaType };
    }
}

/**
 * Get schema for array type
 */
function getArraySchema(arr: unknown[]): JsonSchema {
    if (arr.length === 0) {
        return { type: 'array', items: { type: 'any' as JsonSchemaType } };
    }

    const itemTypes = arr.map(getType);
    const allSame = itemTypes.every(type => 
        JSON.stringify(type) === JSON.stringify(itemTypes[0])
    );

    if (allSame) {
        return {
            type: 'array',
            items: itemTypes[0]
        };
    }

    return {
        type: 'array',
        items: itemTypes[0],
        oneOf: itemTypes
    };
}

/**
 * Consolidate schema structure
 */
function consolidateSchema(
    schema: Record<string, unknown>
): Record<string, JsonSchema> {
    const consolidated: Record<string, JsonSchema> = {};

    for (const [key, value] of Object.entries(schema)) {
        if (isSchemaObject(value)) {
            consolidated[key] = value as JsonSchema;
        } else if (typeof value === 'object' && value !== null) {
            const obj = value as Record<string, unknown>;
            
            // Check if it's a numeric-keyed object (potential array)
            if (Object.keys(obj).every(k => /^\d+$/.test(k))) {
                const itemTypes = Object.values(obj);
                const allSame = itemTypes.every(type =>
                    JSON.stringify(type) === JSON.stringify(itemTypes[0])
                );

                if (allSame) {
                    consolidated[key] = {
                        type: 'array',
                        items: itemTypes[0] as JsonSchema
                    };
                } else {
                    consolidated[key] = {
                        type: 'array',
                        items: itemTypes[0] as JsonSchema,
                        oneOf: itemTypes as JsonSchema[]
                    };
                }
            } else {
                consolidated[key] = {
                    type: 'object',
                    properties: consolidateSchema(obj)
                };
            }
        }
    }

    return consolidated;
}

/**
 * Type guard for schema objects
 */
function isSchemaObject(value: unknown): value is JsonSchema {
    return typeof value === 'object' &&
           value !== null &&
           'type' in value &&
           typeof (value as JsonSchema).type === 'string';
}
