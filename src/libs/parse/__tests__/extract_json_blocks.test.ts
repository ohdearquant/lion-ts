import { extractJsonBlock, extractJsonBlocks } from '../extract_json_blocks';
import { ParseError } from '../types';

describe('extractJsonBlocks', () => {
    describe('basic functionality', () => {
        test('extracts single JSON block', () => {
            const input = '```json\n{"key": "value"}\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([{ key: 'value' }]);
        });

        test('extracts multiple JSON blocks', () => {
            const input = '```json\n{"a": 1}\n```\n```json\n{"b": 2}\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([{ a: 1 }, { b: 2 }]);
        });

        test('handles nested JSON structures', () => {
            const input = '```json\n{"outer": {"inner": "value"}}\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([{ outer: { inner: 'value' } }]);
        });

        test('handles arrays in JSON', () => {
            const input = '```json\n{"array": [1, 2, 3]}\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([{ array: [1, 2, 3] }]);
        });
    });

    describe('options handling', () => {
        test('respects dropna option', () => {
            const input = '```json\n{"valid": true}\n```\n```json\nnull\n```';
            const result = extractJsonBlocks(input, { dropna: true });
            expect(result).toEqual([{ valid: true }]);
        });

        test('respects suppress option', () => {
            const input = '```json\ninvalid json\n```';
            const suppressed = extractJsonBlocks(input, { suppress: true });
            expect(suppressed).toEqual([{}]);
        });
    });

    describe('error handling', () => {
        test('handles empty input', () => {
            const input = '';
            expect(() => extractJsonBlocks(input, { suppress: false })).toThrow(ParseError);
        });

        test('handles input without JSON blocks', () => {
            const input = 'No JSON blocks here';
            expect(() => extractJsonBlocks(input, { suppress: false })).toThrow(ParseError);
        });

        test('handles malformed JSON with suppress', () => {
            const input = '```json\n{"unclosed": "object"\n```';
            const result = extractJsonBlocks(input, { suppress: true });
            expect(result).toEqual([{}]);
        });

        test('handles invalid JSON syntax with fuzzyParse', () => {
            const input = '```json\n{key: "value"}\n```';
            const result = extractJsonBlocks(input, { fuzzyParse: true });
            expect(result).toEqual([{ key: 'value' }]);
        });
    });
});

describe('extractJsonBlock', () => {
    describe('basic functionality', () => {
        test('extracts single JSON block', () => {
            const input = '```json\n{"key": "value"}\n```';
            const result = extractJsonBlock(input);
            expect(result).toEqual({ key: 'value' });
        });

        test('handles custom language', () => {
            const input = '```javascript\n{"key": "value"}\n```';
            const result = extractJsonBlock(input, { language: 'javascript' });
            expect(result).toEqual({ key: 'value' });
        });

        test('handles custom regex pattern', () => {
            const input = '<json>{"key": "value"}</json>';
            const result = extractJsonBlock(input, { regexPattern: '<json>(.*?)</json>' });
            expect(result).toEqual({ key: 'value' });
        });

        test('handles custom parser', () => {
            const input = '```json\n{"key": "value"}\n```';
            const parser = (str: string) => ({ parsed: str });
            const result = extractJsonBlock(input, { parser });
            expect(result).toEqual({ parsed: '{"key": "value"}' });
        });
    });

    describe('error handling', () => {
        test('handles parser errors with suppress', () => {
            const input = '```json\ninvalid json\n```';
            const result = extractJsonBlock(input, { suppress: true });
            expect(result).toBeUndefined();
        });

        test('throws parser errors when suppress is false', () => {
            const input = '```json\ninvalid json\n```';
            expect(() => extractJsonBlock(input, { suppress: false })).toThrow();
        });
    });

    describe('edge cases', () => {
        test('handles blocks with special characters in language', () => {
            const input = '```json+yaml\n{"key": "value"}\n```';
            const result = extractJsonBlock(input, { language: 'json\\+yaml' });
            expect(result).toEqual({ key: 'value' });
        });

        test('handles blocks with regex special characters', () => {
            const input = '```json\n{"$key": "value"}\n```';
            const result = extractJsonBlock(input);
            expect(result).toEqual({ $key: 'value' });
        });
    });
});
