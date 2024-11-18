import { ParseError } from './types';
import { fuzzyParseJson } from './fuzzy_parse_json';

/**
 * Options for JSON extraction
 */
interface JsonOptions {
    fuzzyParse?: boolean;
}

/**
 * Extract and parse JSON content from a string or markdown code blocks
 * 
 * @param input - Input string or array of strings to parse
 * @param options - Parsing options
 * @returns Parsed JSON object(s) or empty array if no valid JSON found
 */
export function toJson(
    input: string | string[],
    options: JsonOptions = {}
): Record<string, unknown> | Array<Record<string, unknown>> {
    const { fuzzyParse = false } = options;
    
    // Handle array input
    const inputStr = Array.isArray(input) ? input.join('\n') : input;

    if (!inputStr.trim()) {
        return [];
    }
    
    // Try direct parsing first
    try {
        if (fuzzyParse) {
            return fuzzyParseJson(inputStr);
        }
        return JSON.parse(inputStr);
    } catch (error) {
        if (fuzzyParse) {
            throw error;
        }
        // Continue to code block extraction
    }
    
    // Extract JSON from markdown code blocks
    const jsonBlocks = extractJsonBlocks(inputStr);
    
    if (jsonBlocks.length === 0) {
        return [];
    }
    
    if (jsonBlocks.length === 1) {
        try {
            if (fuzzyParse) {
                return fuzzyParseJson(jsonBlocks[0]);
            }
            return JSON.parse(jsonBlocks[0]);
        } catch (error) {
            if (fuzzyParse) {
                throw error;
            }
            return {};
        }
    }
    
    // Handle multiple blocks
    return jsonBlocks.map(block => {
        try {
            if (fuzzyParse) {
                return fuzzyParseJson(block);
            }
            return JSON.parse(block);
        } catch (error) {
            if (fuzzyParse) {
                throw error;
            }
            return {};
        }
    });
}

/**
 * Extract JSON blocks from markdown content
 */
function extractJsonBlocks(content: string): string[] {
    const pattern = /```json\s*(.*?)\s*```/gs;
    const matches: string[] = [];
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
 * Utility functions for working with extracted JSON
 */
export const jsonUtils = {
    /**
     * Validate extracted JSON block
     */
    validateJson(str: string): boolean {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Count JSON blocks in content
     */
    countJsonBlocks(content: string): number {
        return extractJsonBlocks(content).length;
    },

    /**
     * Test if content contains valid JSON blocks
     */
    hasValidJsonBlocks(content: string): boolean {
        return extractJsonBlocks(content).some(block => 
            jsonUtils.validateJson(block)
        );
    }
};
