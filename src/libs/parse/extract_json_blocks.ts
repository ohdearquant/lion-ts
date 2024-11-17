import { toDict } from './to_dict';
import { ParseError, JsonBlockOptions, ExtractOptions } from './types';

/**
 * Options for single block extraction
 */
interface BlockOptions<T> extends ExtractOptions {
    regexPattern?: string;
    parser?: (str: string) => T;
}

/**
 * Extract and parse JSON blocks from the given text.
 * 
 * @param strToParse - Input text containing JSON blocks
 * @param options - Extraction options
 * @returns Array of parsed JSON objects
 * @throws ParseError if parsing fails and suppress is false
 * 
 * @example
 * ```typescript
 * const text = `
 * Some text
 * \`\`\`json
 * {
 *   "key": "value"
 * }
 * \`\`\`
 * More text
 * `;
 * 
 * const blocks = extractJsonBlocks(text);
 * // [{ key: "value" }]
 * ```
 */
export function extractJsonBlocks(
    strToParse: string,
    options: JsonBlockOptions = {}
): Record<string, any>[] {
    const {
        suppress = true,
        fuzzyParse = true,
        dropna = true
    } = options;

    try {
        const pattern = /```json\s*(.*?)\s*```/gs;
        const matches = [...strToParse.matchAll(pattern)];
        
        const jsonBlocks = matches.map(match => {
            try {
                return toDict(match[1], { fuzzyParse, suppress });
            } catch (error) {
                if (suppress) return undefined;
                throw error;
            }
        });

        return dropna 
            ? jsonBlocks.filter((block): block is Record<string, any> => block != null)
            : jsonBlocks as Record<string, any>[];
    } catch (error) {
        if (suppress) {
            return [];
        }
        throw new ParseError(
            `Failed to extract JSON blocks: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Extract and parse a code block from the given string.
 * 
 * @param strToParse - Input string containing code block
 * @param options - Extraction options
 * @returns Parsed content of the code block
 * @throws ParseError if no code block found and suppress is false
 * 
 * @example
 * ```typescript
 * const text = `
 * \`\`\`json
 * { "key": "value" }
 * \`\`\`
 * `;
 * 
 * const block = extractBlock(text, {
 *     language: 'json',
 *     parser: JSON.parse
 * });
 * // { key: "value" }
 * ```
 */
export function extractBlock<T = Record<string, any>>(
    strToParse: string,
    options: BlockOptions<T> = {}
): T | undefined {
    const {
        language = 'json',
        regexPattern,
        parser,
        suppress = false
    } = options;

    try {
        const pattern = regexPattern || 
            (language ? `\`\`\`${language}\\n?(.*?)\\n?\`\`\`` : '```\\n?(.*?)\\n?```');
        
        let codeStr: string | undefined;
        
        // Try regex match first
        const match = new RegExp(pattern, 's').exec(strToParse);
        if (match) {
            codeStr = match[1].trim();
        } 
        // Try direct match
        else if (strToParse.startsWith(`\`\`\`${language}\n`) && 
                 strToParse.endsWith('\n```')) {
            codeStr = strToParse
                .slice(4 + language.length, -4)
                .trim();
        }
        // Handle no match
        else if (suppress) {
            return undefined;
        } else {
            throw new ParseError('No code block found in the input string.');
        }

        // Parse the extracted code
        try {
            const parseFunc = parser || 
                ((str: string) => toDict(str, { fuzzyParse: true, suppress: true }));
            return parseFunc(codeStr) as T;
        } catch (error) {
            if (suppress) return undefined;
            throw new ParseError(
                `Failed to parse code block: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    } catch (error) {
        if (suppress) return undefined;
        throw error instanceof ParseError ? error : new ParseError(String(error));
    }
}

/**
 * Clean JSON string for fuzzy parsing
 */
function cleanJsonString(str: string): string {
    // Remove comments
    str = str.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    // Fix common issues
    str = str
        // Fix missing quotes on properties
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
        // Fix single quotes
        .replace(/'/g, '"')
        // Fix trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Remove extra whitespace
        .trim();
    
    return str;
}
