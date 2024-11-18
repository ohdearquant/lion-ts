import { toJson, jsonUtils } from '../to_json';

describe('toJson', () => {
    describe('basic functionality', () => {
        test('parses valid JSON string', () => {
            const input = '{"name": "John", "age": 30}';
            const result = toJson(input);
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('parses JSON array', () => {
            const input = '[{"id": 1}, {"id": 2}]';
            const result = toJson(input);
            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        });

        test('parses JSON from markdown code block', () => {
            const input = '```json\n{"name": "John"}\n```';
            const result = toJson(input);
            expect(result).toEqual({ name: 'John' });
        });

        test('parses multiple JSON blocks', () => {
            const input = `
                \`\`\`json
                {"id": 1}
                \`\`\`
                \`\`\`json
                {"id": 2}
                \`\`\`
            `;
            const result = toJson(input);
            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        });

        test('handles array input by joining with newlines', () => {
            const input = ['{"name":', '"John"}'];
            const result = toJson(input);
            expect(result).toEqual({ name: 'John' });
        });
    });

    describe('fuzzy parsing', () => {
        test('handles single quotes', () => {
            const input = "{'name': 'John'}";
            const result = toJson(input, { fuzzyParse: true });
            expect(result).toEqual({ name: 'John' });
        });

        test('handles unquoted keys', () => {
            const input = '{name: "John"}';
            const result = toJson(input, { fuzzyParse: true });
            expect(result).toEqual({ name: 'John' });
        });

        test('handles trailing commas', () => {
            const input = '{"items": [1, 2, 3,], "name": "John",}';
            const result = toJson(input, { fuzzyParse: true });
            expect(result).toEqual({
                items: [1, 2, 3],
                name: 'John'
            });
        });

        test('handles comments', () => {
            const input = `{
                // Single line comment
                "name": "John",
                /* Multi-line
                   comment */
                "age": 30
            }`;
            const result = toJson(input, { fuzzyParse: true });
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('handles undefined and null values', () => {
            const input = '{a: undefined, b: null}';
            const result = toJson(input, { fuzzyParse: true });
            expect(result).toEqual({ a: null, b: null });
        });

        test('handles boolean values', () => {
            const input = '{a: True, b: FALSE}';
            const result = toJson(input, { fuzzyParse: true });
            expect(result).toEqual({ a: true, b: false });
        });
    });

    describe('error handling', () => {
        test('returns empty array for invalid JSON without fuzzy parsing', () => {
            const input = '{invalid: json}';
            const result = toJson(input);
            expect(result).toEqual([]);
        });

        test('throws error for invalid JSON with fuzzy parsing', () => {
            const input = '{completely: invalid: json}';
            expect(() => toJson(input, { fuzzyParse: true }))
                .toThrow('Failed to parse JSON with fuzzy matching');
        });

        test('returns empty array for empty input', () => {
            expect(toJson('')).toEqual([]);
            expect(toJson([])).toEqual([]);
        });

        test('handles mixed valid and invalid blocks', () => {
            const input = `
                \`\`\`json
                {"valid": true}
                \`\`\`
                \`\`\`json
                {invalid: json}
                \`\`\`
            `;
            const result = toJson(input);
            expect(result).toEqual([{ valid: true }, {}]);
        });
    });

    describe('jsonUtils', () => {
        test('validateJson checks JSON validity', () => {
            expect(jsonUtils.validateJson('{"valid": true}')).toBe(true);
            expect(jsonUtils.validateJson('{invalid}')).toBe(false);
        });

        test('countJsonBlocks counts markdown blocks', () => {
            const input = `
                \`\`\`json
                {"id": 1}
                \`\`\`
                Some text
                \`\`\`json
                {"id": 2}
                \`\`\`
            `;
            expect(jsonUtils.countJsonBlocks(input)).toBe(2);
        });

        test('hasValidJsonBlocks checks for valid blocks', () => {
            const validInput = '```json\n{"valid": true}\n```';
            const invalidInput = '```json\n{invalid}\n```';
            
            expect(jsonUtils.hasValidJsonBlocks(validInput)).toBe(true);
            expect(jsonUtils.hasValidJsonBlocks(invalidInput)).toBe(false);
        });

        test('handles empty or non-JSON code blocks', () => {
            const input = `
                \`\`\`python
                print("Hello")
                \`\`\`
                \`\`\`json
                \`\`\`
            `;
            expect(jsonUtils.countJsonBlocks(input)).toBe(0);
            expect(jsonUtils.hasValidJsonBlocks(input)).toBe(false);
        });
    });

    describe('edge cases', () => {
        test('handles nested objects and arrays', () => {
            const input = `{
                "array": [1, [2, 3], {"nested": true}],
                "object": {"a": {"b": {"c": [1, 2, 3]}}}
            }`;
            const expected = {
                array: [1, [2, 3], { nested: true }],
                object: { a: { b: { c: [1, 2, 3] } } }
            };
            expect(toJson(input)).toEqual(expected);
        });

        test('handles whitespace variations', () => {
            const inputs = [
                '{"a":1}',
                '{ "a" : 1 }',
                '{\n"a"\n:\n1\n}',
                '{ \t"a" \t: \t1 \t}'
            ];
            const expected = { a: 1 };
            inputs.forEach(input => {
                expect(toJson(input)).toEqual(expected);
            });
        });

        test('handles special characters in strings', () => {
            const input = '{"special": "\\n\\t\\r\\b\\f\\u0041"}';
            expect(toJson(input)).toEqual({
                special: '\n\t\r\b\fA'
            });
        });

        test('handles empty objects and arrays', () => {
            const input = '{"empty_obj": {}, "empty_arr": []}';
            expect(toJson(input)).toEqual({
                empty_obj: {},
                empty_arr: []
            });
        });
    });
});
