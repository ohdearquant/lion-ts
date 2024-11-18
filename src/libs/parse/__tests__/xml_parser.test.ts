import { xmlToDict, dictToXml, xmlToDictSync } from '../xml_parser';
import type { XmlParserOptions } from '../types';

describe('xml_parser', () => {
    describe('xmlToDict', () => {
        test('parses basic XML', async () => {
            const xml = '<root><item>value</item></root>';
            const result = await xmlToDict(xml);
            expect(result).toEqual({ item: 'value' });
        });

        test('parses XML with attributes', async () => {
            const xml = '<root><item id="1">value</item></root>';
            const result = await xmlToDict(xml, { mergeAttrs: false });
            expect(result).toEqual({
                item: {
                    _: 'value',
                    $: { id: '1' }
                }
            });
        });

        test('handles merged attributes', async () => {
            const xml = '<root><item id="1">value</item></root>';
            const result = await xmlToDict(xml, { mergeAttrs: true });
            expect(result).toEqual({
                item: {
                    _: 'value',
                    id: '1'
                }
            });
        });

        test('handles arrays with explicitArray option', async () => {
            const xml = `
                <root>
                    <item>value1</item>
                    <item>value2</item>
                </root>
            `;
            const result = await xmlToDict(xml, { explicitArray: true });
            expect(result).toEqual({
                item: ['value1', 'value2']
            });
        });

        test('handles root tag removal', async () => {
            const xml = '<data><item>value</item></data>';
            const withRoot = await xmlToDict(xml, { removeRoot: false });
            const withoutRoot = await xmlToDict(xml, { removeRoot: true });

            expect(withRoot).toEqual({ data: { item: 'value' } });
            expect(withoutRoot).toEqual({ item: 'value' });
        });

        test('handles custom root tag', async () => {
            const xml = '<data><item>value</item></data>';
            const result = await xmlToDict(xml, { rootTag: 'data' });
            expect(result).toEqual({ item: 'value' });
        });

        test('handles empty input', async () => {
            expect(await xmlToDict('')).toEqual({});
            expect(await xmlToDict('   ')).toEqual({});
        });

        test('handles malformed XML with suppress option', async () => {
            const xml = '<root><unclosed>';
            const result = await xmlToDict(xml, { suppress: true });
            expect(result).toEqual({});
        });

        test('throws error for malformed XML without suppress', async () => {
            const xml = '<root><unclosed>';
            await expect(xmlToDict(xml)).rejects.toThrow();
        });
    });

    describe('dictToXml', () => {
        test('converts basic dictionary to XML', () => {
            const data = { item: 'value' };
            const xml = dictToXml(data, 'root');
            expect(xml).toContain('<root>');
            expect(xml).toContain('<item>value</item>');
            expect(xml).toContain('</root>');
        });

        test('handles nested objects', () => {
            const data = {
                person: {
                    name: 'John',
                    age: 30
                }
            };
            const xml = dictToXml(data);
            expect(xml).toContain('<person>');
            expect(xml).toContain('<name>John</name>');
            expect(xml).toContain('<age>30</age>');
        });

        test('handles arrays', () => {
            const data = {
                items: ['one', 'two', 'three']
            };
            const xml = dictToXml(data);
            expect(xml).toContain('<items>one</items>');
            expect(xml).toContain('<items>two</items>');
            expect(xml).toContain('<items>three</items>');
        });

        test('handles attributes', () => {
            const data = {
                item: {
                    '@attributes': { id: '1' },
                    value: 'test'
                }
            };
            const xml = dictToXml(data);
            expect(xml).toContain('<item id="1">');
            expect(xml).toContain('<value>test</value>');
        });

        test('handles null and undefined values', () => {
            const data = {
                null: null,
                undefined: undefined,
                valid: 'value'
            };
            const xml = dictToXml(data);
            expect(xml).toContain('<null/>');
            expect(xml).toContain('<undefined/>');
            expect(xml).toContain('<valid>value</valid>');
        });

        test('handles pretty printing options', () => {
            const data = { item: 'value' };
            const pretty = dictToXml(data, 'root', { pretty: true, indent: '  ' });
            const notPretty = dictToXml(data, 'root', { pretty: false });

            expect(pretty).toContain('\n');
            expect(pretty).toContain('  ');
            expect(notPretty).not.toContain('\n');
        });

        test('escapes special characters', () => {
            const data = {
                special: '< > & " \''
            };
            const xml = dictToXml(data);
            // Check each escaped character individually
            expect(xml).toContain('&lt;');
            expect(xml).toContain('&gt;');
            expect(xml).toContain('&amp;');
            expect(xml).toContain('&quot;');
            // Single quotes can be either escaped or unescaped in XML content
            expect(xml).toMatch(/(&apos;|')/);
        });
    });

    describe('xmlToDictSync', () => {
        test('parses basic XML synchronously', () => {
            const xml = '<root><item>value</item></root>';
            const result = xmlToDictSync(xml);
            expect(result).toEqual({ item: 'value' });
        });

        test('handles all parsing options', () => {
            const xml = `
                <root>
                    <item id="1">value1</item>
                    <item id="2">value2</item>
                </root>
            `;
            const options: XmlParserOptions = {
                explicitArray: true,
                mergeAttrs: false,
                removeRoot: false
            };
            const result = xmlToDictSync(xml, options);
            expect(result).toHaveProperty('root');
            expect(result.root.item).toBeInstanceOf(Array);
        });

        test('handles empty input', () => {
            expect(xmlToDictSync('')).toEqual({});
            expect(xmlToDictSync('   ')).toEqual({});
        });

        test('handles malformed XML with suppress option', () => {
            const xml = '<root><unclosed>';
            const result = xmlToDictSync(xml, { suppress: true });
            expect(result).toEqual({});
        });

        test('throws error for malformed XML without suppress', () => {
            const xml = '<root><unclosed>';
            expect(() => xmlToDictSync(xml)).toThrow();
        });
    });

    describe('edge cases', () => {
        test('handles XML with mixed content', async () => {
            const xml = `
                <root>
                    Text before
                    <item>value</item>
                    Text after
                </root>
            `;
            const result = await xmlToDict(xml);
            expect(result).toHaveProperty('item');
            expect(result).toHaveProperty('_');
        });

        test('handles XML with namespaces', async () => {
            const xml = `
                <root xmlns:ns="http://example.com">
                    <ns:item>value</ns:item>
                </root>
            `;
            const result = await xmlToDict(xml);
            expect(result).toHaveProperty('ns:item');
        });

        test('handles XML with CDATA sections', async () => {
            const xml = `
                <root>
                    <item><![CDATA[<special> & chars]]></item>
                </root>
            `;
            const result = await xmlToDict(xml);
            expect(result.item).toBe('<special> & chars');
        });

        test('handles deeply nested structures', () => {
            const data = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep'
                        }
                    }
                }
            };
            const xml = dictToXml(data);
            expect(xml).toContain('<level1>');
            expect(xml).toContain('<level2>');
            expect(xml).toContain('<level3>');
            expect(xml).toContain('<value>deep</value>');
        });

        test('handles mixed arrays and objects', () => {
            const data = {
                mixed: [
                    { type: 'object', value: 1 },
                    'string',
                    123
                ]
            };
            const xml = dictToXml(data);
            expect(xml).toContain('<type>object</type>');
            expect(xml).toContain('<value>1</value>');
            expect(xml).toContain('<mixed>string</mixed>');
            expect(xml).toContain('<mixed>123</mixed>');
        });
    });
});
