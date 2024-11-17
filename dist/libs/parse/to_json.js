"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonUtils = exports.toJson = void 0;
/**
 * Extract and parse JSON content from a string or markdown code blocks
 *
 * @param input - Input string or array of strings to parse
 * @param options - Parsing options
 * @returns Parsed JSON object(s) or empty array if no valid JSON found
 */
function toJson(input, options = {}) {
    const { fuzzyParse = false } = options;
    // Handle array input
    const inputStr = Array.isArray(input) ? input.join('\n') : input;
    // Try direct JSON parsing first
    try {
        if (fuzzyParse) {
            return fuzzyParseJson(inputStr);
        }
        return JSON.parse(inputStr);
    }
    catch {
        // Continue to code block extraction
    }
    // Extract JSON from markdown code blocks
    const jsonBlocks = extractJsonBlocks(inputStr);
    if (jsonBlocks.length === 0) {
        return [];
    }
    if (jsonBlocks.length === 1) {
        try {
            return fuzzyParse ?
                fuzzyParseJson(jsonBlocks[0]) :
                JSON.parse(jsonBlocks[0]);
        }
        catch (error) {
            if (fuzzyParse) {
                throw error; // Fuzzy parse already failed
            }
            try {
                return fuzzyParseJson(jsonBlocks[0]);
            }
            catch {
                return [];
            }
        }
    }
    // Handle multiple blocks
    return jsonBlocks.map(block => {
        try {
            return fuzzyParse ?
                fuzzyParseJson(block) :
                JSON.parse(block);
        }
        catch (error) {
            if (fuzzyParse) {
                throw error;
            }
            return fuzzyParseJson(block);
        }
    });
}
exports.toJson = toJson;
/**
 * Extract JSON blocks from markdown content
 */
function extractJsonBlocks(content) {
    const pattern = /```json\s*(.*?)\s*```/gs;
    const matches = [];
    let match;
    while ((match = pattern.exec(content)) !== null) {
        const block = match[1].trim();
        if (block) {
            matches.push(block);
        }
    }
    return matches;
}
/**
 * Attempt to parse JSON with fuzzy matching
 */
function fuzzyParseJson(str) {
    // Clean the string
    const cleaned = str
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        // Replace single quotes with double quotes
        .replace(/'/g, '"')
        // Add quotes to unquoted keys
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Remove extra whitespace
        .trim();
    try {
        return JSON.parse(cleaned);
    }
    catch (error) {
        // Try additional fixes
        const furtherCleaned = cleaned
            // Fix missing quotes around values
            .replace(/:\s*([^[{"\d-][^,}\]]*)/g, ':"$1"')
            // Fix undefined/null values
            .replace(/:\s*(undefined|null)\b/g, ':null')
            // Fix boolean values
            .replace(/:\s*(true|false)\b/g, (match, bool) => `:${bool.toLowerCase()}`);
        try {
            return JSON.parse(furtherCleaned);
        }
        catch {
            throw new Error('Failed to parse JSON with fuzzy matching');
        }
    }
}
/**
 * Utility functions for working with extracted JSON
 */
exports.jsonUtils = {
    /**
     * Validate extracted JSON block
     */
    validateJson(str) {
        try {
            JSON.parse(str);
            return true;
        }
        catch {
            return false;
        }
    },
    /**
     * Count JSON blocks in content
     */
    countJsonBlocks(content) {
        return extractJsonBlocks(content).length;
    },
    /**
     * Test if content contains valid JSON blocks
     */
    hasValidJsonBlocks(content) {
        return extractJsonBlocks(content).some(block => exports.jsonUtils.validateJson(block));
    }
};
// Example usage:
/*
const markdown = `
\`\`\`json
{
    "name": "John",
    "age": 30
}
\`\`\`

\`\`\`json
{
    "name": "Jane",
    "age": 25
}
\`\`\`
`;

const json = toJson(markdown);
console.log(json);  // Array of parsed JSON objects

const singleJson = '{"key": "value"}';
const parsed = toJson(singleJson);
console.log(parsed);  // Single parsed JSON object
*/ 
