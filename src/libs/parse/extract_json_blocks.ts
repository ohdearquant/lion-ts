import { ParseError } from './types';
import { fuzzyParseJson } from './fuzzy_parse_json';
import { toDict } from './to_dict';

interface ExtractJsonBlocksOptions {
    suppress?: boolean;
    fuzzyParse?: boolean;
    dropna?: boolean;
}

interface ExtractJsonBlockOptions {
    language?: string;
    regexPattern?: string | RegExp;
    parser?: (str: string) => any;
    suppress?: boolean;
    fuzzyParse?: boolean;
}

/**
 * Extract and parse JSON blocks from the given text.
 * 
 * @param str_to_parse - The input text containing JSON blocks
 * @param options - Configuration options
 * @returns A list of parsed JSON blocks as dictionaries
 */
export function extractJsonBlocks(
    str_to_parse: string,
    {
        suppress = true,
        fuzzyParse = true,
        dropna = true
    }: ExtractJsonBlocksOptions = {}
): any[] {
    // Handle empty input
    if (!str_to_parse || !str_to_parse.trim()) {
        if (suppress) return [];
        throw new ParseError('No JSON blocks found in input');
    }

    // Extract JSON blocks
    const pattern = /```json\s*(.*?)\s*```/gs;
    const matches = Array.from(str_to_parse.matchAll(pattern)).map(m => m[1]);

    if (matches.length === 0) {
        if (suppress) return [];
        throw new ParseError('No JSON blocks found in input');
    }

    // Parse each block
    const results = matches.map(match => {
        try {
            // First try standard JSON parse
            try {
                return JSON.parse(match);
            } catch {
                // If that fails, check if it's a valid JSON structure
                const trimmed = match.trim();
                if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
                    return {};
                }
                
                // Count braces to check for matching pairs
                let braceCount = 0;
                for (const char of trimmed) {
                    if (char === '{') braceCount++;
                    if (char === '}') braceCount--;
                    if (braceCount < 0) return {}; // Unmatched closing brace
                }
                if (braceCount !== 0) return {}; // Unmatched opening brace

                // Only try fuzzy parsing if the structure looks valid
                if (fuzzyParse) {
                    try {
                        return fuzzyParseJson(match);
                    } catch {
                        return {};
                    }
                }
                return {};
            }
        } catch {
            return {};
        }
    });

    // Filter results if needed
    if (dropna) {
        return results.filter(result => {
            if (result === null || result === undefined) return false;
            if (Array.isArray(result)) return result.length > 0;
            if (typeof result === 'object') {
                // For objects, only filter out null/undefined values
                if (Object.keys(result).length === 0) return true; // Keep empty objects
                return Object.values(result).some(v => v !== null && v !== undefined);
            }
            return true;
        });
    }

    return results;
}

/**
 * Extract and parse a single JSON block from the given text.
 * 
 * @param str_to_parse - The input text containing a JSON block
 * @param options - Configuration options
 * @returns The parsed JSON block, or undefined if no block found and suppress is true
 */
export function extractJsonBlock(
    str_to_parse: string,
    {
        language = 'json',
        regexPattern,
        parser,
        suppress = false,
        fuzzyParse = true
    }: ExtractJsonBlockOptions = {}
): any {
    // Build regex pattern
    let pattern: RegExp;
    if (!regexPattern) {
        // Handle special characters in language tag
        const escapedLang = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(`\`\`\`(?:${escapedLang}|${language})\\s*([\\s\\S]*?)\\s*\`\`\``);
    } else if (regexPattern instanceof RegExp) {
        pattern = regexPattern;
    } else {
        pattern = new RegExp(regexPattern);
    }

    // Extract block
    const match = str_to_parse.match(pattern);
    if (!match) {
        if (suppress) return undefined;
        throw new ParseError('No code block found in input');
    }

    const code_str = match[1].trim();

    // Parse block
    try {
        if (parser) {
            const result = parser(code_str);
            if (!result && !suppress) {
                throw new ParseError('Parser returned null/undefined');
            }
            return result;
        }

        // First try standard JSON parse
        try {
            return JSON.parse(code_str);
        } catch {
            // If that fails, check if it's a valid JSON structure
            if (!code_str.startsWith('{') || !code_str.endsWith('}')) {
                if (suppress) return undefined;
                throw new ParseError('Invalid JSON structure');
            }

            // Count braces to check for matching pairs
            let braceCount = 0;
            for (const char of code_str) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                if (braceCount < 0) {
                    if (suppress) return undefined;
                    throw new ParseError('Unmatched closing brace');
                }
            }
            if (braceCount !== 0) {
                if (suppress) return undefined;
                throw new ParseError('Unmatched opening brace');
            }

            // Only try fuzzy parsing if the structure looks valid
            if (fuzzyParse) {
                try {
                    return fuzzyParseJson(code_str);
                } catch (error) {
                    if (suppress) return undefined;
                    throw error;
                }
            }

            if (suppress) return undefined;
            throw new ParseError('Failed to parse JSON block');
        }
    } catch (error) {
        if (suppress) return undefined;
        throw error;
    }
}
