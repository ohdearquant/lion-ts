import { ParseError } from './types';

/**
 * Parse a JSON string with automatic fixing of common formatting issues.
 * 
 * @param strToParse - The JSON string to parse
 * @returns Parsed JSON object
 * @throws ParseError if parsing fails after all fixing attempts
 */
export function fuzzyParseJson(
    strToParse: string
): Record<string, unknown> | Array<Record<string, unknown>> {
    if (typeof strToParse !== 'string') {
        throw new TypeError('Input must be a string');
    }

    if (!strToParse.trim()) {
        throw new ParseError('Input string is empty');
    }

    // Try direct parsing first
    try {
        const result = JSON.parse(strToParse);
        validateResult(result);
        return result;
    } catch (error) {
        if (error instanceof TypeError) {
            throw error; // Re-throw TypeError for non-object/array results
        }
        // Continue to cleaning stage
    }

    // Clean the string
    const cleaned = cleanJsonString(strToParse);

    // Try parsing cleaned string
    try {
        const result = JSON.parse(cleaned);
        validateResult(result);
        return result;
    } catch (error) {
        if (error instanceof TypeError) {
            throw error; // Re-throw TypeError for non-object/array results
        }
        // Continue to fixing stage
    }

    // Try parsing fixed string
    try {
        // Check for invalid JSON patterns before trying to fix
        if (cleaned.match(/[^\\]:[^:]*:/)) {
            throw new ParseError('Invalid JSON: Multiple colons in a single key-value pair');
        }
        const fixed = fixJsonString(cleaned);
        const result = JSON.parse(fixed);
        validateResult(result);
        return result;
    } catch (error) {
        if (error instanceof TypeError) {
            throw error; // Re-throw TypeError for non-object/array results
        }
        // Try one more time with aggressive fixing
        try {
            const fixed = aggressivelyFixJsonString(cleaned);
            const result = JSON.parse(fixed);
            validateResult(result);
            return result;
        } catch (finalError) {
            if (finalError instanceof TypeError) {
                throw finalError;
            }
            throw new ParseError('Failed to parse JSON with fuzzy matching');
        }
    }
}

/**
 * Clean and standardize a JSON string
 */
function cleanJsonString(s: string): string {
    return s
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
        // Replace single quotes with double quotes
        .replace(/(?<!\\)'/g, '"')
        // Add quotes to unquoted keys
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix missing commas
        .replace(/(["\d\w])\s+"/g, '$1,"')
        // Fix undefined/null values
        .replace(/:\s*(undefined|null)\b/gi, ':null')
        // Fix boolean values
        .replace(/:\s*(true|false)\b/gi, (match, bool) => 
            `:${bool.toLowerCase()}`
        )
        // Fix special numeric values
        .replace(/:\s*(NaN|-?Infinity)\b/g, ':null')
        // Remove extra whitespace
        .trim();
}

/**
 * Fix a JSON string by ensuring all brackets are properly closed
 */
function fixJsonString(strToParse: string): string {
    if (!strToParse) {
        throw new ParseError('Input string is empty');
    }

    const brackets: Record<string, string> = {
        '{': '}',
        '[': ']'
    };
    
    const openBrackets: string[] = [];
    let pos = 0;
    const length = strToParse.length;
    let inString = false;

    while (pos < length) {
        const char = strToParse[pos];

        // Handle escape sequences
        if (char === '\\') {
            pos += 2; // Skip escape sequence
            continue;
        }

        // Handle string content
        if (char === '"') {
            inString = !inString;
            pos++;
            continue;
        }

        if (inString) {
            pos++;
            continue;
        }

        // Handle brackets
        if (char in brackets) {
            openBrackets.push(brackets[char]);
        } else if (Object.values(brackets).includes(char)) {
            if (openBrackets.length === 0) {
                throw new ParseError(
                    `Extra closing bracket '${char}' at position ${pos}`
                );
            }
            if (openBrackets[openBrackets.length - 1] !== char) {
                throw new ParseError(
                    `Mismatched bracket '${char}' at position ${pos}`
                );
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
 * Aggressively fix a JSON string by trying multiple strategies
 */
function aggressivelyFixJsonString(str: string): string {
    // First try to balance brackets
    const brackets: Record<string, string> = {
        '{': '}',
        '[': ']'
    };
    
    const openBrackets: string[] = [];
    let result = str;
    
    // Count open brackets
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        if (char in brackets) {
            openBrackets.push(brackets[char]);
        } else if (Object.values(brackets).includes(char)) {
            if (openBrackets.length > 0) {
                openBrackets.pop();
            }
        }
    }
    
    // Add missing closing brackets
    if (openBrackets.length > 0) {
        result += openBrackets.reverse().join('');
    }
    
    return result;
}

/**
 * Validate that the parsed result is an object or array of objects
 */
function validateResult(result: unknown): asserts result is Record<string, unknown> | Array<Record<string, unknown>> {
    if (result === null || typeof result !== 'object') {
        throw new TypeError('Parsed result must be an object or array');
    }

    if (Array.isArray(result)) {
        result.forEach((item, index) => {
            if (item === null || typeof item !== 'object' || Array.isArray(item)) {
                throw new TypeError(`Array item at index ${index} must be an object`);
            }
        });
    }
}
