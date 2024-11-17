import 'reflect-metadata';
/**
 * OpenAI function schema types
 */
interface OpenAIFunctionSchema {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, ParameterSchema>;
            required: string[];
        };
    };
}
interface ParameterSchema {
    type: string;
    description: string | null;
}
/**
 * Options for schema generation
 */
interface SchemaOptions {
    style?: 'google' | 'rest';
    functionDescription?: string;
    paramDescriptions?: Record<string, string>;
}
/**
 * Decorator to add parameter metadata
 */
export declare function param(description: string): (target: any, propertyKey: string | symbol, parameterIndex: number) => void;
/**
 * Generate OpenAI function schema from TypeScript function
 *
 * @param func - Function to generate schema for
 * @param options - Schema generation options
 * @returns OpenAI function schema
 */
export declare function functionToSchema(func: Function, options?: SchemaOptions): OpenAIFunctionSchema;
/**
 * Example usage with decorators:
 */
/**
 * Optional decorator for function documentation
 */
export declare function doc(description: string): (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => PropertyDescriptor;
export {};
