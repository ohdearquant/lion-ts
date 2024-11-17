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
export declare function extractJsonBlocks(strToParse: string, options?: ExtractOptions): Record<string, any>[];
/**
 * Extract and parse a code block from the given string.
 *
 * @param strToParse - Input string containing code block
 * @param options - Extraction options
 * @returns Parsed content of the code block
 * @throws Error if no code block found and suppress is false
 */
export declare function extractBlock<T = Record<string, any>>(strToParse: string, options?: BlockOptions<T>): T | null;
export {};
