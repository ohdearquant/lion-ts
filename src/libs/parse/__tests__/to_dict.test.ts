import { toDict } from '../to_dict';
import { ParseError } from '../types';
import { xmlToDictSync } from '../xml_parser';

// Mock classes for testing
class MockModelWithModelDump {
    modelDump(): Record<string, any> {
        return { key: 'value' };
    }
}

class MockObjectWithToDict {
    toDict(): Record<string, any> {
        return { key: 'value' };
    }
}

class MockObjectWithDict {
    dict(): Record<string, any> {
        return { key: 'value' };
    }
}

class MockObjectWithJson {
    json(): string {
        return '{"key": "value"}';
    }
}

// Test cases
describe('toDict', () => {
    test('converts dictionary input', () => {
        const inputDict = { a: 1, b: 2 };
        expect(toDict(inputDict)).toEqual(inputDict);
    });

    test('converts null input to empty object', () => {
        expect(toDict(null)).toEqual({});
    });

    test('converts undefined input to empty object', () => {
        expect(toDict(undefined)).toEqual({});
    });

    test('converts Map to dictionary', () => {
        const inputMap = new Map([['a', 1], ['b', 2]]);
        expect(toDict(inputMap)).toEqual({ a: 1, b: 2 });
    });

    test.each([
        ['{"a": 1, "b": 2}', { a: 1, b: 2 }],
        ['', {}],
    ])('converts JSON string to dictionary: %s', (input, expected) => {
        expect(toDict(input)).toEqual(expected);
    });

    test('throws error for invalid JSON string', () => {
        expect(() => toDict('{invalid_json}')).toThrow();
    });

    test('converts XML string to dictionary', () => {
        const xmlString = '<root><child>value</child></root>';
        const expected = { root: { child: 'value' } };
        expect(toDict(xmlString, { strType: 'xml' })).toEqual(expected);
    });

    test('converts Set to dictionary', () => {
        const inputSet = new Set([1, 2, 3]);
        const expected = { '1': 1, '2': 2, '3': 3 };
        expect(toDict(inputSet)).toEqual(expected);
    });

    test('converts array to dictionary', () => {
        const inputList = [1, 2, 3];
        const expected = { '0': 1, '1': 2, '2': 3 };
        expect(toDict(inputList)).toEqual(expected);
    });

    test('converts object with modelDump', () => {
        const obj = new MockModelWithModelDump();
        expect(toDict(obj, { useDictDump: true })).toEqual({ key: 'value' });
    });

    test.each([
        [MockObjectWithToDict],
        [MockObjectWithDict],
        [MockObjectWithJson],
    ])('converts object with custom methods: %p', (ObjClass) => {
        const obj = new ObjClass();
        expect(toDict(obj)).toEqual({ key: 'value' });
    });

    test('converts plain object with properties', () => {
        class SimpleObject {
            a = 1;
            b = 2;
        }
        const obj = new SimpleObject();
        expect(toDict(obj)).toEqual({ a: 1, b: 2 });
    });

    test('converts fuzzy JSON with fuzzyParse option', () => {
        const fuzzyJson = "{'a': 1, 'b': 2}"; // Invalid JSON, but can be fuzzy parsed
        expect(toDict(fuzzyJson, { fuzzyParse: true })).toEqual({ a: 1, b: 2 });
    });

    test('uses custom parser when provided', () => {
        const customParser = (s: string) => ({ parsed: s });
        expect(toDict('test', { parser: customParser })).toEqual({ parsed: 'test' });
    });

    test('returns empty object when suppressing errors', () => {
        expect(toDict('{invalid_json}', { suppress: true })).toEqual({});
    });

    test('converts empty Map to empty object', () => {
        expect(toDict(new Map())).toEqual({});
    });

    test('converts nested structures', () => {
        const nested = { a: [1, 2, { b: 3 }], c: { d: 4 } };
        expect(toDict(nested)).toEqual(nested);
    });

    test('throws error for invalid string type', () => {
        expect(() => toDict('{}', { strType: 'yaml' as any }))
            .toThrow('Unsupported string type, must be "json" or "xml"');
    });

    // Recursive conversion tests
    test('performs recursive conversion', () => {
        const input = {
            a: '{"x": 1}',
            b: [1, '{"y": 2}'],
            c: { d: '{"z": 3}' }
        };
        const expected = {
            a: { x: 1 },
            b: [1, { y: 2 }],
            c: { d: { z: 3 } }
        };
        expect(toDict(input, { recursive: true })).toEqual(expected);
    });

    test('respects maxRecursiveDepth', () => {
        const deepInput = { a: { b: { c: { d: { e: 1 } } } } };
        const result = toDict(deepInput, { recursive: true, maxRecursiveDepth: 2 });
        expect(result.a.b.c).toEqual({ d: { e: 1 } }); // Stops recursing at depth 2
    });

    test('throws error for invalid maxRecursiveDepth', () => {
        expect(() => toDict({}, { recursive: true, maxRecursiveDepth: -1 }))
            .toThrow('maxRecursiveDepth must be a non-negative integer');
        expect(() => toDict({}, { recursive: true, maxRecursiveDepth: 11 }))
            .toThrow('maxRecursiveDepth must be less than or equal to 10');
    });

    // Performance test
    test('handles large dictionaries efficiently', () => {
        const largeDict = Object.fromEntries(
            Array.from({ length: 10000 }, (_, i) => [String(i), i])
        );
        const startTime = Date.now();
        const result = toDict(largeDict);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeLessThan(100); // Should take less than 100ms
        expect(result).toEqual(largeDict);
    });
});
