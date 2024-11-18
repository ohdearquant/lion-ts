import { extractJsonBlocks, extractJsonBlock } from '../extract_json_blocks';
import { ParseError } from '../types';

describe('extractJsonBlocks', () => {
    describe('basic functionality', () => {
        test('extracts single JSON block', () => {
            const input = '```json\n{"key": "value"}\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([{ key: 'value' }]);
        });

        test('extracts multiple JSON blocks', () => {
            const input = [
                '```json\n{"key1": "value1"}\n```',
                'Some text in between',
                '```json\n{"key2": "value2"}\n```'
            ].join('\n');
            const result = extractJsonBlocks(input);
            expect(result).toEqual([
                { key1: 'value1' },
                { key2: 'value2' }
            ]);
        });

        test('handles nested JSON structures', () => {
            const input = '```json\n{"outer": {"inner": "value"}}\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([{ outer: { inner: 'value' } }]);
        });

        test('handles JSON arrays', () => {
            const input = '```json\n[{"item": 1}, {"item": 2}]\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([[{ item: 1 }, { item: 2 }]]);
        });
    });

    describe('options handling', () => {
        test('handles fuzzyParse option', () => {
            const input = '```json\n{key: "value"}\n```'; // Missing quotes around key
            const result = extractJsonBlocks(input, { fuzzyParse: true });
            expect(result).toEqual([{ key: 'value' }]);
        });

        test('respects dropna option', () => {
            const input = [
                '```json\n{"valid": "json"}\n```',
                '```json\ninvalid json\n```'
            ].join('\n');
            
            const withDropna = extractJsonBlocks(input, { dropna: true });
            expect(withDropna).toEqual([{ valid: 'json' }]);

            const withoutDropna = extractJsonBlocks(input, { dropna: false });
            expect(withoutDropna).toHaveLength(2);
            expect(withoutDropna[0]).toEqual({ valid: 'json' });
            expect(withoutDropna[1]).toBeUndefined();
        });

        test('respects suppress option', () => {
            const input = '```json\ninvalid json\n```';
            
            expect(() => extractJsonBlocks(input, { suppress: false }))
                .toThrow(ParseError);

            const suppressed = extractJsonBlocks(input, { suppress: true });
            expect(suppressed).toEqual([]);
        });
    });

    describe('error handling', () => {
        test('handles empty input', () => {
            expect(extractJsonBlocks('')).toEqual([]);
        });

        test('handles input without JSON blocks', () => {
            const input = 'Just some regular text';
            expect(extractJsonBlocks(input)).toEqual([]);
        });

        test('handles malformed JSON with suppress', () => {
            const input = '```json\n{"unclosed": "object"\n```';
            const result = extractJsonBlocks(input);
            expect(result).toEqual([]);
        });

        test('handles invalid JSON syntax with fuzzyParse', () => {
            const input = '```json\n{\'key\': \'value\'}\n```'; // Single quotes
            const result = extractJsonBlocks(input, { fuzzyParse: true });
            expect(result).toEqual([{ key: 'value' }]);
        });
    });
});

describe('extractJsonBlock', () => {
    describe('basic functionality', () => {
        test('extracts JSON block with default options', () => {
            const input = '```json\n{"key": "value"}\n```';
            const result = extractJsonBlock(input);
            expect(result).toEqual({ key: 'value' });
        });

        test('handles custom language', () => {
            const input = '```yaml\nkey: value\n```';
            const result = extractJsonBlock(input, { fuzzyParse: true });
            expect(result).toEqual({ key: 'value' });
        });

        test('handles empty code block', () => {
            const input = '```json\n\n```';
            const result = extractJsonBlock(input, { suppress: true });
            expect(result).toEqual({});
        });

        test('handles whitespace in code block', () => {
            const input = '```json\n  \n  \n```';
            const result = extractJsonBlock(input, { suppress: true });
            expect(result).toEqual({});
        });
    });

    describe('error handling', () => {
        test('handles missing code block', () => {
            const input = 'No code block here';
            const result = extractJsonBlock(input, { suppress: true });
            expect(result).toBeUndefined();
        });

        test('throws error for missing block when suppress is false', () => {
            const input = 'No code block here';
            expect(() => extractJsonBlock(input, { suppress: false }))
                .toThrow(ParseError);
        });

        test('handles parser errors with suppress', () => {
            const input = '```json\ninvalid json\n```';
            const result = extractJsonBlock(input, { suppress: true });
            expect(result).toBeUndefined();
        });

        test('throws parser errors when suppress is false', () => {
            const input = '```json\ninvalid json\n```';
            expect(() => extractJsonBlock(input, { suppress: false }))
                .toThrow(ParseError);
        });
    });

    describe('edge cases', () => {
        test('handles blocks with only opening fence', () => {
            const input = '```json\n{"key": "value"}';
            const result = extractJsonBlock(input, { suppress: true });
            expect(result).toBeUndefined();
        });

        test('handles blocks with only closing fence', () => {
            const input = '{"key": "value"}\n```';
            const result = extractJsonBlock(input, { suppress: true });
            expect(result).toBeUndefined();
        });

        test('handles blocks with special characters in language', () => {
            const input = '```c++\n{"key": "value"}\n```';
            const result = extractJsonBlock(input, { fuzzyParse: true });
            expect(result).toEqual({ key: 'value' });
        });
    });
});
