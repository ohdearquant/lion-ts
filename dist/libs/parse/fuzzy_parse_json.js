"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuzzyParseJson = void 0;
/**
 * Parse a JSON string with automatic fixing of common formatting issues.
 *
 * @param strToParse - The JSON string to parse
 * @returns Parsed JSON object
 * @throws Error if parsing fails after all fixing attempts
 */
function fuzzyParseJson(strToParse) {
    if (typeof strToParse !== 'string') {
        throw new TypeError('Input must be a string');
    }
    if (!strToParse.trim()) {
        throw new Error('Input string is empty');
    }
    // Try direct parsing first
    try {
        const result = JSON.parse(strToParse);
        if (typeof result !== 'object' || result === null) {
            throw new TypeError('Parsed result must be an object or array');
        }
        return result;
    }
    catch {
        // Continue to cleaning stage
    }
    // Try parsing cleaned string
    try {
        const cleaned = cleanJsonString(strToParse);
        const result = JSON.parse(cleaned);
        if (typeof result !== 'object' || result === null) {
            throw new TypeError('Parsed result must be an object or array');
        }
        return result;
    }
    catch {
        // Continue to fixing stage
    }
    // Try parsing fixed string
    try {
        const cleaned = cleanJsonString(strToParse);
        const fixed = fixJsonString(cleaned);
        const result = JSON.parse(fixed);
        if (typeof result !== 'object' || result === null) {
            throw new TypeError('Parsed result must be an object or array');
        }
        return result;
    }
    catch (error) {
        throw new Error(`Failed to parse JSON string after all fixing attempts: ${error}`);
    }
}
exports.fuzzyParseJson = fuzzyParseJson;
/**
 * Clean and standardize a JSON string
 */
function cleanJsonString(s) {
    return s
        // Replace single quotes with double quotes
        .replace(/(?<!\\)'/g, '"')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Add quotes to unquoted keys
        .replace(/([{,])\s*([^"\s]+):/g, '$1"$2":')
        .trim();
}
/**
 * Fix a JSON string by ensuring all brackets are properly closed
 */
function fixJsonString(strToParse) {
    if (!strToParse) {
        throw new Error('Input string is empty');
    }
    const brackets = {
        '{': '}',
        '[': ']'
    };
    const openBrackets = [];
    let pos = 0;
    const length = strToParse.length;
    while (pos < length) {
        const char = strToParse[pos];
        // Handle escape sequences
        if (char === '\\') {
            pos += 2; // Skip escape sequence
            continue;
        }
        // Handle string content
        if (char === '"') {
            pos++;
            // Skip until closing quote, accounting for escapes
            while (pos < length) {
                if (strToParse[pos] === '\\') {
                    pos += 2; // Skip escape sequence
                    continue;
                }
                if (strToParse[pos] === '"') {
                    break;
                }
                pos++;
            }
            pos++;
            continue;
        }
        // Handle brackets
        if (char in brackets) {
            openBrackets.push(brackets[char]);
        }
        else if (Object.values(brackets).includes(char)) {
            if (openBrackets.length === 0) {
                throw new Error(`Extra closing bracket '${char}' at position ${pos}`);
            }
            if (openBrackets[openBrackets.length - 1] !== char) {
                throw new Error(`Mismatched bracket '${char}' at position ${pos}`);
            }
            openBrackets.pop();
        }
        pos++;
    }
    // Add missing closing brackets
    const closingBrackets = openBrackets.reverse().join('');
    return strToParse + closingBrackets;
}
/**
 * Additional utility functions for common JSON fixes
 */
function fixCommonJsonIssues(str) {
    return str
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix missing commas
        .replace(/("[^"]*")\s+"/g, '$1,"')
        // Fix undefined values
        .replace(/:\s*undefined\s*([,}])/g, ':null$1')
        // Fix JavaScript-style comments
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        // Fix NaN and Infinity
        .replace(/:\s*(NaN|-?Infinity)\s*([,}])/g, ':null$1');
}
// Example usage:
/*
const jsonStr = `{
    name: 'John',
    age: 30,
    address: {
        street: "123 Main St",
        city: 'Anytown'
    }
}`;

try {
    const parsed = fuzzyParseJson(jsonStr);
    console.log(parsed);
} catch (error) {
    console.error('Failed to parse JSON:', error);
}
*/ 
