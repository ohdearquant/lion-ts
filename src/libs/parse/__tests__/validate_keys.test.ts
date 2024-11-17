import { validateKeys } from '../validate_keys';
import { ValueError, TypeError } from '../../errors';
import { SIMILARITY_ALGO_MAP } from '../../string_similarity';
import type { SimilarityFunction } from '../../string_similarity';

describe('validateKeys', () => {
    // Test basic functionality
    test('basic functionality with default parameters', () => {
        const testDict = {
            'user_name': 'John',
            'email_addr': 'john@example.com'
        };
        const expected = ['username', 'email_address'];

        const result = validateKeys(testDict, expected);
        // With default settings, original keys should be preserved
        expect(result).toHaveProperty('user_name');
        expect(result).toHaveProperty('email_addr');
    });

    // Test exact matches
    test('exact key matches', () => {
        const exactDict = {
            'username': 'John',
            'email_address': 'john@example.com'
        };
        const expected = ['username', 'email_address'];
        const result = validateKeys(exactDict, expected);
        expect(result).toEqual(exactDict);
    });

    // Test empty inputs
    describe('empty inputs', () => {
        test('empty dictionary', () => {
            expect(validateKeys({}, [])).toEqual({});
        });

        test('empty expected keys', () => {
            const result = validateKeys({ 'a': 1 }, []);
            expect(result).toEqual({ 'a': 1 });
        });
    });

    // Test fuzzy matching
    describe('fuzzy matching', () => {
        test('fuzzy matching with different thresholds', () => {
            const testDict = {
                'user_name': 'John',
                'emailAddress': 'john@example.com'
            };
            const expected = ['username', 'email_address'];

            // Test with fuzzy matching enabled and remove unmatched
            const result = validateKeys(
                testDict,
                expected,
                'jaro_winkler',
                0.7,
                true,
                'remove'
            );
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('email_address');
            expect(result).not.toHaveProperty('user_name');
            expect(result).not.toHaveProperty('emailAddress');

            // Test with fuzzy matching disabled
            const resultNoFuzzy = validateKeys(testDict, expected, 'jaro_winkler', 0.7, false);
            expect(resultNoFuzzy).toHaveProperty('user_name');
            expect(resultNoFuzzy).toHaveProperty('emailAddress');
        });

        test('custom similarity function', () => {
            const customSimilarity: SimilarityFunction = (s1: string, s2: string): number => {
                return s1.toLowerCase() === s2.toLowerCase() ? 1.0 : 0.0;
            };

            const testDict = { 'User_Name': 'John' };
            const expected = ['username'];

            const result = validateKeys(
                testDict,
                expected,
                customSimilarity,
                0.85,
                true
            );
            expect(Object.keys(result).length).toBeGreaterThan(0);
        });
    });

    // Test handle_unmatched modes
    describe('handle_unmatched modes', () => {
        const testDict = { 'user_name': 'John', 'extra': 'value' };
        const expected = ['username'];

        test('raise mode', () => {
            expect(() => validateKeys(testDict, expected, 'jaro_winkler', 0.85, true, 'raise'))
                .toThrow(ValueError);
        });

        test('remove mode', () => {
            const resultRemove = validateKeys(testDict, expected, 'jaro_winkler', 0.85, true, 'remove');
            expect(resultRemove).not.toHaveProperty('extra');
        });

        test('fill mode', () => {
            const resultFill = validateKeys(
                testDict,
                expected,
                'jaro_winkler',
                0.85,
                true,
                'fill',
                'default'
            );
            expect(resultFill).toHaveProperty('extra');
            expect(resultFill).toHaveProperty('username');
        });

        test('force mode', () => {
            const resultForce = validateKeys(
                testDict,
                expected,
                'jaro_winkler',
                0.85,
                true,
                'force',
                'default'
            );
            expect(resultForce).not.toHaveProperty('extra');
            expect(resultForce).toHaveProperty('username');
        });
    });

    // Test strict mode
    describe('strict mode', () => {
        test('strict mode behavior', () => {
            const testDict = { 'partial': 'value' };
            const expected = ['partial', 'missing'];

            expect(() => validateKeys(testDict, expected, 'jaro_winkler', 0.85, true, 'ignore', null, null, true))
                .toThrow(ValueError);

            const result = validateKeys(testDict, expected, 'jaro_winkler', 0.85, true, 'ignore', null, null, false);
            expect(result).toHaveProperty('partial');
        });
    });

    // Test edge cases and invalid inputs
    describe('edge cases and invalid inputs', () => {
        const validDict = { 'key': 'value' };
        const validKeys = ['key'];

        test('invalid similarity threshold', () => {
            expect(() => validateKeys(validDict, validKeys, 'jaro_winkler', 1.5))
                .toThrow(ValueError);
        });

        test('null input dictionary', () => {
            expect(() => validateKeys(null as any, validKeys))
                .toThrow(TypeError);
        });

        test('null keys', () => {
            expect(() => validateKeys(validDict, null as any))
                .toThrow(TypeError);
        });

        test('invalid similarity algorithm', () => {
            expect(() => validateKeys(validDict, validKeys, 'invalid' as any))
                .toThrow(ValueError);
        });
    });

    // Test fill value and mapping
    test('fill value and mapping functionality', () => {
        const testDict = { 'existing': 'value' };
        const expected = ['existing', 'missing1', 'missing2'];
        const fillMapping = {
            'missing1': 'custom1',
            'missing2': 'custom2'
        };

        const result = validateKeys(
            testDict,
            expected,
            'jaro_winkler',
            0.85,
            true,
            'fill',
            null,
            fillMapping
        );
        expect(result.missing1).toBe('custom1');
        expect(result.missing2).toBe('custom2');
    });

    // Additional edge cases
    describe('additional edge cases', () => {
        test('handles case sensitivity', () => {
            const testDict = { 'USERNAME': 'John', 'Email_Address': 'john@example.com' };
            const expected = ['username', 'email_address'];
            const result = validateKeys(testDict, expected, 'jaro_winkler', 0.7, true);
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('email_address');
        });

        test('handles special characters', () => {
            const testDict = { 'user-name': 'John', 'email@address': 'john@example.com' };
            const expected = ['username', 'email_address'];
            const result = validateKeys(testDict, expected, 'jaro_winkler', 0.7, true);
            expect(result).toHaveProperty('username');
            expect(result).toHaveProperty('email_address');
        });

        test('handles numeric keys', () => {
            const testDict = { 'user1': 'John', '2email': 'john@example.com' };
            const expected = ['user_1', 'email_2'];
            const result = validateKeys(testDict, expected, 'jaro_winkler', 0.7, true);
            expect(Object.keys(result).length).toBeGreaterThan(0);
        });
    });
});
