/**
 * Options for code block extraction
 */
interface ExtractOptions {
    returnAsList?: boolean;
    languages?: string[];
    categorize?: boolean;
}

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
 */
export function extractCodeBlock<T extends ExtractOptions>(
    strToParse: string,
    options: T = {} as T
): ExtractReturn<T> {
    const {
        returnAsList = false,
        languages = null,
        categorize = false
    } = options;

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
        };

        const lang = groups.lang || 'plain';
        const code = groups.code || '';

        if (!languages || languages.includes(lang)) {
            if (categorize) {
                if (!codeDict[lang]) {
                    codeDict[lang] = [];
                }
                codeDict[lang].push(code);
            } else {
                codeBlocks.push(code);
            }
        }
    }

    if (categorize) {
        return codeDict as ExtractReturn<T>;
    } else if (returnAsList) {
        return codeBlocks as ExtractReturn<T>;
    } else {
        return codeBlocks.join('\n\n') as ExtractReturn<T>;
    }
}

// Helper type guard
function isExtractOptions(obj: unknown): obj is ExtractOptions {
    return typeof obj === 'object' && 
           obj !== null && 
           !Array.isArray(obj);
}

// Usage examples:
/*
// Simple extraction
const code = extractCodeBlock(markdownText);

// Return as list
const codeList = extractCodeBlock(markdownText, { 
    returnAsList: true 
});

// Filter by language
const pythonCode = extractCodeBlock(markdownText, { 
    languages: ['python'] 
});

// Categorized by language
const codeBylang = extractCodeBlock(markdownText, { 
    categorize: true 
});
*/