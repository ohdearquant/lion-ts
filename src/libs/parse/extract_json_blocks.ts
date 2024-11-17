/**
 * Options for JSON block extraction
 */
interface ExtractOptions {
    suppress?: boolean;
    fuzzyParse?: boolean;
    dropna?: boolean;
}

/**
 * Options for single block extraction
 */
interface BlockOptions<T> {
    language?: string;
    regexPattern?: string;
    parser?: (str: string) => T;
    suppress?: boolean;
}

/**
 * Extract and parse JSON blocks from the given text.
 * 
 * @param strToParse - Input text containing JSON blocks
 * @param options - Extraction options
 * @returns Array of parsed JSON objects
 */
export function extractJsonBlocks(
    strToParse: string,
    options: ExtractOptions = {}
): Record<string, any>[] {
    const {
        suppress = true,
        fuzzyParse = true,
        dropna = true
    } = options;

    const pattern = /```json\s*(.*?)\s*```/gs;
    const matches = [...strToParse.matchAll(pattern)];
    
    const jsonBlocks = matches.map(match => {
        try {
            return toDict(match[1], { fuzzyParse, suppress });
        } catch (error) {
            if (suppress) return null;
            throw error;
        }
    });

    return dropna 
        ? jsonBlocks.filter(block => block != null) 
        : jsonBlocks;
}

/**
 * Extract and parse a code block from the given string.
 * 
 * @param strToParse - Input string containing code block
 * @param options - Extraction options
 * @returns Parsed content of the code block
 * @throws Error if no code block found and suppress is false
 */
export function extractBlock<T = Record<string, any>>(
    strToParse: string,
    options: BlockOptions<T> = {}
): T | null {
    const {
        language = 'json',
        regexPattern,
        parser,
        suppress = false
    } = options;

    const pattern = regexPattern || 
        (language ? `\`\`\`${language}\\n?(.*?)\\n?\`\`\`` : '```\\n?(.*?)\\n?```');
    
    let codeStr: string | null = null;
    
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
        return null;
    } else {
        throw new Error('No code block found in the input string.');
    }

    // Parse the extracted code
    try {
        const parseFunc = parser || 
            ((str: string) => toDict(str, { fuzzyParse: true, suppress: true }));
        return parseFunc(codeStr) as T;
    } catch (error) {
        if (suppress) return null;
        throw error;
    }
}

/**
 * Convert string to dictionary with fuzzy parsing
 */
function toDict(
    str: string, 
    options: { fuzzyParse?: boolean; suppress?: boolean } = {}
): Record<string, any> | null {
    const { fuzzyParse = true, suppress = true } = options;

    try {
        // Remove common issues
        const cleanStr = fuzzyParse ? cleanJsonString(str) : str;
        return JSON.parse(cleanStr);
    } catch (error) {
        if (suppress) return null;
        throw error;
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

// Example usage:
/*
const text = `
\`\`\`json
{
    "key": "value",
    "number": 42
}
\`\`\`
`;

// Extract all JSON blocks
const blocks = extractJsonBlocks(text);

// Extract single block with custom parser
const block = extractBlock(text, {
    language: 'json',
    parser: (str) => JSON.parse(str)
});
*/