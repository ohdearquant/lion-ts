import * as xml2js from 'xml2js';
import * as xmlbuilder from 'xmlbuilder';

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
 * @param suppress - If true, suppresses errors and returns an empty object on failure.
 * @param removeRoot - If true, removes the root element from the resulting dictionary.
 * @param rootTag - The root tag to remove if removeRoot is true.
 * @returns A dictionary representation of the XML structure.
 * @throws Error if the XML is malformed or parsing fails and suppress is false.
 */
export function xmlToDict(
  xmlString: string,
  suppress: boolean = false,
  removeRoot: boolean = true,
  rootTag: string | null = null
): Record<string, any> {
  try {
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = parser.parseStringPromise(xmlString);
    if (removeRoot && (rootTag || 'root') in result) {
      return result[rootTag || 'root'];
    }
    return result;
  } catch (error) {
    if (!suppress) {
      throw error;
    }
    return {};
  }
}

/**
 * Convert a dictionary to an XML string.
 * 
 * @param data - The dictionary to convert to XML.
 * @param rootTag - The root tag for the XML document.
 * @returns The XML string representation of the dictionary.
 */
export function dictToXml(data: Record<string, any>, rootTag: string = 'root'): string {
  const root = xmlbuilder.create(rootTag);
  function convert(dictObj: Record<string, any>, parent: xmlbuilder.XMLElement) {
    for (const [key, val] of Object.entries(dictObj)) {
      if (typeof val === 'object' && !Array.isArray(val)) {
        const element = parent.ele(key);
        convert(val, element);
      } else {
        parent.ele(key, {}, String(val));
      }
    }
  }
  convert(data, root);
  return root.end({ pretty: true });
}
