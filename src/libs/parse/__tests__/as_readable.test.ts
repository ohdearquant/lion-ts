import { asReadable, asReadableJson } from '../as_readable';
import { ParseError } from '../types';

describe('asReadableJson', () => {
    describe('basic functionality', () => {
        test('converts simple object to readable JSON', () => {
            const input = { name: 'John', age: 30 };
            const result = asReadableJson(input);
            expect(result).toBe('{\n    "name": "John",\n    "age": 30\n}');
        });

        test('handles nested objects', () => {
            const input = { 
                person: { 
                    name: 'John',
                    address: { city: 'New York' } 
                } 
            };
            const result = asReadableJson(input);
            expect(result).toBe(
                '{\n' +
                '    "person": {\n' +
                '        "name": "John",\n' +
                '        "address": {\n' +
                '            "city": "New York"\n' +
                '        }\n' +
                '    }\n' +
                '}'
            );
        });

        test('handles arrays', () => {
            const input = [
                { name: 'John' },
                { name: 'Jane' }
            ];
            const result = asReadableJson(input);
            expect(result).toBe(
                '{\n    "name": "John"\n}\n\n{\n    "name": "Jane"\n}'
            );
        });
    });

    describe('empty input handling', () => {
        test('handles null input', () => {
            expect(asReadableJson(null)).toBe('{}');
        });

        test('handles undefined input', () => {
            expect(asReadableJson(undefined)).toBe('{}');
        });

        test('handles empty array', () => {
            expect(asReadableJson([])).toBe('');
        });

        test('handles empty object', () => {
            expect(asReadableJson({})).toBe('{}');
        });
    });

    describe('options handling', () => {
        test('respects custom indent', () => {
            const input = { name: 'John' };
            const result = asReadableJson(input, { indent: 2 });
            expect(result).toBe('{\n  "name": "John"\n}');
        });

        test('handles recursive option', () => {
            const input = { 
                outer: { 
                    inner: { value: 42 } 
                } 
            };
            const result = asReadableJson(input, { recursive: false });
            expect(JSON.parse(result)).toEqual(input);
        });

        test('respects maxRecursiveDepth', () => {
            const input = {
                l1: { l2: { l3: { l4: 'deep' } } }
            };
            const result = asReadableJson(input, { maxRecursiveDepth: 2 });
            expect(JSON.parse(result)).toHaveProperty('l1.l2');
        });
    });

    describe('special types handling', () => {
        test('converts Set to array', () => {
            const input = { values: new Set([1, 2, 3]) };
            const result = asReadableJson(input);
            expect(result).toBe('{\n    "values": [\n        1,\n        2,\n        3\n    ]\n}');
        });

        test('converts Map to object', () => {
            const map = new Map([['key', 'value']]);
            const input = { map };
            const result = asReadableJson(input);
            expect(result).toBe('{\n    "map": {\n        "key": "value"\n    }\n}');
        });

        test('converts BigInt to string', () => {
            const input = { big: BigInt(9007199254740991) };
            const result = asReadableJson(input);
            expect(result).toBe('{\n    "big": "9007199254740991"\n}');
        });

        test('converts undefined to null', () => {
            const input = { value: undefined };
            const result = asReadableJson(input);
            expect(result).toBe('{\n    "value": null\n}');
        });
    });

    describe('error handling', () => {
        test('throws ParseError for circular references', () => {
            const circular: any = { self: null };
            circular.self = circular;
            expect(() => asReadableJson(circular)).toThrow(ParseError);
        });

        test('handles invalid toJSON implementations', () => {
            const badObject = {
                toJSON: () => { throw new Error('Bad toJSON'); }
            };
            expect(() => asReadableJson(badObject)).toThrow(ParseError);
        });
    });
});

describe('asReadable', () => {
    describe('basic functionality', () => {
        test('converts object to string without markdown', () => {
            const input = { name: 'John' };
            const result = asReadable(input);
            expect(result).toBe('{\n    "name": "John"\n}');
        });

        test('converts object to string with markdown', () => {
            const input = { name: 'John' };
            const result = asReadable(input, {}, true);
            expect(result).toBe('```json\n{\n    "name": "John"\n}\n```');
        });
    });

    describe('error handling', () => {
        test('returns string representation on error', () => {
            const circular: any = {};
            circular.self = circular;
            const result = asReadable(circular);
            expect(typeof result).toBe('string');
            expect(result).toContain('[object Object]');
        });

        test('handles primitive inputs', () => {
            expect(asReadable(123)).toBe('123');
            expect(asReadable('test')).toBe('"test"');
            expect(asReadable(true)).toBe('true');
        });
    });

    describe('options handling', () => {
        test('passes options to asReadableJson', () => {
            const input = { name: 'John' };
            const result = asReadable(input, { indent: 2 });
            expect(result).toBe('{\n  "name": "John"\n}');
        });

        test('combines options with markdown', () => {
            const input = { name: 'John' };
            const result = asReadable(input, { indent: 2 }, true);
            expect(result).toBe('```json\n{\n  "name": "John"\n}\n```');
        });
    });
});
