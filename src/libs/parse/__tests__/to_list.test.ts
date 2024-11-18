import { toList, listUtils } from '../to_list';
import { ParseError } from '../types';

// Mock classes for testing
class CustomIterable implements Iterable<number> {
    *[Symbol.iterator]() {
        yield* [1, 2, 3];
    }
}

class CustomMapping {
    [key: number]: string;
    constructor() {
        this[1] = 'a';
        this[2] = 'b';
        this[3] = 'c';
    }
    keys(): number[] {
        return [1, 2, 3];
    }
}

// Test cases
describe('toList', () => {
    // Primitive types tests
    test.each([
        [1, [1]],
        [1.5, [1.5]],
        [true, [true]],
        ['string', ['string']],
        [Buffer.from('bytes'), [Buffer.from('bytes')]],
    ])('converts primitive type %p to list', (input, expected) => {
        expect(toList(input)).toEqual(expected);
    });

    // List input tests
    test.each([
        [[1, 2, 3], [1, 2, 3], false],
        [[1, [2, 3]], [1, [2, 3]], false],
        [[1, [2, 3]], [1, 2, 3], true],
    ])('handles list input %p with flatten=%p', (input, expected, flatten) => {
        expect(toList(input, { flatten })).toEqual(expected);
    });

    // Set input test
    test('converts Set to list', () => {
        const input = new Set([1, 2, 3]);
        const result = toList(input);
        expect(new Set(result)).toEqual(input);
    });

    // Map input test
    test('converts Map to list', () => {
        const map = new Map([['a', 1], ['b', 2]]);
        expect(toList(map, { useValues: true })).toEqual([1, 2]);
    });

    // Object input test
    test('converts object to list', () => {
        const obj = { a: 1, b: 2 };
        expect(toList(obj, { useValues: true })).toEqual([1, 2]);
    });

    // Custom iterable test
    test('converts custom iterable to list', () => {
        const ci = new CustomIterable();
        expect(toList(ci)).toEqual([1, 2, 3]);
    });

    // Custom mapping test
    test('converts custom mapping to list', () => {
        const cm = new CustomMapping();
        expect(toList(cm)).toEqual([cm]);
    });

    // Nested structures tests
    test.each([
        [[1, [2, [3, [4]]]], [1, [2, [3, [4]]]], false],
        [[1, [2, [3, [4]]]], [1, 2, 3, 4], true],
    ])('handles nested structures %p with flatten=%p', (input, expected, flatten) => {
        expect(toList(input, { flatten })).toEqual(expected);
    });

    // Mixed types tests
    test.each([
        [[1, 'two', [3, [4, 'five']]], [1, 'two', [3, [4, 'five']]], false],
        [[1, 'two', [3, [4, 'five']]], [1, 'two', 3, 4, 'five'], true],
    ])('handles mixed types %p with flatten=%p', (input, expected, flatten) => {
        expect(toList(input, { flatten })).toEqual(expected);
    });

    // Null handling tests
    test.each([
        [[1, null, 2, [3, null, 4]], [1, 2, [3, 4]], false, true],
        [[1, null, 2, [3, null, 4]], [1, 2, 3, 4], true, true],
    ])('handles null values with dropna=%p and flatten=%p', (input, expected, flatten, dropna) => {
        expect(toList(input, { flatten, dropna })).toEqual(expected);
    });

    // Empty input tests
    test.each([
        [[], []],
        [{}, [{}]],
        [new Set(), []],
    ])('handles empty input %p', (input, expected) => {
        expect(toList(input)).toEqual(expected);
    });

    // Large input test
    test('handles large input', () => {
        const largeList = Array.from({ length: 10000 }, (_, i) => i);
        expect(toList(largeList)).toEqual(largeList);
    });

    // String handling tests
    test('handles strings with useValues', () => {
        expect(toList('hello', { useValues: true })).toEqual(['h', 'e', 'l', 'l', 'o']);
    });

    // Buffer handling tests
    test('handles Buffer with useValues', () => {
        const buffer = Buffer.from('hello');
        expect(toList(buffer, { useValues: true })).toEqual(['h', 'e', 'l', 'l', 'o']);
    });

    // Complex nested structure tests
    test('handles complex nested structures', () => {
        const input = [1, new Set([2, 3]), new Map([['a', 4], ['b', 5]])];
        expect(toList(input, { flatten: true, useValues: true }))
            .toEqual([1, 2, 3, 4, 5]);
    });

    // Error handling tests
    test('throws error when unique is true but flatten is false', () => {
        expect(() => toList([1, 2, 2], { unique: true, flatten: false }))
            .toThrow(ParseError);
    });

    test('suppresses errors when suppress is true', () => {
        const badInput = { [Symbol.iterator]: 'not a function' };
        expect(toList(badInput, { suppress: true })).toEqual([]);
    });

    // List utilities tests
    describe('listUtils', () => {
        test('flatten with depth control', () => {
            const input = [1, [2, [3, [4]]]];
            expect(listUtils.flatten(input, 1)).toEqual([1, 2, [3, [4]]]);
            expect(listUtils.flatten(input)).toEqual([1, 2, 3, 4]);
        });

        test('dropNulls removes null and undefined', () => {
            expect(listUtils.dropNulls([1, null, 2, undefined, 3]))
                .toEqual([1, 2, 3]);
        });

        test('unique removes duplicates', () => {
            expect(listUtils.unique([1, 2, 2, 3, 3, 1]))
                .toEqual([1, 2, 3]);
        });

        test('isListLike identifies list-like objects', () => {
            expect(listUtils.isListLike([])).toBe(true);
            expect(listUtils.isListLike(new Set())).toBe(true);
            expect(listUtils.isListLike({ length: 1 })).toBe(false);
        });
    });

    // Additional edge cases
    test('handles null input', () => {
        expect(toList(null)).toEqual([]);
    });

    test('handles undefined input', () => {
        expect(toList(undefined)).toEqual([]);
    });

    test('handles deeply nested arrays with flatten', () => {
        const input = [1, [2, [3, [4, [5, [6]]]]]];
        expect(toList(input, { flatten: true })).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('handles array-like objects', () => {
        const arrayLike = { 0: 'a', 1: 'b', length: 2 };
        expect(toList(arrayLike)).toEqual([arrayLike]);
    });

    test('handles generator functions', () => {
        function* generator() {
            yield 1;
            yield 2;
            yield 3;
        }
        expect(toList(generator())).toEqual([1, 2, 3]);
    });

    test('handles async iterables', () => {
        const asyncIterable = {
            async *[Symbol.asyncIterator]() {
                yield 1;
                yield 2;
                yield 3;
            }
        };
        expect(toList(asyncIterable)).toEqual([asyncIterable]);
    });

    test('handles typed arrays', () => {
        const int32Array = new Int32Array([1, 2, 3]);
        expect(toList(int32Array)).toEqual([1, 2, 3]);
    });

    test('handles array subclasses', () => {
        class SubArray extends Array {
            constructor() {
                super();
                this.push(1, 2, 3);
            }
        }
        const subArray = new SubArray();
        expect(toList(subArray)).toEqual([1, 2, 3]);
    });

    test('handles objects with custom iterator', () => {
        const customIterator = {
            *[Symbol.iterator]() {
                yield 'a';
                yield 'b';
                yield 'c';
            }
        };
        expect(toList(customIterator)).toEqual(['a', 'b', 'c']);
    });

    test('handles mixed nested structures with various types', () => {
        const input = [
            1,
            new Set([2, 3]),
            new Map([['a', 4]]),
            { b: 5 },
            [6, [7, new Set([8])]],
        ];
        const result = toList(input, { flatten: true, useValues: true });
        expect(result).toContain(1);
        expect(result).toContain(2);
        expect(result).toContain(3);
        expect(result).toContain(4);
        expect(result).toContain(5);
        expect(result).toContain(6);
        expect(result).toContain(7);
        expect(result).toContain(8);
    });
});
