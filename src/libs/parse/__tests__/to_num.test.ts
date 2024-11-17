import { toNum } from '../to_num';
import { Complex, ParseError } from '../types';

describe('toNum', () => {
    // Basic numeric conversion tests
    test.each([
        ['42', 42.0],
        ['-42', -42.0],
        ['+42', 42.0],
        ['0', 0.0],
        ['3.14159', 3.14159],
        ['-3.14159', -3.14159],
        ['+3.14159', 3.14159],
        ['0.0', 0.0],
        ['.5', 0.5],
        ['5.', 5.0],
        ['1e5', 1e5],
        ['1E5', 1e5],
        ['1.23e-4', 1.23e-4],
        ['1.23E-4', 1.23e-4],
        ['-1.23e4', -1.23e4],
        ['+1.23e4', 1.23e4],
        ['50%', 0.5],
        ['100%', 1.0],
        ['0%', 0.0],
        ['25.5%', 0.255],
        ['1/2', 0.5],
        ['3/4', 0.75],
        ['-1/2', -0.5],
        ['5/2', 2.5],
        [true, 1.0],
        [false, 0.0]
    ])('converts basic numeric input: %s', async (input, expected) => {
        expect(toNum(input)).toBeCloseTo(expected as number);
    });

    // Type conversion tests
    test.each([
        ['42', 'int', 42],
        ['3.14', 'float', 3.14],
        ['1+2j', 'complex', new Complex(1, 2)],
        ['3.14', 'int', 3],
        ['42', 'float', 42.0],
        ['3', 'complex', new Complex(3, 0)]
    ])('converts to specific type: %s to %s', async (input, type, expected) => {
        const result = toNum(input, { numType: type as 'int' | 'float' | 'complex' });
        if (expected instanceof Complex) {
            expect(result).toEqual(expected);
        } else {
            expect(result).toBe(expected);
        }
    });

    // Precision tests
    test.each([
        ['3.14159', 2, 3.14],
        ['3.14159', 4, 3.1416],
        ['3.14159', 0, 3.0],
        ['3.14159', undefined, 3.14159],
        ['100.5555', 2, 100.56],
        ['-3.14159', 3, -3.142]
    ])('handles precision: %s with precision %s', async (input, precision, expected) => {
        expect(toNum(input, { precision })).toBeCloseTo(expected);
    });

    // Bounds testing
    test.each([
        ['50', { upperBound: 100 }, true],
        ['150', { upperBound: 100 }, false],
        ['3.14', { upperBound: 3.0 }, false],
        ['50', { lowerBound: 0 }, true],
        ['-50', { lowerBound: 0 }, false],
        ['2.5', { lowerBound: 3.0 }, false],
        ['50', { lowerBound: 0, upperBound: 100 }, true],
        ['-50', { lowerBound: 0, upperBound: 100 }, false],
        ['150', { lowerBound: 0, upperBound: 100 }, false]
    ])('validates bounds for %s', async (input, bounds, shouldPass) => {
        if (shouldPass) {
            expect(toNum(input, bounds)).toBeDefined();
        } else {
            expect(() => toNum(input, bounds)).toThrow(ParseError);
        }
    });

    // Multiple number extraction tests
    test.each([
        ['1 2 3', 3, [1.0, 2.0, 3.0]],
        ['1,2,3', 3, [1.0, 2.0, 3.0]],
        ['1;2;3', 3, [1.0, 2.0, 3.0]],
        ['1 2.5 3e2', 3, [1.0, 2.5, 300.0]],
        ['50% 1/2 .75', 3, [0.5, 0.5, 0.75]],
        ['1 2 3 4 5', 3, [1.0, 2.0, 3.0]],
        ['1+2j 3-4j 5+0j', 3, [
            new Complex(1, 2),
            new Complex(3, -4),
            new Complex(5, 0)
        ]]
    ])('extracts multiple numbers from %s', async (input, count, expected) => {
        const result = toNum(input, { numCount: count }) as (number | Complex)[];
        expect(result.length).toBe(expected.length);
        result.forEach((val, idx) => {
            if (val instanceof Complex) {
                expect(val).toEqual(expected[idx]);
            } else {
                expect(val).toBeCloseTo(expected[idx] as number);
            }
        });
    });

    // Edge cases and special values
    test.each([
        ['inf', Infinity],
        ['-inf', -Infinity],
        ['infinity', Infinity],
        ['-infinity', -Infinity],
        ['1e308', 1e308],
        ['1e-308', 1e-308],
        ['9'.repeat(20), Number('9'.repeat(20))]
    ])('handles edge case: %s', async (input, expected) => {
        const result = toNum(input);
        if (Number.isFinite(expected)) {
            expect(result).toBeCloseTo(expected);
        } else {
            expect(result).toBe(expected);
        }
    });

    // Error cases
    test.each([
        [[1, 2, 3], TypeError, 'Input cannot be a sequence'],
        ['not a number', ParseError, 'No valid numbers found'],
        ['', ParseError, 'No valid numbers found'],
        ['   ', ParseError, 'No valid numbers found'],
        ['1/0', ParseError, 'Division by zero'],
        ['i', ParseError, 'No valid numbers found']
    ])('throws error for invalid input: %s', async (input, errorType, errorMessage) => {
        expect(() => toNum(input)).toThrow(errorType);
        expect(() => toNum(input)).toThrow(errorMessage);
    });

    // Parameter combination tests
    test('handles combined parameters', () => {
        // Type + Precision
        expect(toNum('3.14159', { numType: 'float', precision: 2 })).toBe(3.14);

        // Type + Bounds
        expect(toNum('50', { 
            numType: 'int',
            upperBound: 100,
            lowerBound: 0
        })).toBe(50);

        // Type + Multiple numbers
        const result = toNum('1 2 3', { 
            numType: 'int',
            numCount: 3
        }) as number[];
        expect(result).toEqual([1, 2, 3]);

        // All parameters
        const complexResult = toNum('3.14159 2.71828', {
            numType: 'float',
            precision: 3,
            upperBound: 4,
            lowerBound: 2,
            numCount: 2
        }) as number[];
        expect(complexResult).toEqual([3.142, 2.718]);
    });

    // Whitespace handling tests
    test.each([
        ['  42  ', 42.0],
        ['\t3.14\n', 3.14],
        ['   50%   ', 0.5],
        ['  1/2  ', 0.5]
    ])('handles whitespace in %s', async (input, expected) => {
        expect(toNum(input)).toBeCloseTo(expected);
    });

    // Mixed format extraction tests
    test.each([
        [
            'int: 42, float: 3.14, scientific: 1e3, percent: 50%, fraction: 1/2',
            5,
            [42.0, 3.14, 1000.0, 0.5, 0.5]
        ],
        [
            'Starting with 100, adding 50%, equals 150',
            3,
            [100.0, 0.5, 150.0]
        ],
        [
            'Complex equation: 1+2j + 2-3j = 3-1j',
            3,
            [new Complex(1, 2), new Complex(2, -3), new Complex(3, -1)]
        ]
    ])('extracts mixed formats from %s', async (input, count, expected) => {
        const result = toNum(input, { numCount: count }) as (number | Complex)[];
        expect(result.length).toBe(expected.length);
        result.forEach((val, idx) => {
            if (val instanceof Complex) {
                expect(val).toEqual(expected[idx]);
            } else {
                expect(val).toBeCloseTo(expected[idx] as number);
            }
        });
    });
});
