import * as xml2js from 'xml2js';
import * as xmlbuilder from 'xmlbuilder';
import { XmlParserOptions, ParseError, StringKeyedDict } from './types';

/**
 * Parse an XML string into a nested dictionary structure.
 * 
 * This function converts an XML string into a dictionary where:
 * - Element tags become dictionary keys
 * - Text content is assigned directly to the tag key if there are no children
 * - Attributes are stored in a '@attributes' key
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
 * // result = { item: 'value' }
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
            explicitRoot: !removeRoot
        });

        const result = await parser.parseStringPromise(xmlString);
        
        if (removeRoot && (rootTag || Object.keys(result)[0])) {
            const key = rootTag || Object.keys(result)[0];
            return result[key] || {};
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
        for (const [key, val] of Object.entries(obj)) {
            // Skip internal properties
            if (key.startsWith('_')) continue;

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
                        element.txt(String(item));
                    }
                });
                continue;
            }

            // Handle objects
            if (typeof val === 'object') {
                const element = parent.ele(key);
                // Handle attributes
                if (val['@attributes']) {
                    element.att(val['@attributes']);
                    delete val['@attributes'];
                }
                convert(val, element);
                continue;
            }

            // Handle primitive values
            parent.ele(key).txt(String(val));
        }
    }

    convert(data, root);
    return root.end({ pretty, indent });
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
            explicitRoot: !removeRoot
        });

        let result: StringKeyedDict = {};
        parser.parseString(xmlString, (err, parsed) => {
            if (err) throw err;
            result = parsed;
        });
        
        if (removeRoot && (rootTag || Object.keys(result)[0])) {
            const key = rootTag || Object.keys(result)[0];
            return result[key] || {};
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
