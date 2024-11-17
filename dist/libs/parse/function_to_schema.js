"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doc = exports.functionToSchema = exports.param = void 0;
require("reflect-metadata");
/**
 * TypeScript to JSON Schema type mapping
 */
const typeMapping = {
    'String': 'string',
    'Number': 'number',
    'Boolean': 'boolean',
    'Object': 'object',
    'Array': 'array',
    'Any': 'any',
    'Void': 'null',
    'Undefined': 'null',
    'Null': 'null',
    // Add more type mappings as needed
};
/**
 * Decorator to add parameter metadata
 */
function param(description) {
    return function (target, propertyKey, parameterIndex) {
        const existingParams = Reflect.getMetadata('paramDescriptions', target, propertyKey) || {};
        existingParams[parameterIndex] = description;
        Reflect.defineMetadata('paramDescriptions', existingParams, target, propertyKey);
    };
}
exports.param = param;
/**
 * Generate OpenAI function schema from TypeScript function
 *
 * @param func - Function to generate schema for
 * @param options - Schema generation options
 * @returns OpenAI function schema
 */
function functionToSchema(func, options = {}) {
    const { style = 'google', functionDescription, paramDescriptions } = options;
    // Get function name
    const funcName = func.name;
    // Extract function description and parameter descriptions from docstring
    let [funcDesc, paramsDesc] = extractDocstring(func, style);
    funcDesc = functionDescription || funcDesc || '';
    // Merge provided parameter descriptions with extracted ones
    const finalParamDescs = { ...paramsDesc, ...paramDescriptions };
    // Extract parameter information
    const parameters = extractParameters(func, finalParamDescs);
    return {
        type: 'function',
        function: {
            name: funcName,
            description: funcDesc,
            parameters
        }
    };
}
exports.functionToSchema = functionToSchema;
/**
 * Extract parameter information from function
 */
function extractParameters(func, paramDescriptions) {
    const parameters = {
        type: 'object',
        properties: {},
        required: []
    };
    // Try to get parameter metadata using reflect-metadata
    const paramTypes = Reflect.getMetadata('design:paramtypes', func) || [];
    const paramNames = getParameterNames(func);
    paramNames.forEach((name, index) => {
        const paramType = paramTypes[index];
        const paramTypeName = paramType?.name || 'Any';
        const description = paramDescriptions[name] || null;
        parameters.properties[name] = {
            type: typeMapping[paramTypeName] || 'any',
            description
        };
        // Assume all parameters are required for now
        parameters.required.push(name);
    });
    return parameters;
}
/**
 * Get parameter names from function
 */
function getParameterNames(func) {
    // Extract parameter names from function string
    const funcStr = func.toString();
    const paramMatch = funcStr.match(/\(([\s\S]*?)\)/);
    if (!paramMatch)
        return [];
    const params = paramMatch[1]
        .split(',')
        .map(p => p.trim())
        .filter(p => p !== '');
    return params.map(p => p.split(':')[0].trim());
}
/**
 * Example usage with decorators:
 */
/*
class Example {
    @doc('Example function that adds two numbers')
    add(
        @param('First number') a: number,
        @param('Second number') b: number
    ): number {
        return a + b;
    }
}

const schema = functionToSchema(Example.prototype.add);
*/
/**
 * Optional decorator for function documentation
 */
function doc(description) {
    return function (target, propertyKey, descriptor) {
        Reflect.defineMetadata('funcDescription', description, target, propertyKey);
        return descriptor;
    };
}
exports.doc = doc;
/**
 * Extract docstring from function (implementation needed)
 */
function extractDocstring(func, style) {
    // Get function documentation using previously implemented extractDocstring
    // This should use the same logic as the prior implementation
    return [null, {}];
}
