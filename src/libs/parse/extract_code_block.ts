import { ExtractOptions, ParseError } from './types';

/**
 * Return type definition based on options
 */
type ExtractReturn<T extends ExtractOptions> = T extends { categorize: true }
    ? Record<string, string[]>
    : T extends { returnAsList: true }
    ? string[]
    : string;

/**
 * Extract code blocks from a given string containing Markdown-formatted text.
 * 
 * @param strToParse - The input string containing Markdown code blocks
 * @param options - Extraction options
 * @returns Extracted code blocks in specified format
 * @throws ParseError if extraction fails and suppress is false
 * 
 * @example
 * ```typescript
 * // Simple extraction
 * const code = extractCodeBlock(markdownText);
 * 
 * // Return as list
 * const codeList = extractCodeBlock(markdownText, { 
 *     returnAsList: true 
 * });
 * 
 * // Filter by language
 * const pythonCode = extractCodeBlock(markdownText, { 
 *     languages: ['python'] 
 * });
 * 
 * // Categorized by language
 * const codeByLang = extractCodeBlock(markdownText, { 
 *     categorize: true 
 * });
 * ```
 */
export function extractCodeBlock<T extends ExtractOptions>(
    strToParse: string,
    options: T = {} as T
): ExtractReturn<T> {
    const {
        returnAsList = false,
        languages = undefined,
        categorize = false,
        suppress = false
    } = options;

    try {
        const codeBlocks: string[] = [];
        const codeDict: Record<string, string[]> = {};

        // Create regex pattern for code blocks
        const pattern = new RegExp(
            '^(?<fence>```|~~~)[ \\t]*' +     // Opening fence ``` or ~~~
            '(?<lang>[\\w+-]*)[ \\t]*\\n' +   // Optional language identifier
            '(?<code>.*?)(?<=\\n)' +          // Code content
            '^\\1[ \\t]*$',                   // Closing fence matching opening
            'gms'                             // Flags: global, multiline, dot-all
        );

        let match: RegExpExecArray | null;
        while ((match = pattern.exec(strToParse)) !== null) {
            // Extract named groups
            const groups = match.groups as {
                lang?: string;
                code?: string;
            } | undefined;

            if (!groups) continue;

            const lang = groups.lang || 'plain';
            const code = groups.code || '';

            // Skip if language filter is active and language doesn't match
            if (languages && !languages.includes(lang)) {
                continue;
            }

            if (categorize) {
                if (!codeDict[lang]) {
                    codeDict[lang] = [];
                }
                codeDict[lang].push(code.trim());
            } else {
                codeBlocks.push(code.trim());
            }
        }

        if (categorize) {
            return codeDict as ExtractReturn<T>;
        }
        
        if (returnAsList) {
            return codeBlocks as ExtractReturn<T>;
        }
        
        return codeBlocks.join('\n\n') as ExtractReturn<T>;
    } catch (error) {
        if (suppress) {
            return (categorize ? {} : returnAsList ? [] : '') as ExtractReturn<T>;
        }
        throw new ParseError(
            `Failed to extract code blocks: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * Type guard for extract options
 */
function isExtractOptions(obj: unknown): obj is ExtractOptions {
    return typeof obj === 'object' && 
           obj !== null && 
           !Array.isArray(obj);
}

/**
 * Type guard for categorized result
 */
function isCategorizedResult(
    value: unknown
): value is Record<string, string[]> {
    return typeof value === 'object' && 
           value !== null && 
           !Array.isArray(value) &&
           Object.values(value).every(Array.isArray);
}
