import { toDict } from './to_dict';
import { fuzzyParseJson } from './fuzzy_parse_json';
import { ParseError } from './types';

/**
 * Options for JSON block extraction
 */
interface JsonBlockOptions {
    /** Whether to suppress errors */
    suppress?: boolean;
    /** Whether to use fuzzy parsing */
    fuzzyParse?: boolean;
    /** Whether to drop null/undefined values */
    dropna?: boolean;
}

/**
 * Options for code block extraction
 */
interface ExtractBlockOptions {
    /** Language identifier to match */
    language?: string;
    /** Custom regex pattern */
    regexPattern?: string;
    /** Custom parser function */
    parser?: (str: string) => any;
    /** Whether to suppress errors */
    suppress?: boolean;
}

/**
 * Extract and parse JSON blocks from markdown-style text
 * 
 * @param input - Input text containing JSON blocks
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
    input: string,
    options: JsonBlockOptions = {}
): any[] {
    const {
        suppress = false,
        fuzzyParse = true,
        dropna = false
    } = options;

    try {
        // Match code blocks with optional json language identifier
        const pattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
        const matches = Array.from(input.matchAll(pattern));

        if (matches.length === 0) {
            if (suppress) return [];
            throw new ParseError('No JSON blocks found in input');
        }

        const results = matches.map(match => {
            const content = match[1].trim();
            if (!content) {
                return dropna ? undefined : {};
            }

            try {
                return fuzzyParse ? fuzzyParseJson(content) : JSON.parse(content);
            } catch (error) {
                if (suppress) {
                    return dropna ? undefined : {};
                }
                throw error;
            }
        });

        return dropna ? results.filter(r => r !== undefined) : results;
    } catch (error) {
        if (suppress) {
            return [];
        }
        throw error instanceof ParseError ? error : new ParseError(
            `Failed to extract JSON blocks: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Extract and parse a code block from markdown-style text
 * 
 * @param input - Input text containing code block
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
 * const block = extractBlock(text);
 * // { key: "value" }
 * ```
 */
export function extractBlock(
    input: string,
    options: ExtractBlockOptions = {}
): any {
    const {
        language = '',
        regexPattern,
        parser,
        suppress = false
    } = options;

    try {
        // Escape special characters in language identifier
        const escapedLang = language.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Build regex pattern
        const pattern = regexPattern || 
            (language ? 
                `\`\`\`${escapedLang}\\s*\\n([\\s\\S]*?)\\n\`\`\`` : 
                '```(?:\\w*)\\s*\\n([\\s\\S]*?)\\n```');

        const match = new RegExp(pattern, 'i').exec(input);
        if (!match) {
            if (suppress) return undefined;
            throw new ParseError('No code block found in the input string.');
        }

        const content = match[1].trim();
        if (!content) {
            return {};
        }

        try {
            if (parser) {
                return parser(content);
            }
            return JSON.parse(content);
        } catch (error) {
            if (suppress) return undefined;
            throw error;
        }
    } catch (error) {
        if (suppress) return undefined;
        throw error instanceof ParseError ? error : new ParseError(String(error));
    }
}

/**
 * Extract and parse a single JSON block
 * 
 * @param input - Input text containing JSON block
 * @param options - Extraction options
 * @returns Parsed JSON object
 * @throws ParseError if no JSON block found and suppress is false
 * 
 * @example
 * ```typescript
 * const text = `
 * \`\`\`json
 * { "key": "value" }
 * \`\`\`
 * `;
 * 
 * const block = extractJsonBlock(text);
 * // { key: "value" }
 * ```
 */
export function extractJsonBlock(
    input: string,
    options: JsonBlockOptions = {}
): any {
    const blocks = extractJsonBlocks(input, options);
    return blocks.length > 0 ? blocks[0] : (options.suppress ? undefined : {});
}
