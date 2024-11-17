import { XmlParserOptions } from './types';
/**
 * Parse an XML string into a nested dictionary structure.
 *
 * This function converts an XML string into a dictionary where:
 * - Element tags become dictionary keys
 * - Text content is assigned directly to the tag key if there are no children
 * - Attributes are stored in a '@attributes' key
 * - Multiple child elements with the same tag are stored as lists
 *
 * @param xmlString - The XML string to parse.
 * @param options - XML parsing options
 * @returns A dictionary representation of the XML structure.
 * @throws Error if the XML is malformed or parsing fails and suppress is false.
 */
export declare function xmlToDict(xmlString: string, options?: XmlParserOptions): Promise<Record<string, any>>;
/**
 * Convert a dictionary to an XML string.
 *
 * @param data - The dictionary to convert to XML.
 * @param rootTag - The root tag for the XML document.
 * @returns The XML string representation of the dictionary.
 */
export declare function dictToXml(data: Record<string, any>, rootTag?: string): string;
