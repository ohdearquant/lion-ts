"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripLower = exports.toStr = void 0;
const undefined_1 = require("../../types/undefined");
const to_dict_1 = require("./to_dict");
/**
 * Internal function to serialize input to JSON or XML format
 */
async function serializeAs(input, format, options = {}) {
    const { stripLower = false, chars = null, strType = null, useModelDump = false, strParser = undefined, parserKwargs = {}, indent, rootTag = 'root', ...kwargs } = options;
    try {
        const dict = (0, to_dict_1.toDict)(input, {
            useDictDump: useModelDump,
            strType,
            suppress: true,
            parser: strParser,
            ...parserKwargs
        });
        if (strType || chars) {
            const str = JSON.stringify(dict);
            const processedStr = processString(str, stripLower, chars);
            const processedDict = JSON.parse(processedStr);
            if (format === 'json') {
                return JSON.stringify(processedDict, null, indent);
            }
            return dictToXml(processedDict, rootTag);
        }
        if (format === 'json') {
            return JSON.stringify(dict, null, indent);
        }
        return dictToXml(dict, rootTag);
    }
    catch (e) {
        throw new Error(`Failed to serialize input of ${input?.constructor?.name || typeof input} ` +
            `into <${strType}>`);
    }
}
/**
 * Convert input to its string representation
 */
function toStrType(input) {
    if (input === null || input === undefined || input === undefined_1.UNDEFINED) {
        return '';
    }
    if (Array.isArray(input) && input.length === 0) {
        return '';
    }
    if (typeof input === 'object' && Object.keys(input).length === 0) {
        return '';
    }
    if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
        return new TextDecoder().decode(input);
    }
    if (typeof input === 'string') {
        return input;
    }
    if (typeof input === 'object' && !Array.isArray(input)) {
        return JSON.stringify(input);
    }
    try {
        return String(input);
    }
    catch (e) {
        throw new Error(`Could not convert input of type <${input?.constructor?.name || typeof input}> to string`);
    }
}
/**
 * Process a string with optional lowercasing and character stripping
 */
function processString(s, stripLower, chars) {
    if (s === '' ||
        s === 'undefined' ||
        s === 'null' ||
        s === '[]' ||
        s === '{}') {
        return '';
    }
    if (stripLower) {
        s = s.toLowerCase();
        if (chars !== null) {
            const regex = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
            s = s.replace(regex, '');
        }
        else {
            s = s.trim();
        }
    }
    return s;
}
/**
 * Convert any input to its string representation.
 *
 * @param input - The input to convert to a string
 * @param options - Configuration options for string conversion
 * @returns The string representation of the input
 *
 * @example
 * ```typescript
 * toStr(123) // '123'
 * toStr('  HELLO  ', { stripLower: true }) // 'hello'
 * toStr({ a: 1 }, { serializeAs: 'json' }) // '{"a":1}'
 * toStr({ a: 1 }, { serializeAs: 'xml' }) // '<root><a>1</a></root>'
 * ```
 */
async function toStr(input, options = {}) {
    const { serializeAs: format, stripLower = false, chars = null, ...rest } = options;
    if (format) {
        return serializeAs(input, format, { stripLower, chars, ...rest });
    }
    let str = toStrType(input);
    if (stripLower || chars) {
        str = processString(str, stripLower, chars);
    }
    return str;
}
exports.toStr = toStr;
/**
 * Convert input to stripped and lowercase string representation.
 * This is a convenience wrapper around toStr that always applies
 * stripping and lowercasing.
 *
 * @param input - The input to convert to a string
 * @param options - Additional configuration options
 * @returns Stripped and lowercase string representation of the input
 *
 * @example
 * ```typescript
 * stripLower('  HELLO WORLD  ') // 'hello world'
 * ```
 */
async function stripLower(input, options = {}) {
    return toStr(input, { ...options, stripLower: true });
}
exports.stripLower = stripLower;
/**
 * Simple XML conversion utility
 */
function dictToXml(dict, rootTag = 'root') {
    const xmlBuilder = require('xmlbuilder');
    const root = xmlBuilder.create(rootTag);
    function convertToXml(obj, parent) {
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined) {
                parent.ele(key);
            }
            else if (typeof value === 'object') {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (typeof item === 'object') {
                            const element = parent.ele(key);
                            convertToXml(item, element);
                        }
                        else {
                            parent.ele(key, {}, String(item));
                        }
                    });
                }
                else {
                    const element = parent.ele(key);
                    convertToXml(value, element);
                }
            }
            else {
                parent.ele(key, {}, String(value));
            }
        }
    }
    convertToXml(dict, root);
    return root.end({ pretty: true });
}
