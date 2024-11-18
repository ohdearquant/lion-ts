import * as xml2js from 'xml2js';
import * as xmlbuilder from 'xmlbuilder';
import { XmlParserOptions, ParseError, StringKeyedDict } from './types';

/**
 * Parse an XML string into a nested dictionary structure.
 * 
 * This function converts an XML string into a dictionary where:
 * - Element tags become dictionary keys
 * - Text content is assigned directly to the tag key if there are no children
 * - Attributes are stored in a '$' key
 * - Multiple child elements with the same tag are stored as lists
 * 
 * @param xmlString - The XML string to parse
 * @param options - XML parsing options
 * @returns A dictionary representation of the XML structure
 * @throws ParseError if XML is malformed or parsing fails and suppress is false
 * 
 * @example
 * ```typescript
 * const xml = '<root><item>value</item></root>';
 * const result = await xmlToDict(xml);
 * // result = { root: { item: 'value' } }
 * ```
 */
export async function xmlToDict(
    xmlString: string,
    options: XmlParserOptions = {}
): Promise<StringKeyedDict> {
    const {
        explicitArray = false,
        mergeAttrs = true,
        removeRoot = true,
        rootTag = null,
        suppress = false
    } = options;

    if (!xmlString.trim()) {
        return {};
    }

    try {
        const parser = new xml2js.Parser({
            explicitArray,
            mergeAttrs,
            trim: true,
            explicitRoot: !removeRoot,
            charkey: '_',
            attrkey: '$',
            explicitCharkey: true,
            valueProcessors: [
                (value: any) => {
                    if (value === null || value === undefined) return '';
                    return String(value).trim();
                }
            ],
            attrValueProcessors: [
                (value: any) => {
                    if (value === null || value === undefined) return '';
                    return String(value).trim();
                }
            ]
        });

        const result = await parser.parseStringPromise(xmlString);
        return processContent(result);
    } catch (error) {
        if (suppress) {
            return {};
        }
        throw new ParseError(
            `Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Process XML content to clean up the structure
 */
function processContent(content: any): any {
    if (!content) return content;

    // Handle text content
    if (typeof content === 'string') {
        return content;
    }

    // Handle arrays
    if (Array.isArray(content)) {
        return content.map(processContent);
    }

    // Handle objects
    if (typeof content === 'object') {
        const result: StringKeyedDict = {};
        for (const [key, value] of Object.entries(content)) {
            if (key === '$') {
                result[key] = value;
                continue;
            }
            if (Array.isArray(value)) {
                result[key] = value.map(item => {
                    if (typeof item === 'string') {
                        return item;
                    }
                    if (typeof item === 'object' && '_' in item && Object.keys(item).length === 1) {
                        return item._;
                    }
                    return processContent(item);
                });
            } else if (value && typeof value === 'object' && '_' in value && Object.keys(value).length === 1) {
                result[key] = value._;
            } else if (value && typeof value === 'object' && '_' in value) {
                const processed = { ...value };
                const text = processed._;
                delete processed._;
                result[key] = { ...processContent(processed), _: text };
            } else {
                result[key] = processContent(value);
            }
        }
        return result;
    }

    return content;
}

/**
 * Convert a dictionary to an XML string.
 * 
 * @param data - The dictionary to convert to XML
 * @param rootTag - The root tag for the XML document
 * @param options - XML generation options
 * @returns The XML string representation of the dictionary
 * 
 * @example
 * ```typescript
 * const data = { item: 'value' };
 * const xml = dictToXml(data, 'root');
 * // xml = '<root><item>value</item></root>'
 * ```
 */
export function dictToXml(
    data: StringKeyedDict,
    rootTag: string = 'root',
    options: { pretty?: boolean; indent?: string } = {}
): string {
    const { pretty = true, indent = '  ' } = options;
    
    const root = xmlbuilder.create(rootTag);
    
    function convert(obj: StringKeyedDict, parent: xmlbuilder.XMLElement): void {
        // Handle text content first if present
        if (obj._ || obj._ === '') {
            parent.raw(escapeXml(String(obj._)));
            delete obj._;
        }

        // Handle attributes
        if (obj.$ || obj['@attributes']) {
            const attrs = obj.$ || obj['@attributes'];
            parent.att(attrs);
            delete obj.$;
            delete obj['@attributes'];
        }

        for (const [key, val] of Object.entries(obj)) {
            // Skip internal properties
            if (key === '$' || key === '_') continue;

            // Handle null/undefined
            if (val == null) {
                parent.ele(key);
                continue;
            }

            // Handle arrays
            if (Array.isArray(val)) {
                val.forEach(item => {
                    const element = parent.ele(key);
                    if (item && typeof item === 'object') {
                        convert(item, element);
                    } else {
                        element.raw(escapeXml(String(item)));
                    }
                });
                continue;
            }

            // Handle objects
            if (typeof val === 'object') {
                const element = parent.ele(key);
                convert(val, element);
                continue;
            }

            // Handle primitive values
            parent.ele(key).raw(escapeXml(String(val)));
        }
    }

    convert(data, root);
    return root.end({ pretty, indent });
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Synchronously parse XML string to dictionary.
 * Use this when async operation is not possible.
 * Prefer async xmlToDict when possible.
 * 
 * @param xmlString - The XML string to parse
 * @param options - XML parsing options
 * @returns A dictionary representation of the XML structure
 * @throws ParseError if XML is malformed or parsing fails and suppress is false
 */
export function xmlToDictSync(
    xmlString: string,
    options: XmlParserOptions = {}
): StringKeyedDict {
    const {
        explicitArray = false,
        mergeAttrs = true,
        removeRoot = true,
        rootTag = null,
        suppress = false
    } = options;

    if (!xmlString.trim()) {
        return {};
    }

    try {
        const parser = new xml2js.Parser({
            explicitArray,
            mergeAttrs,
            trim: true,
            explicitRoot: true, // Always keep root initially
            charkey: '_',
            attrkey: '$',
            explicitCharkey: true,
            valueProcessors: [
                (value: any) => {
                    if (value === null || value === undefined) return '';
                    return String(value).trim();
                }
            ],
            attrValueProcessors: [
                (value: any) => {
                    if (value === null || value === undefined) return '';
                    return String(value).trim();
                }
            ]
        });

        let result: StringKeyedDict = {};
        parser.parseString(xmlString, (err, parsed) => {
            if (err) throw err;
            result = processContent(parsed);
        });

        // Handle root tag removal
        if (removeRoot && result && typeof result === 'object') {
            const rootKeys = Object.keys(result);
            if (rootKeys.length === 1) {
                const rootContent = result[rootKeys[0]];
                if (rootContent && typeof rootContent === 'object') {
                    return rootContent;
                }
            }
        }

        return result;
    } catch (error) {
        if (suppress) {
            return {};
        }
        throw new ParseError(
            `Failed to parse XML: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}
