import 'reflect-metadata';
import { functionToSchema } from '../function_to_schema';

describe('functionToSchema', () => {
    describe('basic function schema generation', () => {
        test('generates schema for simple function', () => {
            function testFunc(a: number, b: string) {}
            const schema = functionToSchema(testFunc, {
                paramTypes: {
                    a: 'number',
                    b: 'string'
                }
            });
            
            expect(schema.type).toBe('function');
            expect(schema.function.name).toBe('testFunc');
            expect(schema.function.parameters.type).toBe('object');
            expect(schema.function.parameters.properties).toHaveProperty('a');
            expect(schema.function.parameters.properties).toHaveProperty('b');
            expect(schema.function.parameters.properties.a.type).toBe('number');
            expect(schema.function.parameters.properties.b.type).toBe('string');
        });

        test('handles function without parameters', () => {
            function noParams() {}
            const schema = functionToSchema(noParams);
            
            expect(schema.function.name).toBe('noParams');
            expect(schema.function.parameters.properties).toEqual({});
            expect(schema.function.parameters.required).toEqual([]);
        });

        test('includes all parameters as required', () => {
            function testFunc(a: number, b: string) {}
            const schema = functionToSchema(testFunc, {
                paramTypes: {
                    a: 'number',
                    b: 'string'
                }
            });
            
            expect(schema.function.parameters.required).toContain('a');
            expect(schema.function.parameters.required).toContain('b');
        });
    });

    describe('type mapping', () => {
        test('maps primitive types correctly', () => {
            function types(
                str: string,
                num: number,
                bool: boolean,
                obj: object,
                arr: any[]
            ) {}
            
            const schema = functionToSchema(types, {
                paramTypes: {
                    str: 'string',
                    num: 'number',
                    bool: 'boolean',
                    obj: 'object',
                    arr: 'array'
                }
            });
            const props = schema.function.parameters.properties;
            
            expect(props.str.type).toBe('string');
            expect(props.num.type).toBe('number');
            expect(props.bool.type).toBe('boolean');
            expect(props.obj.type).toBe('object');
            expect(props.arr.type).toBe('array');
        });

        test('handles null and undefined types', () => {
            function nullableFunc(
                n: null,
                u: undefined,
                v: void
            ) {}
            
            const schema = functionToSchema(nullableFunc, {
                paramTypes: {
                    n: 'null',
                    u: 'null',
                    v: 'null'
                }
            });
            const props = schema.function.parameters.properties;
            
            expect(props.n.type).toBe('null');
            expect(props.u.type).toBe('null');
            expect(props.v.type).toBe('null');
        });

        test('defaults to "any" for unknown types', () => {
            class CustomType {}
            function customFunc(param: CustomType) {}
            
            const schema = functionToSchema(customFunc);
            expect(schema.function.parameters.properties.param.type).toBe('any');
        });
    });

    describe('metadata handling', () => {
        test('uses provided function description', () => {
            function testFunc() {}
            const schema = functionToSchema(testFunc, {
                functionDescription: 'Custom description'
            });
            
            expect(schema.function.description).toBe('Custom description');
        });

        test('uses provided parameter descriptions', () => {
            function testFunc(a: number, b: string) {}
            const schema = functionToSchema(testFunc, {
                paramTypes: {
                    a: 'number',
                    b: 'string'
                },
                paramDescriptions: {
                    a: 'Parameter A',
                    b: 'Parameter B'
                }
            });
            
            expect(schema.function.parameters.properties.a.description).toBe('Parameter A');
            expect(schema.function.parameters.properties.b.description).toBe('Parameter B');
        });

        test('handles missing parameter descriptions', () => {
            function testFunc(a: number, b: string) {}
            const schema = functionToSchema(testFunc, {
                paramTypes: {
                    a: 'number',
                    b: 'string'
                },
                paramDescriptions: {
                    a: 'Parameter A'
                }
            });
            
            expect(schema.function.parameters.properties.a.description).toBe('Parameter A');
            expect(schema.function.parameters.properties.b.description).toBeNull();
        });
    });

    describe('edge cases', () => {
        test('handles anonymous functions', () => {
            const schema = functionToSchema(function(a: number) {}, {
                paramTypes: { a: 'number' }
            });
            expect(schema.function.name).toBe('');
            expect(schema.function.parameters.properties).toHaveProperty('a');
        });

        test('handles arrow functions', () => {
            const schema = functionToSchema((a: number) => {}, {
                paramTypes: { a: 'number' }
            });
            expect(schema.function.parameters.properties).toHaveProperty('a');
        });

        test('handles functions with default parameters', () => {
            function defaultParams(a: number = 1, b: string = 'default') {}
            const schema = functionToSchema(defaultParams, {
                paramTypes: {
                    a: 'number',
                    b: 'string'
                }
            });
            
            expect(schema.function.parameters.properties).toHaveProperty('a');
            expect(schema.function.parameters.properties).toHaveProperty('b');
        });

        test('handles functions with rest parameters', () => {
            function restParams(...args: number[]) {}
            const schema = functionToSchema(restParams, {
                paramTypes: { args: 'array' }
            });
            
            // Get the actual property name from the schema
            const props = schema.function.parameters.properties;
            const propNames = Object.keys(props);
            expect(propNames).toHaveLength(1);
            
            const propName = propNames[0];
            expect(props[propName].type).toBe('array');
        });

        test('handles functions with destructured parameters', () => {
            function destructured({ a, b }: { a: number; b: string }) {}
            const schema = functionToSchema(destructured, {
                paramTypes: { a: 'number', b: 'string' }
            });
            
            expect(schema.function.parameters.properties).toBeDefined();
        });

        test('handles functions without metadata', () => {
            function noMetadata(a: number) {}
            const schema = functionToSchema(noMetadata, {
                paramTypes: { a: 'number' }
            });
            
            expect(schema.function.description).toBe('');
            expect(schema.function.parameters.properties.a.description).toBeNull();
        });
    });
});
