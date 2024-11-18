import { extractDocstring } from '../extract_docstring';
import { ParseError } from '../types';

describe('extractDocstring', () => {
    describe('Google style docstrings', () => {
        test('extracts basic function description', () => {
            function testFunc() {
                /** This is a test function */
            }
            const result = extractDocstring(testFunc);
            expect(result.description).toBe('This is a test function');
        });

        test('extracts parameters', () => {
            function testFunc() {
                /**
                 * Test function
                 * Args:
                 *     param1: First parameter
                 *     param2: Second parameter with
                 *            multiple lines
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.params).toEqual({
                'param1': 'First parameter',
                'param2': 'Second parameter with multiple lines'
            });
        });

        test('extracts return value', () => {
            function testFunc() {
                /**
                 * Test function
                 * Returns:
                 *     The result value
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.returns).toBe('The result value');
        });

        test('extracts raises section', () => {
            function testFunc() {
                /**
                 * Test function
                 * Raises:
                 *     ValueError: When value is invalid
                 *     TypeError: When type is wrong
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.raises).toEqual({
                'ValueError': 'When value is invalid',
                'TypeError': 'When type is wrong'
            });
        });

        test('extracts examples', () => {
            function testFunc() {
                /**
                 * Test function
                 * Example:
                 *     const x = testFunc()
                 *     console.log(x)
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.examples).toEqual([
                'const x = testFunc()',
                'console.log(x)'
            ]);
        });

        test('extracts notes', () => {
            function testFunc() {
                /**
                 * Test function
                 * Note:
                 *     This is an important note
                 *     with multiple lines
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.notes).toEqual([
                'This is an important note',
                'with multiple lines'
            ]);
        });

        test('extracts references', () => {
            function testFunc() {
                /**
                 * Test function
                 * References:
                 *     - Reference 1
                 *     - Reference 2
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.references).toEqual([
                '- Reference 1',
                '- Reference 2'
            ]);
        });
    });

    describe('reST style docstrings', () => {
        test('extracts basic function description', () => {
            function testFunc() {
                /** This is a test function */
            }
            const result = extractDocstring(testFunc, 'rest');
            expect(result.description).toBe('This is a test function');
        });

        test('extracts parameters', () => {
            function testFunc() {
                /**
                 * Test function
                 * :param param1: First parameter
                 * :param param2: Second parameter
                 *                with multiple lines
                 */
            }
            const result = extractDocstring(testFunc, 'rest');
            expect(result.params).toEqual({
                'param1': 'First parameter',
                'param2': 'Second parameter with multiple lines'
            });
        });

        test('extracts return value', () => {
            function testFunc() {
                /**
                 * Test function
                 * :returns: The result value
                 */
            }
            const result = extractDocstring(testFunc, 'rest');
            expect(result.returns).toBe('The result value');
        });

        test('extracts raises section', () => {
            function testFunc() {
                /**
                 * Test function
                 * :raises ValueError: When value is invalid
                 * :raises TypeError: When type is wrong
                 */
            }
            const result = extractDocstring(testFunc, 'rest');
            expect(result.raises).toEqual({
                'ValueError': 'When value is invalid',
                'TypeError': 'When type is wrong'
            });
        });

        test('extracts examples', () => {
            function testFunc() {
                /**
                 * Test function
                 * :example:
                 *     const x = testFunc()
                 *     console.log(x)
                 */
            }
            const result = extractDocstring(testFunc, 'rest');
            expect(result.examples).toEqual([
                'const x = testFunc()',
                'console.log(x)'
            ]);
        });
    });

    describe('different comment styles', () => {
        test('handles single-line comments', () => {
            function testFunc() {
                // This is a single-line comment
            }
            const result = extractDocstring(testFunc);
            expect(result.description).toBe('This is a single-line comment');
        });

        test('handles multi-line comments', () => {
            function testFunc() {
                /* This is a
                   multi-line comment */
            }
            const result = extractDocstring(testFunc);
            expect(result.description).toBe('This is a multi-line comment');
        });

        test('handles JSDoc comments', () => {
            function testFunc() {
                /** @description This is a JSDoc comment */
            }
            const result = extractDocstring(testFunc);
            expect(result.description).toBe('@description This is a JSDoc comment');
        });
    });

    describe('edge cases', () => {
        test('handles function without docstring', () => {
            function testFunc() {}
            const result = extractDocstring(testFunc);
            expect(result).toEqual({
                description: undefined,
                params: {},
                returns: undefined,
                raises: {},
                examples: [],
                notes: [],
                references: []
            });
        });

        test('handles empty docstring', () => {
            function testFunc() {
                /**  */
            }
            const result = extractDocstring(testFunc);
            expect(result.description).toBeUndefined();
        });

        test('handles docstring with only whitespace', () => {
            function testFunc() {
                /**
                 *
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.description).toBeUndefined();
        });

        test('handles malformed parameter sections', () => {
            function testFunc() {
                /**
                 * Test
                 * Args:
                 *     invalid parameter format
                 */
            }
            const result = extractDocstring(testFunc);
            expect(result.params).toEqual({});
        });
    });

    describe('error handling', () => {
        test('throws ParseError for unsupported style', () => {
            function testFunc() {
                /** Test */
            }
            expect(() => extractDocstring(testFunc, 'invalid' as any))
                .toThrow(ParseError);
        });

        test('handles non-function input gracefully', () => {
            const result = extractDocstring({} as Function);
            expect(result).toEqual({
                description: undefined,
                params: {},
                returns: undefined,
                raises: {},
                examples: [],
                notes: [],
                references: []
            });
        });
    });
});
