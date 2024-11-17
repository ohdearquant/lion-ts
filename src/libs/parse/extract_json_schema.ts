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
type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 
                     'array' | 'object' | 'null' | 'any';

interface JsonSchema {
    type: JsonSchemaType;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema | { oneOf: JsonSchema[] };
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
        const keyParts = typeof key === 'string' ? key.split(sep) : [key];
        let current = schema;
        
        // Build nested structure
        for (let i = 0; i < keyParts.length - 1; i++) {
            const part = keyParts[i];
            current[part] = current[part] || {};
            current = current[part] as Record<string, unknown>;
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
            return { type: Number.isInteger(value) ? 
                { type: 'integer' } : 
                { type: 'number' }
            };
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
            return { type: 'any' };
    }
}

/**
 * Get schema for array type
 */
function getArraySchema(arr: unknown[]): JsonSchema {
    if (arr.length === 0) {
        return { type: 'array', items: {} };
    }

    const itemTypes = arr.map(getType);
    const allSame = itemTypes.every(type => 
        JSON.stringify(type) === JSON.stringify(itemTypes[0])
    );

    return {
        type: 'array',
        items: allSame ? 
            itemTypes[0] : 
            { oneOf: itemTypes }
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

                consolidated[key] = {
                    type: 'array',
                    items: allSame ?
                        itemTypes[0] as JsonSchema :
                        { oneOf: itemTypes as JsonSchema[] }
                };
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

/**
 * Flatten object (implementation needed)
 */
function flatten(
    data: unknown,
    options: SchemaOptions
): Record<string, unknown> {
    // Implementation of flatten function needed
    // This should match the Python flatten function's behavior
    return {};
}

// Example usage:
/*
const data = {
    name: 'John',
    age: 30,
    addresses: [
        { street: '123 Main St', city: 'Anytown' },
        { street: '456 Oak Rd', city: 'Somewhere' }
    ],
    metadata: {
        created: '2023-01-01',
        tags: ['user', 'active']
    }
};

const schema = extractJsonSchema(data);
*/


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
        if (typeof obj === 'object') {
            const entries = Object.entries(obj as Record<string, unknown>);
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
 * Check if a value is primitive
 */
function isPrimitive(value: unknown): boolean {
    return value === null ||
           value === undefined ||
           typeof value === 'string' ||
           typeof value === 'number' ||
           typeof value === 'boolean';
}

// Example usage:
/*
const nested = {
    a: 1,
    b: {
        c: 2,
        d: [3, 4, 5],
        e: {
            f: 6
        }
    }
};

const flattened = flatten(nested);
// Result:
// {
//     'a': 1,
//     'b|c': 2,
//     'b|d|0': 3,
//     'b|d|1': 4,
//     'b|d|2': 5,
//     'b|e|f': 6
// }
*/