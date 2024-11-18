import 'reflect-metadata';
import { JsonSchema, JsonSchemaType } from './types';

/**
 * Options for function schema generation
 */
interface SchemaOptions {
    /** Whether to include docstring info */
    includeDoc?: boolean;
    /** Whether to include parameter types */
    includeTypes?: boolean;
    /** Whether to include return type */
    includeReturn?: boolean;
    /** Function description */
    functionDescription?: string;
    /** Parameter descriptions */
    paramDescriptions?: Record<string, string>;
    /** Parameter types (for when reflection is not available) */
    paramTypes?: Record<string, JsonSchemaType>;
}

/**
 * Parameter decorator for adding metadata
 */
export function param(description: string) {
    return function(target: any, propertyKey: string | symbol, parameterIndex: number) {
        const params = Reflect.getMetadata('params', target, propertyKey) || {};
        params[parameterIndex] = description;
        Reflect.defineMetadata('params', params, target, propertyKey);
    };
}

/**
 * Method decorator for adding docstring
 */
export function doc(description: string) {
    return function(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('doc', description, target, propertyKey);
        return descriptor;
    };
}

/**
 * Decorator for collecting type information
 */
export function TypeInfo(): MethodDecorator {
    return (target, propertyKey, descriptor) => {
        // No action needed here, but ensures metadata is emitted
    };
}

interface FunctionSchema extends JsonSchema {
    type: JsonSchemaType;
    function: {
        name: string;
        parameters: {
            type: 'object';
            properties: Record<string, {
                type: JsonSchemaType;
                description: string | null;
            }>;
            required: string[];
        };
        returns?: JsonSchema;
        description: string;
    };
}

/**
 * Generate JSON schema from function
 */
export function functionToSchema(
    func: Function,
    options: SchemaOptions = {}
): FunctionSchema {
    const {
        includeDoc = true,
        includeTypes = true,
        includeReturn = true,
        functionDescription,
        paramDescriptions = {},
        paramTypes = {}
    } = options;

    // Get function info
    const funcStr = func.toString();
    const doc = includeDoc ? extractDocstring(funcStr) : undefined;
    const params = extractParameters(funcStr);

    // Build parameter schema
    const paramSchema = {
        type: 'object' as const,
        properties: {} as Record<string, { type: JsonSchemaType; description: string | null }>,
        required: params.map(([name, isRest]) => name)
    };

    // Get parameter types using reflection
    const paramTypesFromMetadata: Function[] = Reflect.getMetadata('design:paramtypes', func) || [];

    for (const [index, [name, isRest]] of params.entries()) {
        let type: JsonSchemaType = 'any';

        // Try to get type from metadata first
        if (paramTypesFromMetadata[index]) {
            type = mapTypeToJsonSchema(paramTypesFromMetadata[index].name.toLowerCase());
        }
        // Fall back to provided types if available
        if (paramTypes[name]) {
            type = paramTypes[name];
        }
        // Force array type for rest parameters
        if (isRest) {
            type = 'array';
        }

        paramSchema.properties[name] = {
            type,
            description: paramDescriptions[name] || null
        };
    }

    // Build full schema
    const schema: FunctionSchema = {
        type: 'function' as JsonSchemaType,
        function: {
            name: func.name || '',
            parameters: paramSchema,
            description: functionDescription || doc || ''
        }
    };

    // Add return type if requested
    if (includeReturn) {
        const returnType = Reflect.getMetadata('design:returntype', func);
        if (returnType) {
            schema.function.returns = {
                type: mapTypeToJsonSchema(returnType.name.toLowerCase())
            };
        }
    }

    return schema;
}

/**
 * Extract parameters from function string
 */
function extractParameters(funcStr: string): Array<[string, boolean]> {
    const fnStr = funcStr.replace(/[/][/].*$/gm, ''); // remove single-line comments
    const paramMatch = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(/([^\s,]+)/g);
    if (!paramMatch) return [];

    return paramMatch.map(param => {
        const isRest = param.startsWith('...');
        const name = param.replace(/[=:].+$/, '').trim().replace(/^\.{3}/, '');
        return [name, isRest];
    });
}

/**
 * Extract docstring from function string
 */
function extractDocstring(funcStr: string): string | undefined {
    const docMatch = funcStr.match(/\/\*\*([\s\S]*?)\*\//);
    if (!docMatch) return undefined;

    return docMatch[1]
        .split('\n')
        .map(line => line.trim().replace(/^\*\s*/, ''))
        .join('\n')
        .trim();
}

/**
 * Map TypeScript type to JSON Schema type
 */
function mapTypeToJsonSchema(typeName: string): JsonSchemaType {
    switch (typeName.toLowerCase()) {
        case 'string':
            return 'string';
        case 'number':
        case 'bigint':
            return 'number';
        case 'integer':
        case 'int':
            return 'integer';
        case 'boolean':
        case 'bool':
            return 'boolean';
        case 'object':
            return 'object';
        case 'array':
            return 'array';
        case 'null':
        case 'undefined':
        case 'void':
            return 'null';
        default:
            // Handle array types
            if (typeName.endsWith('[]') || typeName.match(/array\s*<.*>/i)) {
                return 'array';
            }
            return 'any';
    }
}
