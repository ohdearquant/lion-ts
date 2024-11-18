import { asReadableJson, asReadable } from '../as_readable';
import { extractNumbers, splitLines, joinLines, dedent, indent, wrap, unwrap } from '../utils';
import { toDict } from '../to_dict';
import { toList } from '../to_list';
import { ValueError, ParseError } from '../types';
import { TypeError } from '../../errors';
import { UNDEFINED } from '../../../types/undefined';

describe('utils', () => {
    describe('extractNumbers', () => {
        test('extracts various number formats', () => {
            const text = 'int: 42, float: 3.14';
            const numbers = extractNumbers(text);
            expect(numbers).toContainEqual(['integer', '42']);
            expect(numbers).toContainEqual(['decimal', '3.14']);
        });

        test('extracts special number formats', () => {
            const text = 'percentage: 50%, fraction: 1/2';
            const numbers = extractNumbers(text);
            expect(numbers).toContainEqual(['percentage', '50%']);
            expect(numbers).toContainEqual(['fraction', '1/2']);
        });

        test('handles no numbers in text', () => {
            const text = 'no numbers here';
            const numbers = extractNumbers(text);
            expect(numbers).toHaveLength(0);
        });
    });

    describe('splitLines', () => {
        test('splits text into lines', () => {
            const text = 'let x = 1;\nprint(x)';
            const result = splitLines(text);
            expect(result).toEqual(['let x = 1;', 'print(x)']);
        });

        test('handles empty input', () => {
            expect(splitLines('')).toEqual([]);
            expect(splitLines(null as any)).toEqual([]);
        });
    });

    describe('joinLines', () => {
        test('joins lines with default separator', () => {
            const lines = ['let x = 1;', 'print(x)'];
            const result = joinLines(lines);
            expect(result).toBe('let x = 1;\nprint(x)');
        });

        test('joins lines with custom separator', () => {
            const lines = ['let x = 1;', 'print(x)'];
            const result = joinLines(lines, '\r\n');
            expect(result).toBe('let x = 1;\r\nprint(x)');
        });
    });

    describe('dedent', () => {
        test('removes common indentation', () => {
            const text = '    let x = 1;\n    print(x)';
            const result = dedent(text);
            expect(result).toBe('let x = 1;\nprint(x)');
        });

        test('handles mixed indentation', () => {
            const text = '    let x = 1;\n      print(x)';
            const result = dedent(text);
            expect(result).toBe('let x = 1;\n  print(x)');
        });

        test('handles empty lines', () => {
            const text = '    let x = 1;\n\n    print(x)';
            const result = dedent(text);
            expect(result).toBe('let x = 1;\n\nprint(x)');
        });
    });

    describe('indent', () => {
        test('adds indentation to lines', () => {
            const text = 'let x = 1;\nprint(x)';
            const result = indent(text, '  ');
            expect(result).toBe('  let x = 1;\n  print(x)');
        });

        test('uses default indentation', () => {
            const text = 'let x = 1;\nprint(x)';
            const result = indent(text);
            expect(result).toBe('    let x = 1;\n    print(x)');
        });

        test('handles empty input', () => {
            expect(indent('')).toBe('');
            expect(indent(null as any)).toBe('');
        });
    });

    describe('wrap', () => {
        test('wraps text at specified width', () => {
            const text = 'This is a long line of text';
            const result = wrap(text, 10);
            expect(result.split('\n').every(line => line.length <= 10)).toBe(true);
        });

        test('preserves words', () => {
            const text = 'This is a test';
            const result = wrap(text, 7);
            expect(result).toBe('This is\na test');
        });

        test('throws for invalid width', () => {
            expect(() => wrap('test', 0)).toThrow(ParseError);
            expect(() => wrap('test', -1)).toThrow(ParseError);
        });
    });

    describe('unwrap', () => {
        test('joins wrapped lines', () => {
            const text = 'This is\na test\nof unwrap';
            const result = unwrap(text);
            expect(result).toBe('This is a test of unwrap');
        });

        test('handles extra whitespace', () => {
            const text = '  This   is  \n  a   test  ';
            const result = unwrap(text);
            expect(result).toBe('This is a test');
        });

        test('handles empty input', () => {
            expect(unwrap('')).toBe('');
            expect(unwrap(null as any)).toBe('');
        });
    });
});
