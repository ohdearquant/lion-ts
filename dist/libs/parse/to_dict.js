"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDict = void 0;
const fuzzy_parse_json_1 = require("./fuzzy_parse_json");
const xml_parser_1 = require("./xml_parser");
const types_1 = require("./types");
/**
 * Convert various input types to a dictionary
 */
function toDict(input, options = {}) {
    const { useDictDump = true, fuzzyParse = false, strType = 'json', parser = undefined, recursive = false, maxRecursiveDepth = undefined, excludeTypes = [], recursivePythonOnly = true, suppress = false } = options;
    try {
        if (recursive) {
            return recursiveToDict(input, {
                useDictDump,
                fuzzyParse,
                strType,
                parser,
                maxRecursiveDepth,
                excludeTypes,
                recursiveCustomTypes: !recursivePythonOnly,
            });
        }
        return toDictCore(input, {
            useDictDump,
            fuzzyParse,
            strType,
            parser,
            excludeTypes,
        });
    }
    catch (error) {
        if (suppress) {
            return {};
        }
        throw error;
    }
}
exports.toDict = toDict;
/**
 * Core dictionary conversion logic
 */
function toDictCore(input, options) {
    const { useDictDump = true, fuzzyParse = false, strType = 'json', parser = undefined, excludeTypes = [], } = options;
    // Handle excluded types
    if (excludeTypes.length > 0 && excludeTypes.some(type => input instanceof type)) {
        return input;
    }
    // Handle null/undefined
    if (input == null) {
        return {};
    }
    // Handle plain objects
    if (isPlainObject(input)) {
        return input;
    }
    // Handle model dump
    if (useDictDump && typeof input?.modelDump === 'function') {
        return input.modelDump();
    }
    // Handle string conversion
    if (typeof input === 'string') {
        if (fuzzyParse) {
            return (0, fuzzy_parse_json_1.fuzzyParseJson)(input);
        }
        return stringToDict(input, strType, parser);
    }
    // Handle Maps
    if (input instanceof Map) {
        return Object.fromEntries(input);
    }
    // Handle Sets
    if (input instanceof Set) {
        return Array.from(input).reduce((acc, val) => {
            acc[val] = val;
            return acc;
        }, {});
    }
    // Handle Arrays and other iterables
    if (Symbol.iterator in Object(input)) {
        return Array.from(input).reduce((acc, val, idx) => {
            acc[idx] = val;
            return acc;
        }, {});
    }
    // Handle generic objects
    return convertGenericToDict(input);
}
/**
 * Recursively convert to dictionary with depth control
 */
function recursiveToDict(input, options) {
    const { maxRecursiveDepth = 5, recursiveCustomTypes = false, ...rest } = options;
    if (!Number.isInteger(maxRecursiveDepth) || maxRecursiveDepth < 0) {
        throw new types_1.ValueError('maxRecursiveDepth must be a non-negative integer');
    }
    if (maxRecursiveDepth > 10) {
        throw new types_1.ValueError('maxRecursiveDepth must be less than or equal to 10');
    }
    function recursiveHelper(value, depth) {
        if (depth >= maxRecursiveDepth) {
            return value;
        }
        // Handle strings
        if (typeof value === 'string') {
            try {
                const parsed = toDictCore(value, rest);
                return recursiveHelper(parsed, depth + 1);
            }
            catch {
                return value;
            }
        }
        // Handle arrays
        if (Array.isArray(value)) {
            return value.map(item => recursiveHelper(item, depth + 1));
        }
        // Handle plain objects
        if (isPlainObject(value)) {
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [
                k,
                recursiveHelper(v, depth + 1)
            ]));
        }
        // Handle custom types
        if (recursiveCustomTypes) {
            try {
                const converted = toDictCore(value, rest);
                return recursiveHelper(converted, depth + 1);
            }
            catch {
                return value;
            }
        }
        return value;
    }
    return recursiveHelper(input, 0);
}
/**
 * Convert string to dictionary
 */
function stringToDict(input, strType = 'json', parser) {
    if (!input)
        return {};
    if (strType === 'json') {
        try {
            return parser ? parser(input) : JSON.parse(input);
        }
        catch (error) {
            throw new types_1.ValueError('Failed to parse JSON string');
        }
    }
    if (strType === 'xml') {
        try {
            return parser ? parser(input) : (0, xml_parser_1.xmlToDict)(input);
        }
        catch (error) {
            throw new types_1.ValueError('Failed to parse XML string');
        }
    }
    throw new types_1.ValueError('Unsupported string type, must be "json" or "xml"');
}
/**
 * Convert generic object to dictionary
 */
function convertGenericToDict(input) {
    // Try common conversion methods
    const methods = ['toDict', 'dict', 'json', 'toJson'];
    for (const method of methods) {
        if (typeof input[method] === 'function') {
            const result = input[method]();
            return typeof result === 'string' ?
                JSON.parse(result) :
                result;
        }
    }
    // Try __dict__ property
    if (input.__dict__) {
        return input.__dict__;
    }
    // Try direct conversion
    try {
        return Object.fromEntries(input);
    }
    catch {
        throw new types_1.ValueError('Unable to convert input to dictionary');
    }
}
/**
 * Check if value is a plain object
 */
function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}
