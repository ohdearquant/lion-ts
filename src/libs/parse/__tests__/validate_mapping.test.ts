import { validateMapping } from '../validate_mapping';
import { ValueError, TypeError } from '../../errors';

describe('validateMapping', () => {
    // Test basic dictionary input
    test('basic dictionary input', () => {
        const testDict = { name: 'John', age: 30 };
        const result = validateMapping(testDict, ['name', 'age']);
        expect(result).toEqual(testDict);
    });

    // Test string inputs
    describe('string inputs', () => {
        test('JSON string', () => {
            const jsonInput = '{"name": "John", "age": 30}';
            const result = validateMapping(jsonInput, ['name', 'age']);
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('JSON with single quotes', () => {
            const singleQuote = "{'name': 'John', 'age': 30}";
            const result = validateMapping(singleQuote, ['name', 'age']);
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('JSON in code block', () => {
            const codeBlock = '```json\n{"name": "John", "age": 30}\n```';
            const result = validateMapping(codeBlock, ['name', 'age']);
            expect(result).toEqual({ name: 'John', age: 30 });
        });
    });

    // Test type conversion
    test('type conversion from object with toDict', () => {
        class UserModel {
            constructor(public name: string, public age: number) {}
            toDict() {
                return { name: this.name, age: this.age };
            }
        }
        const user = new UserModel('John', 30);
        const result = validateMapping(user, ['name', 'age']);
        expect(result).toEqual({ name: 'John', age: 30 });
    });

    // Test handle_unmatched modes
    describe('handle_unmatched modes', () => {
        const inputDict = { name: 'John', extra: 'value' };
        const expectedKeys = ['name', 'age'];

        test.each([
            ['ignore', ['name', 'extra']],
            ['remove', ['name']],
            ['fill', ['name', 'age', 'extra']],
            ['force', ['name', 'age']]
        ])('%s mode', (mode, expectedKeys) => {
            const result = validateMapping(
                inputDict,
                expectedKeys,
                'jaro_winkler',
                0.85,
                true,
                mode as 'ignore' | 'raise' | 'remove' | 'fill' | 'force',
                null
            );
            expect(Object.keys(result).sort()).toEqual(expectedKeys.sort());
        });

        test('raise mode throws error', () => {
            expect(() => validateMapping(
                inputDict,
                ['name'],
                'jaro_winkler',
                0.85,
                true,
                'raise'
            )).toThrow(ValueError);
        });
    });

    // Test fill values
    test('fill value functionality', () => {
        const inputDict = { name: 'John' };
        const fillMapping = { age: 30, email: 'test@example.com' };

        const result = validateMapping(
            inputDict,
            ['name', 'age', 'email'],
            'jaro_winkler',
            0.85,
            true,
            'fill',
            null,
            fillMapping
        );
        expect(result).toEqual({
            name: 'John',
            age: 30,
            email: 'test@example.com'
        });
    });

    // Test similarity thresholds
    describe('similarity thresholds', () => {
        test.each([
            [0.95, false], // High threshold - won't match
            [0.6, true]    // Low threshold - will match
        ])('threshold %s matches: %s', (threshold, shouldMatch) => {
            const result = validateMapping(
                { user_name: 'John' },
                ['username'],
                'jaro_winkler',
                threshold,
                true,
                'remove'
            );
            if (shouldMatch) {
                expect(result).toHaveProperty('username');
            } else {
                expect(result).not.toHaveProperty('username');
            }
        });
    });

    // Test error cases
    describe('error handling', () => {
        test('null input throws TypeError', () => {
            expect(() => validateMapping(null, ['key']))
                .toThrow(TypeError);
        });

        test('empty input with strict mode throws ValueError', () => {
            expect(() => validateMapping({}, ['required_key'], 'jaro_winkler', 0.85, true, 'ignore', null, null, true))
                .toThrow(ValueError);
        });
    });

    // Test strict mode
    test('strict mode validation', () => {
        expect(() => validateMapping(
            { name: 'John' },
            ['name', 'required_field'],
            'jaro_winkler',
            0.85,
            true,
            'ignore',
            null,
            null,
            true
        )).toThrow(ValueError);
    });

    // Test custom similarity function
    test('custom similarity function', () => {
        const caseInsensitiveMatch = (s1: string, s2: string): number => {
            return s1.toLowerCase() === s2.toLowerCase() ? 1.0 : 0.0;
        };

        const result = validateMapping(
            { USER_NAME: 'John' },
            ['username'],
            caseInsensitiveMatch,
            0.85,
            true,
            'remove'
        );
        expect(result).not.toHaveProperty('username');
    });

    // Test suppress conversion errors
    test('suppress conversion errors', () => {
        const result = validateMapping(
            new Date(), // Object that can't be directly converted
            ['key'],
            'jaro_winkler',
            0.85,
            true,
            'fill',
            null,
            null,
            false,
            true
        );
        expect(result).toEqual({ key: null });
    });

    // Additional edge cases
    describe('edge cases', () => {
        test('handles nested objects', () => {
            const input = {
                user: { name: 'John', age: 30 },
                settings: { theme: 'dark' }
            };
            const result = validateMapping(input, ['user', 'settings']);
            expect(result).toEqual(input);
        });

        test('handles arrays', () => {
            const input = {
                names: ['John', 'Jane'],
                ages: [30, 25]
            };
            const result = validateMapping(input, ['names', 'ages']);
            expect(result).toEqual(input);
        });

        test('handles empty strings', () => {
            const input = { name: '', age: '' };
            const result = validateMapping(input, ['name', 'age']);
            expect(result).toEqual(input);
        });

        test('handles special characters in keys', () => {
            const input = { 'user@name': 'John', 'age#value': 30 };
            const result = validateMapping(input, ['user_name', 'age_value']);
            expect(Object.keys(result).length).toBeGreaterThan(0);
        });
    });
});
