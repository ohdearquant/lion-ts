import { validateBoolean } from '../validate_boolean';
import { TRUE_VALUES, FALSE_VALUES } from '../../../constants/parse';
import { ValueError, TypeError as CustomTypeError } from '../../errors';

describe('validateBoolean', () => {
    // Test boolean inputs
    test.each([true, false])('returns boolean input %p unchanged', (value) => {
        expect(validateBoolean(value)).toBe(value);
    });

    // Test true string values
    test.each([...TRUE_VALUES])('converts true string value "%s"', (value) => {
        expect(validateBoolean(value)).toBe(true);
        expect(validateBoolean(value.toUpperCase())).toBe(true);
        expect(validateBoolean(` ${value} `)).toBe(true);
    });

    // Test false string values
    test.each([...FALSE_VALUES])('converts false string value "%s"', (value) => {
        expect(validateBoolean(value)).toBe(false);
        expect(validateBoolean(value.toUpperCase())).toBe(false);
        expect(validateBoolean(` ${value} `)).toBe(false);
    });

    // Test numeric values
    test.each([
        [0, false],
        [0.0, false],
        [-0, false],
        [1, true],
        [-1, true],
        [1.5, true],
        [42, true],
        [Infinity, true],
        [-Infinity, true]
    ])('converts numeric value %p to %p', (value, expected) => {
        expect(validateBoolean(value)).toBe(expected);
    });

    // Test complex number strings
    describe('complex numbers', () => {
        test.each([
            ['0j', false],      // Pure imaginary zero
            ['0+0j', false],    // Complex zero
            ['1j', true],       // Pure imaginary one
            ['1+0j', true],     // Real part only
            ['0+1j', true],     // Imaginary part only
            ['1+1j', true],     // Both parts
            ['-1+1j', true],    // Negative real part
            ['1-1j', true],     // Negative imaginary part
            ['-1-1j', true],    // Both negative
            ['j', true],        // Just j
            ['+j', true],       // Positive j
            ['-j', true],       // Negative j
        ])('converts complex number string %s to %p', (value, expected) => {
            expect(validateBoolean(value)).toBe(expected);
        });
    });

    // Test error cases
    describe('error handling', () => {
        test('throws TypeError for null', () => {
            expect(() => validateBoolean(null))
                .toThrow('Cannot convert None to boolean');
        });

        test('throws TypeError for undefined', () => {
            expect(() => validateBoolean(undefined))
                .toThrow('Cannot convert None to boolean');
        });

        test('throws Error for empty string', () => {
            expect(() => validateBoolean('')).toThrow('Cannot convert empty string to boolean');
            expect(() => validateBoolean('   ')).toThrow('Cannot convert empty string to boolean');
        });

        test('throws Error for invalid strings', () => {
            const error = `Cannot convert 'invalid' to boolean. Valid true values are: ${Array.from(TRUE_VALUES).sort().join(', ')}, valid false values are: ${Array.from(FALSE_VALUES).sort().join(', ')}`;
            expect(() => validateBoolean('invalid')).toThrow(error);
        });

        test('throws TypeError for arrays', () => {
            expect(() => validateBoolean([1, 2, 3])).toThrow('Cannot convert array to boolean');
        });

        test('throws TypeError for functions', () => {
            expect(() => validateBoolean(() => {})).toThrow('Cannot convert function to boolean');
        });
    });

    // Test variations
    test.each([
        // Number-like strings
        ['1.0', true],
        ['-1', true],
        ['0.0', false],
        // Various casings
        ['TRUE', true],
        ['False', false],
        ['YeS', true],
        ['nO', false],
        // Whitespace handling
        ['  true  ', true],
        ['  false  ', false],
        // Alternative representations
        ['enable', true],
        ['disable', false],
        ['activated', true],
        ['deactivated', false]
    ])('converts variation %s to %p', (value, expected) => {
        expect(validateBoolean(value)).toBe(expected);
    });

    // Test object conversion
    describe('object conversion', () => {
        class TrueObject {
            toString() {
                return 'true';
            }
        }

        class FalseObject {
            toString() {
                return 'false';
            }
        }

        test('converts objects with toString method', () => {
            expect(validateBoolean(new TrueObject())).toBe(true);
            expect(validateBoolean(new FalseObject())).toBe(false);
        });

        class BadObject {
            toString() {
                throw new Error('Cannot convert to string');
            }
        }

        test('throws TypeError for objects that cannot be converted', () => {
            expect(() => validateBoolean(new BadObject())).toThrow(CustomTypeError);
        });
    });

    // Test unsupported types
    describe('unsupported types', () => {
        test.each([
            [Symbol('test'), 'symbol'],
            [() => {}, 'function'],
            [[1, 2, 3], 'array']
        ])('throws TypeError for unsupported type %s', (value, type) => {
            if (type === 'array') {
                expect(() => validateBoolean(value)).toThrow('Cannot convert array to boolean');
            } else {
                expect(() => validateBoolean(value)).toThrow(`Cannot convert ${type} to boolean`);
            }
        });
    });

    // Additional edge cases
    describe('edge cases', () => {
        test('handles various number formats', () => {
            expect(validateBoolean('1e5')).toBe(true);
            expect(validateBoolean('-1.23e-4')).toBe(true);
            expect(validateBoolean('0e0')).toBe(false);
        });

        test('handles various string formats', () => {
            expect(validateBoolean('YES!')).toBe(true); // Strips non-alphanumeric
            expect(validateBoolean('no...')).toBe(false);
            expect(validateBoolean('TRUE✓')).toBe(true);
        });

        test('handles special number values', () => {
            expect(validateBoolean(Number.POSITIVE_INFINITY)).toBe(true);
            expect(validateBoolean(Number.NEGATIVE_INFINITY)).toBe(true);
            expect(validateBoolean(Number.MIN_VALUE)).toBe(true);
            expect(validateBoolean(0)).toBe(false);
        });
    });
});
