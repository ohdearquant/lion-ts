"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dictToXml = exports.xmlToDict = void 0;
const xml2js = __importStar(require("xml2js"));
const xmlbuilder = __importStar(require("xmlbuilder"));
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
async function xmlToDict(xmlString, options = {}) {
    const { explicitArray = false, mergeAttrs = true, removeRoot = true, rootTag = null, suppress = false } = options;
    try {
        const parser = new xml2js.Parser({ explicitArray, mergeAttrs });
        const result = await parser.parseStringPromise(xmlString);
        if (removeRoot && (rootTag || Object.keys(result)[0])) {
            const key = rootTag || Object.keys(result)[0];
            return result[key];
        }
        return result;
    }
    catch (error) {
        if (suppress) {
            return {};
        }
        throw error instanceof Error ? error : new Error('XML parsing failed');
    }
}
exports.xmlToDict = xmlToDict;
/**
 * Convert a dictionary to an XML string.
 *
 * @param data - The dictionary to convert to XML.
 * @param rootTag - The root tag for the XML document.
 * @returns The XML string representation of the dictionary.
 */
function dictToXml(data, rootTag = 'root') {
    const root = xmlbuilder.create(rootTag);
    function convert(dictObj, parent) {
        for (const [key, val] of Object.entries(dictObj)) {
            if (val === null || val === undefined) {
                parent.ele(key);
            }
            else if (typeof val === 'object' && !Array.isArray(val)) {
                const element = parent.ele(key);
                convert(val, element);
            }
            else if (Array.isArray(val)) {
                val.forEach(item => {
                    if (typeof item === 'object') {
                        const element = parent.ele(key);
                        convert(item, element);
                    }
                    else {
                        parent.ele(key, {}, String(item));
                    }
                });
            }
            else {
                parent.ele(key, {}, String(val));
            }
        }
    }
    convert(data, root);
    return root.end({ pretty: true });
}
exports.dictToXml = dictToXml;
