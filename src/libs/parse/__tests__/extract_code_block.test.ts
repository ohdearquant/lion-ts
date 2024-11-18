import { extractCodeBlock } from '../extract_code_block';
import { ParseError } from '../types';

describe('extractCodeBlock', () => {
    describe('basic functionality', () => {
        test('extracts single code block', () => {
            const input = '```\nconst x = 1;\n```';
            const result = extractCodeBlock(input);
            expect(result).toBe('const x = 1;');
        });

        test('extracts multiple code blocks', () => {
            const input = '```\nblock1\n```\n\n```\nblock2\n```';
            const result = extractCodeBlock(input);
            expect(result).toBe('block1\n\nblock2');
        });

        test('handles tilde fences', () => {
            const input = '~~~\nconst x = 1;\n~~~';
            const result = extractCodeBlock(input);
            expect(result).toBe('const x = 1;');
        });

        test('preserves indentation in code blocks', () => {
            const input = '```\n  indented\n    more\n```';
            const result = extractCodeBlock(input);
            expect(result).toBe('  indented\n    more');
        });

        test('handles code blocks with language identifiers', () => {
            const input = '```typescript\nconst x: number = 1;\n```';
            const result = extractCodeBlock(input);
            expect(result).toBe('const x: number = 1;');
        });
    });

    describe('returnAsList option', () => {
        test('returns array of code blocks when returnAsList is true', () => {
            const input = '```\nblock1\n```\n```\nblock2\n```';
            const result = extractCodeBlock(input, { returnAsList: true });
            expect(result).toEqual(['block1', 'block2']);
        });

        test('returns empty array for no matches with returnAsList', () => {
            const input = 'no code blocks here';
            const result = extractCodeBlock(input, { returnAsList: true });
            expect(result).toEqual([]);
        });
    });

    describe('languages filtering', () => {
        test('filters blocks by language', () => {
            const input = [
                '```typescript\nts code\n```',
                '```python\npy code\n```',
                '```javascript\njs code\n```'
            ].join('\n');

            const result = extractCodeBlock(input, { 
                languages: ['typescript', 'javascript'],
                returnAsList: true
            });
            expect(result).toEqual(['ts code', 'js code']);
        });

        test('handles case-sensitive language matching', () => {
            const input = '```TypeScript\nts code\n```';
            const result = extractCodeBlock(input, { 
                languages: ['typescript'],
                returnAsList: true
            });
            expect(result).toEqual(['ts code']);
        });

        test('treats blocks without language as "plain"', () => {
            const input = '```\nplain code\n```';
            const result = extractCodeBlock(input, { 
                languages: ['plain'],
                returnAsList: true
            });
            expect(result).toEqual(['plain code']);
        });
    });

    describe('categorize option', () => {
        test('categorizes blocks by language', () => {
            const input = [
                '```typescript\nts code\n```',
                '```python\npy code\n```',
                '```typescript\nmore ts\n```'
            ].join('\n');

            const result = extractCodeBlock(input, { categorize: true });
            expect(result).toEqual({
                typescript: ['ts code', 'more ts'],
                python: ['py code']
            });
        });

        test('handles blocks without language identifier', () => {
            const input = '```\nplain code\n```';
            const result = extractCodeBlock(input, { categorize: true });
            expect(result).toEqual({
                plain: ['plain code']
            });
        });

        test('returns empty object when no blocks found', () => {
            const input = 'no code blocks';
            const result = extractCodeBlock(input, { categorize: true });
            expect(result).toEqual({});
        });
    });

    describe('error handling', () => {
        test('handles empty input', () => {
            expect(extractCodeBlock('')).toBe('');
            expect(extractCodeBlock('', { returnAsList: true })).toEqual([]);
            expect(extractCodeBlock('', { categorize: true })).toEqual({});
        });

        test('handles malformed code blocks with suppress', () => {
            const input = '```typescript\nunclosed block';
            const result = extractCodeBlock(input, { suppress: true });
            expect(result).toBe('');
        });

        test('throws ParseError for malformed blocks without suppress', () => {
            const input = '```typescript\nunclosed block';
            expect(() => extractCodeBlock(input, { suppress: false }))
                .toThrow(ParseError);
        });

        test('handles nested code blocks', () => {
            const input = '```\nouter\n```inner\nstill outer\n```\n```';
            const result = extractCodeBlock(input, { returnAsList: true });
            expect(result).toEqual(['outer\n```inner\nstill outer']);
        });
    });

    describe('edge cases', () => {
        test('handles blocks with only whitespace', () => {
            const input = '```\n   \n\t\n```';
            const result = extractCodeBlock(input);
            expect(result).toBe('');
        });

        test('handles blocks with special characters in language', () => {
            const input = '```c++\ncode\n```';
            const result = extractCodeBlock(input, { categorize: true });
            expect(result).toEqual({ 'c++': ['code'] });
        });

        test('preserves empty lines in code blocks', () => {
            const input = '```\nline1\n\nline2\n```';
            const result = extractCodeBlock(input);
            expect(result).toBe('line1\n\nline2');
        });

        test('handles multiple fence types in same input', () => {
            const input = '```\nblock1\n```\n~~~\nblock2\n~~~';
            const result = extractCodeBlock(input, { returnAsList: true });
            expect(result).toEqual(['block1', 'block2']);
        });
    });
});
