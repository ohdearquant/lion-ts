import { fuzzyParseJson } from '../fuzzy_parse_json';

describe('fuzzyParseJson', () => {
    describe('basic functionality', () => {
        test('parses valid JSON string', () => {
            const input = '{"name": "John", "age": 30}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('parses JSON array', () => {
            const input = '[{"id": 1}, {"id": 2}]';
            const result = fuzzyParseJson(input);
            expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        });

        test('handles nested objects', () => {
            const input = '{"person": {"name": "John", "age": 30}}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                person: { name: 'John', age: 30 }
            });
        });

        test('handles nested arrays', () => {
            const input = '{"numbers": [1, [2, 3], 4]}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                numbers: [1, [2, 3], 4]
            });
        });
    });

    describe('formatting fixes', () => {
        test('fixes single quotes', () => {
            const input = "{'name': 'John'}";
            const result = fuzzyParseJson(input);
            expect(result).toEqual({ name: 'John' });
        });

        test('fixes unquoted keys', () => {
            const input = '{name: "John"}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({ name: 'John' });
        });

        test('fixes trailing commas', () => {
            const input = '{"items": [1, 2, 3,], "name": "John",}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                items: [1, 2, 3],
                name: 'John'
            });
        });

        test('fixes whitespace issues', () => {
            const input = '{\n  name:\n  "John",\n  age:  30\n}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({ name: 'John', age: 30 });
        });

        test('handles escaped quotes', () => {
            const input = '{"text": "Hello \\"world\\""}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({ text: 'Hello "world"' });
        });
    });

    describe('bracket fixing', () => {
        test('adds missing closing brackets', () => {
            const input = '{"name": "John"';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({ name: 'John' });
        });

        test('adds multiple missing closing brackets', () => {
            const input = '{"person": {"name": "John"';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                person: { name: 'John' }
            });
        });

        test('handles nested bracket fixing', () => {
            const input = '{"array": [1, [2, 3';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                array: [1, [2, 3]]
            });
        });
    });

    describe('error handling', () => {
        test('throws for non-string input', () => {
            expect(() => fuzzyParseJson(123 as any)).toThrow(TypeError);
            expect(() => fuzzyParseJson(null as any)).toThrow(TypeError);
            expect(() => fuzzyParseJson(undefined as any)).toThrow(TypeError);
        });

        test('throws for empty input', () => {
            expect(() => fuzzyParseJson('')).toThrow('Input string is empty');
            expect(() => fuzzyParseJson('   ')).toThrow('Input string is empty');
        });

        test('throws for invalid JSON after all fixes', () => {
            const input = '{"name": this_is_invalid}';
            expect(() => fuzzyParseJson(input)).toThrow();
        });

        test('throws for mismatched brackets', () => {
            const input = '{"name": "John"}}';
            expect(() => fuzzyParseJson(input)).toThrow();
        });

        test('throws for non-object/array results', () => {
            expect(() => fuzzyParseJson('"just a string"')).toThrow(TypeError);
            expect(() => fuzzyParseJson('123')).toThrow(TypeError);
            expect(() => fuzzyParseJson('true')).toThrow(TypeError);
        });
    });

    describe('edge cases', () => {
        test('handles mixed quote styles', () => {
            const input = `{
                "name": 'John',
                'age': "30",
                address: 'New York'
            }`;
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                name: 'John',
                age: '30',
                address: 'New York'
            });
        });

        test('handles multiple levels of nesting', () => {
            const input = `{
                "level1": {
                    'level2': {
                        level3: {
                            "value": 42
                        }
                    }
                }
            }`;
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                level1: {
                    level2: {
                        level3: {
                            value: 42
                        }
                    }
                }
            });
        });

        test('handles special characters in strings', () => {
            const input = '{"special": "\\n\\t\\r\\b\\f"}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                special: '\n\t\r\b\f'
            });
        });

        test('handles unicode characters', () => {
            const input = '{"unicode": "\\u0041\\u0042\\u0043"}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                unicode: 'ABC'
            });
        });

        test('handles empty objects and arrays', () => {
            const input = '{"empty_obj": {}, "empty_arr": []}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                empty_obj: {},
                empty_arr: []
            });
        });

        test('handles numeric keys', () => {
            const input = '{1: "one", "2": "two"}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                "1": "one",
                "2": "two"
            });
        });

        test('handles special numeric values', () => {
            const input = '{' +
                '"nan": NaN,' +
                '"inf": Infinity,' +
                '"neg_inf": -Infinity' +
            '}';
            const result = fuzzyParseJson(input);
            expect(result).toEqual({
                nan: null,
                inf: null,
                neg_inf: null
            });
        });
    });
});
