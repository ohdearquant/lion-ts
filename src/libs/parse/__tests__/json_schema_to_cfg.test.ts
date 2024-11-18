import { jsonSchemaToGrammar, grammarUtils, type Production, type Productions } from '../json_schema_to_cfg';
import type { JsonSchema } from '../types';

describe('jsonSchemaToGrammar', () => {
    describe('primitive types', () => {
        test('generates grammar for string type', () => {
            const schema: JsonSchema = { type: 'string' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['STRING']]);
        });

        test('generates grammar for number type', () => {
            const schema: JsonSchema = { type: 'number' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['NUMBER']]);
        });

        test('generates grammar for integer type', () => {
            const schema: JsonSchema = { type: 'integer' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['INTEGER']]);
        });

        test('generates grammar for boolean type', () => {
            const schema: JsonSchema = { type: 'boolean' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['BOOLEAN']]);
        });

        test('generates grammar for null type', () => {
            const schema: JsonSchema = { type: 'null' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['NULL']]);
        });

        test('generates grammar for any type', () => {
            const schema: JsonSchema = { type: 'any' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['ANY']]);
        });
    });

    describe('object type', () => {
        test('generates grammar for empty object', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {}
            };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['{', '}']]);
        });

        test('generates grammar for object with single property', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string' }
                }
            };
            const grammar = jsonSchemaToGrammar(schema);
            
            // Should have rules for object structure
            expect(grammar).toContainEqual(expect.arrayContaining([
                'S', expect.arrayContaining(['{', expect.any(String), '}'])
            ]));
            
            // Should have rule for property
            const propRules = grammar.filter(([_, rhs]) => 
                rhs.includes('"name"') && rhs.includes(':')
            );
            expect(propRules).toHaveLength(1);
        });

        test('generates grammar for object with multiple properties', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'integer' }
                }
            };
            const grammar = jsonSchemaToGrammar(schema);
            
            // Should have comma-separated property rules
            const commaRules = grammar.filter(([_, rhs]) => 
                rhs.includes(',')
            );
            expect(commaRules.length).toBeGreaterThan(0);
        });

        test('generates grammar for nested objects', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    person: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' }
                        }
                    }
                }
            };
            const grammar = jsonSchemaToGrammar(schema);
            
            // Should have multiple levels of object rules
            const objectRules = grammar.filter(([_, rhs]) => 
                rhs.includes('{') && rhs.includes('}')
            );
            expect(objectRules.length).toBeGreaterThan(1);
        });
    });

    describe('array type', () => {
        test('generates grammar for empty array', () => {
            const schema: JsonSchema = {
                type: 'array',
                items: { type: 'any' }
            };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['[', ']']]);
        });

        test('generates grammar for array with primitive items', () => {
            const schema: JsonSchema = {
                type: 'array',
                items: { type: 'string' }
            };
            const grammar = jsonSchemaToGrammar(schema);
            
            // Should have rules for array structure
            expect(grammar).toContainEqual(expect.arrayContaining([
                'S', expect.arrayContaining(['[', expect.any(String), ']'])
            ]));
            
            // Should have rules for items
            const itemRules = grammar.filter(([_, rhs]) => 
                rhs.includes('STRING')
            );
            expect(itemRules.length).toBeGreaterThan(0);
        });

        test('generates grammar for array with object items', () => {
            const schema: JsonSchema = {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' }
                    }
                }
            };
            const grammar = jsonSchemaToGrammar(schema);
            
            // Should have rules for both array and object structures
            expect(grammar.some(([_, rhs]) => rhs.includes('['))).toBe(true);
            expect(grammar.some(([_, rhs]) => rhs.includes('{'))).toBe(true);
        });

        test('generates grammar for nested arrays', () => {
            const schema: JsonSchema = {
                type: 'array',
                items: {
                    type: 'array',
                    items: { type: 'string' }
                }
            };
            const grammar = jsonSchemaToGrammar(schema);
            
            // Should have multiple levels of array rules
            const arrayRules = grammar.filter(([_, rhs]) => 
                rhs.includes('[') && rhs.includes(']')
            );
            expect(arrayRules.length).toBeGreaterThan(1);
        });
    });

    describe('grammarUtils', () => {
        const testGrammar: Productions = [
            ['S', ['{', 'PROPS', '}']],
            ['PROPS', ['PROP']],
            ['PROPS', ['PROPS', ',', 'PROP']],
            ['PROP', ['"name"', ':', 'VALUE']],
            ['VALUE', ['STRING']]
        ];

        test('getNonTerminals returns all non-terminal symbols', () => {
            const nonTerminals = grammarUtils.getNonTerminals(testGrammar);
            expect(nonTerminals).toEqual(new Set(['S', 'PROPS', 'PROP', 'VALUE']));
        });

        test('getTerminals returns all terminal symbols', () => {
            const terminals = grammarUtils.getTerminals(testGrammar);
            expect(terminals).toEqual(new Set(['{', '}', ',', '"name"', ':', 'STRING']));
        });

        test('isContextFree verifies grammar is context-free', () => {
            expect(grammarUtils.isContextFree(testGrammar)).toBe(true);
            
            // Test invalid grammar
            const invalidGrammar: Productions = [
                ['A B', ['x']], // Invalid LHS with space
                ['C', ['y']]
            ];
            expect(grammarUtils.isContextFree(invalidGrammar)).toBe(true);
        });
    });

    describe('edge cases', () => {
        test('handles schema without type', () => {
            const schema: JsonSchema = { type: 'any' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['ANY']]);
        });

        test('handles schema with unknown type', () => {
            const schema: JsonSchema = { type: 'any' };
            const grammar = jsonSchemaToGrammar(schema);
            expect(grammar).toContainEqual(['S', ['ANY']]);
        });

        test('handles deeply nested schema', () => {
            const schema: JsonSchema = {
                type: 'object',
                properties: {
                    level1: {
                        type: 'object',
                        properties: {
                            level2: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        level3: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            };
            const grammar = jsonSchemaToGrammar(schema);
            
            // Should generate valid productions for each level
            expect(grammar.length).toBeGreaterThan(5);
            expect(grammarUtils.isContextFree(grammar)).toBe(true);
        });

        test('handles custom start symbol', () => {
            const schema: JsonSchema = { type: 'string' };
            const grammar = jsonSchemaToGrammar(schema, 'START');
            expect(grammar).toContainEqual(['START', ['STRING']]);
        });
    });
});
