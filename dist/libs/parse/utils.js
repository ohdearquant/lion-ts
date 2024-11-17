"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toList = exports.toDict = exports.convertFraction = exports.convertPercentage = exports.convertSpecial = exports.validateBoolean = exports.validateNumType = exports.extractNumbers = exports.extractCodeBlock = exports.asReadable = exports.asReadableJson = void 0;
const constants_1 = require("../../constants");
/**
 * Convert input to a human-readable JSON string
 */
function asReadableJson(input, options = {}) {
    const { indent = 4, ensureAscii = false, useDictDump = true, fuzzyParse = true, recursive = true, recursivePythonOnly = true, maxRecursiveDepth = 5, } = options;
    // Handle empty input
    if (!input) {
        if (Array.isArray(input))
            return '';
        return '{}';
    }
    try {
        if (Array.isArray(input)) {
            // For lists, convert and format each item separately
            const items = input.map(item => {
                const dict = toDict(item, {
                    useDictDump,
                    fuzzyParse,
                    recursive,
                    recursivePythonOnly,
                    maxRecursiveDepth,
                });
                return JSON.stringify(dict, null, indent);
            });
            return items.join('\n\n');
        }
        // Handle single items
        const dict = toDict(input, {
            useDictDump,
            fuzzyParse,
            recursive,
            recursivePythonOnly,
            maxRecursiveDepth,
        });
        return JSON.stringify(dict, null, indent);
    }
    catch (e) {
        throw new Error(`Failed to convert input to readable JSON: ${e}`);
    }
}
exports.asReadableJson = asReadableJson;
/**
 * Convert input to readable string with optional markdown formatting
 */
function asReadable(input, md = false, options = {}) {
    try {
        const result = asReadableJson(input, options);
        return md ? `\`\`\`json\n${result}\n\`\`\`` : result;
    }
    catch {
        return String(input);
    }
}
exports.asReadable = asReadable;
/**
 * Extract code blocks from markdown text
 */
function extractCodeBlock(strToParse, returnAsList = false, languages = null, categorize = false) {
    const codeBlocks = [];
    const codeDict = {};
    const pattern = /^(?:```|~~~)[ \t]*([\w+-]*)[ \t]*\n(.*?)(?<=\n)^(?:```|~~~)[ \t]*$/gms;
    for (const match of strToParse.matchAll(pattern)) {
        const lang = match[1] || 'plain';
        const code = match[2];
        if (!languages || languages.includes(lang)) {
            if (categorize) {
                if (!codeDict[lang]) {
                    codeDict[lang] = [];
                }
                codeDict[lang].push(code);
            }
            else {
                codeBlocks.push(code);
            }
        }
    }
    if (categorize) {
        return codeDict;
    }
    if (returnAsList) {
        return codeBlocks;
    }
    return codeBlocks.join('\n\n');
}
exports.extractCodeBlock = extractCodeBlock;
/**
 * Extract numbers from text using regex patterns
 */
function extractNumbers(text) {
    const combinedPattern = Object.values(constants_1.PATTERNS).join('|');
    const matches = text.matchAll(new RegExp(combinedPattern, 'gi'));
    const numbers = [];
    for (const match of matches) {
        const value = match[0];
        // Check which pattern matched
        for (const [patternName, pattern] of Object.entries(constants_1.PATTERNS)) {
            if (new RegExp(String(pattern), 'i').test(value)) {
                numbers.push([patternName, value]);
                break;
            }
        }
    }
    return numbers;
}
exports.extractNumbers = extractNumbers;
/**
 * Validate numeric type specification
 */
function validateNumType(numType) {
    if (typeof numType === 'string') {
        switch (numType) {
            case 'int':
            case 'float':
            case 'complex':
                return Number;
            default:
                throw new Error(`Invalid number type: ${numType}`);
        }
    }
    if (numType !== Number) {
        throw new Error(`Invalid number type: ${numType}`);
    }
    return numType;
}
exports.validateNumType = validateNumType;
/**
 * Validate and convert boolean values
 */
function validateBoolean(x) {
    if (x === null) {
        throw new TypeError('Cannot convert null to boolean');
    }
    if (typeof x === 'boolean') {
        return x;
    }
    // Handle numeric types
    if (typeof x === 'number') {
        return Boolean(x);
    }
    // Convert to string if not already
    const strValue = String(x).trim().toLowerCase();
    if (!strValue) {
        throw new Error('Cannot convert empty string to boolean');
    }
    if (constants_1.TRUE_VALUES.has(strValue)) {
        return true;
    }
    if (constants_1.FALSE_VALUES.has(strValue)) {
        return false;
    }
    // Try numeric conversion as last resort
    const num = Number(strValue);
    if (!isNaN(num)) {
        return Boolean(num);
    }
    throw new Error(`Cannot convert '${x}' to boolean. Valid true values are: ${[...constants_1.TRUE_VALUES]}, ` +
        `valid false values are: ${[...constants_1.FALSE_VALUES]}`);
}
exports.validateBoolean = validateBoolean;
/**
 * Convert special float values (inf, -inf, nan)
 */
function convertSpecial(value) {
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('infinity') || lowerValue.includes('inf')) {
        return lowerValue.startsWith('-') ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    }
    return Number.NaN;
}
exports.convertSpecial = convertSpecial;
/**
 * Convert percentage string to number
 */
function convertPercentage(value) {
    try {
        return Number(value.replace('%', '')) / 100;
    }
    catch (e) {
        throw new Error(`Invalid percentage value: ${value}`);
    }
}
exports.convertPercentage = convertPercentage;
/**
 * Convert fraction string to number
 */
function convertFraction(value) {
    const [num, denom] = value.split('/').map(Number);
    if (denom === 0) {
        throw new Error('Division by zero');
    }
    return num / denom;
}
exports.convertFraction = convertFraction;
/**
 * Basic dictionary conversion
 */
function toDict(input, options = {}) {
    if (input === null || input === constants_1.UNDEFINED) {
        return {};
    }
    if (typeof input === 'object') {
        return { ...input };
    }
    try {
        return JSON.parse(input);
    }
    catch {
        return { [String(input)]: input };
    }
}
exports.toDict = toDict;
/**
 * Convert any input to array
 */
function toList(input, options = {}) {
    const { flatten = false, dropna = false, unique = false, useValues = false } = options;
    if (unique && !flatten) {
        throw new Error('unique=true requires flatten=true');
    }
    if (input === null || input === constants_1.UNDEFINED) {
        return [];
    }
    let result;
    if (Array.isArray(input)) {
        result = input;
    }
    else if (typeof input === 'string') {
        result = useValues ? Array.from(input) : [input];
    }
    else if (typeof input === 'object') {
        result = useValues ? Object.values(input) : [input];
    }
    else {
        result = [input];
    }
    if (flatten) {
        result = result.flat(Infinity);
    }
    if (dropna) {
        result = result.filter(x => x != null);
    }
    if (unique) {
        result = [...new Set(result)];
    }
    return result;
}
exports.toList = toList;
