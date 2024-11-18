import { validateMapping } from '../validate_mapping';
import { ValueError, TypeError } from '../../errors';

describe('validateMapping', () => {
    // Test basic dictionary input
    test('basic dictionary input', () => {
        const testDict = { name: 'John', age: 30 };
        const result = validateMapping(testDict, { name: 'string', age: 'number' });
        expect(result).toEqual(testDict);
    });

    // Test string inputs
    describe('string inputs', () => {
        test('JSON string', () => {
            const jsonInput = '{"name": "John", "age": 30}';
            const result = validateMapping(jsonInput, { name: 'string', age: 'number' });
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('JSON with single quotes', () => {
            const singleQuote = "{'name': 'John', 'age': 30}";
            const result = validateMapping(singleQuote, { name: 'string', age: 'number' });
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('JSON in code block', () => {
            const codeBlock = '```json\n{"name": "John", "age": 30}\n```';
            const result = validateMapping(codeBlock, { name: 'string', age: 'number' });
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
        const result = validateMapping(user, { name: 'string', age: 'number' });
        expect(result).toEqual({ name: 'John', age: 30 });
    });

    // Test handle_unmatched modes
    describe('handle_unmatched modes', () => {
        const inputDict = { name: 'John', extra: 'value' };
        const expectedKeys = { name: 'string', age: 'number' };

        test('ignore mode', () => {
            const result = validateMapping(inputDict, expectedKeys, {
                handleUnmatched: 'ignore'
            });
            expect(result).toEqual({ name: 'John', extra: 'value' });
        });

        test('remove mode', () => {
            const result = validateMapping(inputDict, expectedKeys, {
                handleUnmatched: 'remove'
            });
            expect(result).toEqual({ name: 'John' });
        });

        test('fill mode', () => {
            const result = validateMapping(inputDict, expectedKeys, {
                handleUnmatched: 'fill',
                fillValue: null
            });
            expect(result).toEqual({ name: 'John', age: null, extra: 'value' });
        });

        test('force mode', () => {
            const result = validateMapping(inputDict, expectedKeys, {
                handleUnmatched: 'force',
                fillValue: null
            });
            expect(result).toEqual({ name: 'John', age: null });
        });

        test('raise mode throws error for unmatched keys', () => {
            expect(() => validateMapping(inputDict, expectedKeys, {
                handleUnmatched: 'raise'
            })).toThrow(ValueError);
        });

        test('raise mode throws error for missing keys', () => {
            expect(() => validateMapping({ name: 'John' }, { name: 'string', required: 'string' }, {
                handleUnmatched: 'raise'
            })).toThrow(ValueError);
        });
    });

    // Test fill values
    test('fill value functionality', () => {
        const inputDict = { name: 'John' };
        const fillMapping = { age: 30, email: 'test@example.com' };

        const result = validateMapping(inputDict, { name: 'string', age: 'number', email: 'string' }, {
            handleUnmatched: 'fill',
            fillMapping
        });
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
            const result = validateMapping({ user_name: 'John' }, { username: 'string' }, {
                similarityThreshold: threshold,
                fuzzyMatch: true
            });
            if (shouldMatch) {
                expect(result).toEqual({ username: 'John' });
            } else {
                expect(result).toEqual({ user_name: 'John' });
            }
        });
    });

    // Test error cases
    describe('error handling', () => {
        test('null input throws TypeError', () => {
            expect(() => validateMapping(null, { key: 'string' }))
                .toThrow(TypeError);
        });

        test('undefined input throws TypeError', () => {
            expect(() => validateMapping(undefined, { key: 'string' }))
                .toThrow(TypeError);
        });

        test('empty input with strict mode throws ValueError', () => {
            expect(() => validateMapping({}, { required_key: 'string' }, {
                strict: true
            })).toThrow(ValueError);
        });

        test('empty input with fill mode returns filled object', () => {
            const result = validateMapping({}, { key: 'string' }, {
                handleUnmatched: 'fill',
                fillValue: 'default'
            });
            expect(result).toEqual({ key: 'default' });
        });
    });

    // Test strict mode
    describe('strict mode', () => {
        test('throws error on missing required fields', () => {
            expect(() => validateMapping({ name: 'John' }, { name: 'string', required_field: 'string' }, {
                strict: true
            })).toThrow(ValueError);
        });

        test('throws error on extra fields', () => {
            expect(() => validateMapping({ name: 'John', extra: 'value' }, { name: 'string' }, {
                strict: true
            })).toThrow(ValueError);
        });
    });

    // Test custom similarity function
    test('custom similarity function', () => {
        const customSimilarity = (s1: string, s2: string): number => {
            return s1.toLowerCase() === s2.toLowerCase() ? 1.0 : 0.0;
        };

        const result = validateMapping({ USER_NAME: 'John' }, { username: 'string' }, {
            similarityThreshold: 0.85,
            fuzzyMatch: true,
            similarityFunction: customSimilarity
        });
        expect(result).toEqual({ USER_NAME: 'John' });
    });

    // Test suppress conversion errors
    test('suppress conversion errors', () => {
        const result = validateMapping(new Date(), { key: 'string' }, {
            suppress: true,
            handleUnmatched: 'fill',
            fillValue: null
        });
        expect(result).toEqual({ key: null });
    });

    // Additional edge cases
    describe('edge cases', () => {
        test('handles nested objects', () => {
            const input = {
                user: { name: 'John', age: 30 },
                settings: { theme: 'dark' }
            };
            const result = validateMapping(input, {
                user: 'object',
                settings: 'object'
            });
            expect(result).toEqual(input);
        });

        test('handles arrays', () => {
            const input = {
                names: ['John', 'Jane'],
                ages: [30, 25]
            };
            const result = validateMapping(input, {
                names: 'array',
                ages: 'array'
            });
            expect(result).toEqual(input);
        });

        test('handles empty strings', () => {
            const input = { name: '', age: '' };
            const result = validateMapping(input, {
                name: 'string',
                age: 'string'
            });
            expect(result).toEqual(input);
        });

        test('handles special characters in keys', () => {
            const input = { 'user@name': 'John', 'age#value': 30 };
            const result = validateMapping(input, {
                username: 'string',
                age_value: 'number'
            }, {
                fuzzyMatch: true,
                similarityThreshold: 0.6
            });
            expect(result).toEqual({ username: 'John', age_value: 30 });
        });
    });
});
