import { jsonSchemaToRegex, regexUtils } from '../json_schema_to_regex';
import type { JsonSchema } from '../types';

describe('jsonSchemaToRegex', () => {
    describe('primitive types', () => {
        test('generates pattern for string type', () => {
            const schema: JsonSchema = { type: 'string' };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '"test"')).toBe(true);
            expect(regexUtils.testPattern(pattern, 'test')).toBe(false);
        });

        test('generates pattern for integer type', () => {
            const schema: JsonSchema = { type: 'integer' };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '123')).toBe(true);
            expect(regexUtils.testPattern(pattern, '-456')).toBe(true);
            expect(regexUtils.testPattern(pattern, '12.34')).toBe(false);
        });

        test('generates pattern for number type', () => {
            const schema: JsonSchema = { type: 'number' };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '123')).toBe(true);
            expect(regexUtils.testPattern(pattern, '12.34')).toBe(true);
            expect(regexUtils.testPattern(pattern, '-12.34')).toBe(true);
            expect(regexUtils.testPattern(pattern, 'abc')).toBe(false);
        });

        test('generates pattern for boolean type', () => {
            const schema: JsonSchema = { type: 'boolean' };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, 'true')).toBe(true);
            expect(regexUtils.testPattern(pattern, 'false')).toBe(true);
            expect(regexUtils.testPattern(pattern, 'yes')).toBe(false);
        });

        test('generates pattern for null type', () => {
            const schema: JsonSchema = { type: 'null' };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, 'null')).toBe(true);
            expect(regexUtils.testPattern(pattern, 'undefined')).toBe(false);
        });
    });

    describe('object patterns', () => {
        test('generates pattern for empty object', () => {
            const schema: JsonSchema = { 
                type: 'object',
                properties: {} 
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '{}')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{ }')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{a:1}')).toBe(false);
        });

        test('generates pattern for object with single property', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '{"name":"John"}')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{"name": "John"}')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{"age":30}')).toBe(false);
        });

        test('generates pattern for object with multiple properties', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'integer' }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '{"name":"John","age":30}')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{"age":30,"name":"John"}')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{"name":"John"}')).toBe(false);
        });

        test('handles special characters in property names', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    '@type': { type: 'string' },
                    '$ref': { type: 'string' }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '{"@type":"Person","$ref":"#/123"}')).toBe(true);
        });
    });

    describe('array patterns', () => {
        test('generates pattern for empty array', () => {
            const schema: JsonSchema = { 
                type: 'array',
                items: { type: 'any' }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '[]')).toBe(true);
            expect(regexUtils.testPattern(pattern, '[ ]')).toBe(true);
            expect(regexUtils.testPattern(pattern, '[1]')).toBe(true); // Any type allows anything
        });

        test('generates pattern for array with primitive items', () => {
            const schema: JsonSchema = {
                type: 'array',
                items: { type: 'number' }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '[1,2,3]')).toBe(true);
            expect(regexUtils.testPattern(pattern, '[1.5, -2.3]')).toBe(true);
            expect(regexUtils.testPattern(pattern, '["a","b"]')).toBe(false);
        });

        test('generates pattern for array with object items', () => {
            const schema: JsonSchema = {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' }
                    }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '[{"id":1},{"id":2}]')).toBe(true);
            expect(regexUtils.testPattern(pattern, '[{"id":"1"}]')).toBe(false);
        });
    });

    describe('nested structures', () => {
        test('handles nested objects', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    person: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            age: { type: 'integer' }
                        }
                    }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, 
                '{"person":{"name":"John","age":30}}'
            )).toBe(true);
        });

        test('handles nested arrays', () => {
            const schema: JsonSchema = {
                type: 'array',
                items: {
                    type: 'array',
                    items: { type: 'integer' }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '[[1,2],[3,4]]')).toBe(true);
            expect(regexUtils.testPattern(pattern, '[[1,"2"],[3,4]]')).toBe(false);
        });

        test('handles mixed nesting', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    scores: {
                        type: 'array',
                        items: { type: 'number' }
                    }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, 
                '{"name":"John","scores":[95.5,87.3]}'
            )).toBe(true);
        });
    });

    describe('regexUtils', () => {
        test('testPattern handles invalid regex patterns', () => {
            expect(regexUtils.testPattern('[invalid', 'test')).toBe(false);
        });

        test('validatePattern checks pattern validity', () => {
            expect(regexUtils.validatePattern('^[a-z]+$')).toBe(true);
            expect(regexUtils.validatePattern('[invalid')).toBe(false);
        });

        test('simplifyPattern normalizes whitespace', () => {
            const pattern = '\\{\\s+\\}';
            const simplified = regexUtils.simplifyPattern(pattern);
            expect(simplified).toBe('\\{\\s*\\}');
        });
    });

    describe('edge cases', () => {
        test('handles schema without type', () => {
            const schema: JsonSchema = { type: 'any' };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, 'anything')).toBe(true);
        });

        test('handles unknown type', () => {
            const schema: JsonSchema = { type: 'any' };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, 'anything')).toBe(true);
        });

        test('handles whitespace variations', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };
            const pattern = jsonSchemaToRegex(schema);
            expect(regexUtils.testPattern(pattern, '{"name":"John"}')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{ "name" : "John" }')).toBe(true);
            expect(regexUtils.testPattern(pattern, '{\n"name"\n:\n"John"\n}')).toBe(true);
        });
    });
});
