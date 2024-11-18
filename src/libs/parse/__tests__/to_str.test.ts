import { toStr, stripLower } from '../to_str';
import { UNDEFINED } from '../../../types/undefined';

describe('toStr', () => {
    describe('basic type conversion', () => {
        test('converts primitive types', async () => {
            expect(await toStr(123)).toBe('123');
            expect(await toStr(true)).toBe('true');
            expect(await toStr('hello')).toBe('hello');
        });

        test('converts arrays to JSON string', async () => {
            expect(await toStr([1, 2, 3])).toBe('[1,2,3]');
            expect(await toStr(['a', 'b'])).toBe('["a","b"]');
        });

        test('converts objects to JSON string', async () => {
            const obj = { name: 'John', age: 30 };
            expect(await toStr(obj)).toBe('{"name":"John","age":30}');
        });

        test('handles nested structures', async () => {
            const nested = {
                array: [1, [2, 3]],
                object: { a: { b: 'c' } }
            };
            expect(await toStr(nested)).toBe(
                '{"array":[1,[2,3]],"object":{"a":{"b":"c"}}}'
            );
        });
    });

    describe('string processing', () => {
        test('strips and lowercases with stripLower option', async () => {
            expect(await toStr('  HELLO  ', { stripLower: true })).toBe('hello');
            expect(await toStr('MIXED case TEXT', { stripLower: true })).toBe('mixed case text');
        });

        test('strips specific characters', async () => {
            expect(await toStr('###hello###', { stripLower: true, chars: '#' }))
                .toBe('hello');
            expect(await toStr('__test__', { stripLower: true, chars: '_' }))
                .toBe('test');
        });

        test('combines stripLower and chars options', async () => {
            expect(await toStr('###HELLO###', { stripLower: true, chars: '#' }))
                .toBe('hello');
        });
    });

    describe('serialization formats', () => {
        test('serializes as JSON', async () => {
            const obj = { name: 'John', age: 30 };
            const result = await toStr(obj, { serializeAs: 'json', indent: 2 });
            expect(result).toBe('{\n  "name": "John",\n  "age": 30\n}');
        });

        test('serializes as XML', async () => {
            const obj = { name: 'John', age: 30 };
            const result = await toStr(obj, { serializeAs: 'xml' });
            expect(result).toContain('<root>');
            expect(result).toContain('<name>John</name>');
            expect(result).toContain('<age>30</age>');
            expect(result).toContain('</root>');
        });

        test('handles custom root tag for XML', async () => {
            const obj = { name: 'John' };
            const result = await toStr(obj, { 
                serializeAs: 'xml',
                rootTag: 'person'
            });
            expect(result).toContain('<person>');
            expect(result).toContain('</person>');
        });
    });

    describe('special cases', () => {
        test('handles null and undefined', async () => {
            expect(await toStr(null)).toBe('');
            expect(await toStr(undefined)).toBe('');
            expect(await toStr(UNDEFINED)).toBe('');
        });

        test('handles empty arrays and objects', async () => {
            expect(await toStr([])).toBe('');
            expect(await toStr({})).toBe('');
        });

        test('handles binary data', async () => {
            const uint8Array = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
            expect(await toStr(uint8Array)).toBe('Hello');
        });

        test('handles custom objects with toString', async () => {
            class Custom {
                toString() { return 'custom'; }
            }
            expect(await toStr(new Custom())).toBe('custom');
        });
    });

    describe('error handling', () => {
        test('handles conversion errors with suppress option', async () => {
            const badObj = {
                toJSON() { throw new Error('Conversion failed'); }
            };
            expect(await toStr(badObj, { suppress: true })).toBe('');
        });

        test('throws error without suppress option', async () => {
            const badObj = {
                toJSON() { throw new Error('Conversion failed'); }
            };
            await expect(toStr(badObj)).rejects.toThrow();
        });

        test('handles serialization errors', async () => {
            const circular: any = { a: 1 };
            circular.self = circular;
            await expect(toStr(circular)).rejects.toThrow();
        });
    });

    describe('stripLower function', () => {
        test('strips and lowercases basic strings', async () => {
            expect(await stripLower('  HELLO WORLD  ')).toBe('hello world');
            expect(await stripLower('MiXeD cAsE')).toBe('mixed case');
        });

        test('handles different input types', async () => {
            expect(await stripLower(123)).toBe('123');
            expect(await stripLower(true)).toBe('true');
            expect(await stripLower(['A', 'B'])).toBe('["a","b"]');
        });

        test('works with serialization formats', async () => {
            const obj = { NAME: 'JOHN' };
            const jsonResult = await stripLower(obj, { serializeAs: 'json' });
            expect(jsonResult).toBe('{"name":"john"}');

            const xmlResult = await stripLower(obj, { serializeAs: 'xml' });
            expect(xmlResult).toContain('<name>john</name>');
        });

        test('handles special characters', async () => {
            expect(await stripLower('###HELLO###', { chars: '#' }))
                .toBe('hello');
            expect(await stripLower('__WORLD__', { chars: '_' }))
                .toBe('world');
        });
    });

    describe('edge cases', () => {
        test('handles empty strings', async () => {
            expect(await toStr('')).toBe('');
            expect(await stripLower('')).toBe('');
        });

        test('handles whitespace-only strings', async () => {
            expect(await toStr('   ', { stripLower: true })).toBe('');
            expect(await stripLower('   ')).toBe('');
        });

        test('preserves special characters when not stripped', async () => {
            expect(await toStr('$#@Hello@#$')).toBe('$#@Hello@#$');
            expect(await stripLower('$#@Hello@#$')).toBe('$#@hello@#$');
        });

        test('handles non-string convertible objects', async () => {
            const symbol = Symbol('test');
            await expect(toStr(symbol)).rejects.toThrow();
            await expect(stripLower(symbol)).rejects.toThrow();
        });
    });
});
