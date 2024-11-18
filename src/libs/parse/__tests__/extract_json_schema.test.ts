import { extractJsonSchema } from '../extract_json_schema';
import { JsonSchema } from '../types';

describe('extractJsonSchema', () => {
    describe('basic type extraction', () => {
        test('extracts string type', () => {
            const data = { name: 'John' };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            });
        });

        test('extracts number type', () => {
            const data = { count: 42.5 };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    count: { type: 'number' }
                }
            });
        });

        test('extracts integer type', () => {
            const data = { count: 42 };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    count: { type: 'integer' }
                }
            });
        });

        test('extracts boolean type', () => {
            const data = { isActive: true };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    isActive: { type: 'boolean' }
                }
            });
        });

        test('extracts null type', () => {
            const data = { value: null };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    value: { type: 'null' }
                }
            });
        });
    });

    describe('nested structures', () => {
        test('extracts nested object schema', () => {
            const data = {
                person: {
                    name: 'John',
                    age: 30,
                    address: {
                        street: '123 Main St',
                        city: 'Anytown'
                    }
                }
            };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    person: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            age: { type: 'integer' },
                            address: {
                                type: 'object',
                                properties: {
                                    street: { type: 'string' },
                                    city: { type: 'string' }
                                }
                            }
                        }
                    }
                }
            });
        });

        test('extracts array schema with homogeneous items', () => {
            const data = {
                numbers: [1, 2, 3],
                strings: ['a', 'b', 'c']
            };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    numbers: {
                        type: 'array',
                        items: { type: 'integer' }
                    },
                    strings: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                }
            });
        });

        test('extracts array schema with object items', () => {
            const data = {
                people: [
                    { name: 'John', age: 30 },
                    { name: 'Jane', age: 25 }
                ]
            };
            const schema = extractJsonSchema(data);
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    people: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                age: { type: 'integer' }
                            }
                        }
                    }
                }
            });
        });
    });

    describe('options handling', () => {
        test('uses custom separator', () => {
            const data = {
                nested: { value: 'test' }
            };
            const schema = extractJsonSchema(data, { sep: '.' });
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    nested: {
                        type: 'object',
                        properties: {
                            value: { type: 'string' }
                        }
                    }
                }
            });
        });

        test('respects maxDepth option', () => {
            const data = {
                l1: { l2: { l3: { l4: 'deep' } } }
            };
            const schema = extractJsonSchema(data, { maxDepth: 2 });
            expect(schema.properties?.l1.properties?.l2).toBeDefined();
            expect(schema.properties?.l1.properties?.l2.properties?.l3).toBeUndefined();
        });

        test('handles dynamic array option', () => {
            const data = [1, 2, 3];
            const schema = extractJsonSchema(data, { dynamic: true });
            expect(schema.type).toBe('object');
            expect(schema.properties).toBeDefined();
        });

        test('handles coerceSequence option', () => {
            const data = [1, 2, 3];
            const schemaAsList = extractJsonSchema(data, { coerceSequence: 'list' });
            expect(schemaAsList.type).toBe('object');
            const schemaAsDict = extractJsonSchema(data, { coerceSequence: 'dict' });
            expect(schemaAsDict.type).toBe('object');
        });
    });

    describe('edge cases', () => {
        test('handles empty object', () => {
            const schema = extractJsonSchema({});
            expect(schema).toEqual({
                type: 'object',
                properties: {}
            });
        });

        test('handles empty array', () => {
            const schema = extractJsonSchema({ arr: [] });
            expect(schema).toEqual({
                type: 'object',
                properties: {
                    arr: {
                        type: 'array',
                        items: { type: 'any' }
                    }
                }
            });
        });

        test('handles mixed type arrays', () => {
            const data = { mixed: [1, 'two', true] };
            const schema = extractJsonSchema(data);
            expect(schema.properties?.mixed.type).toBe('array');
            expect(schema.properties?.mixed.oneOf).toBeDefined();
        });

        test('handles numeric keys', () => {
            const data = { '0': 'zero', '1': 'one' };
            const schema = extractJsonSchema(data);
            expect(schema.type).toBe('object');
            expect(schema.properties).toHaveProperty('0');
            expect(schema.properties).toHaveProperty('1');
        });

        test('handles null input', () => {
            const schema = extractJsonSchema(null);
            expect(schema).toEqual({
                type: 'object',
                properties: {}
            });
        });

        test('handles undefined input', () => {
            const schema = extractJsonSchema(undefined);
            expect(schema).toEqual({
                type: 'object',
                properties: {}
            });
        });

        test('handles deeply nested arrays', () => {
            const data = { deep: [[[[1]]]] };
            const schema = extractJsonSchema(data);
            expect(schema.properties?.deep.type).toBe('array');
        });

        test('handles arrays with null values', () => {
            const data = { arr: [1, null, 3] };
            const schema = extractJsonSchema(data);
            expect(schema.properties?.arr.type).toBe('array');
            expect(schema.properties?.arr.oneOf).toBeDefined();
        });
    });
});
