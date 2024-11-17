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
type ExtractReturn<T extends ExtractOptions> = T extends {
    categorize: true;
} ? Record<string, string[]> : T extends {
    returnAsList: true;
} ? string[] : string;
/**
 * Extract code blocks from a given string containing Markdown-formatted text.
 *
 * @param strToParse - The input string containing Markdown code blocks
 * @param options - Extraction options
 * @returns Extracted code blocks in specified format
 */
export declare function extractCodeBlock<T extends ExtractOptions>(strToParse: string, options?: T): ExtractReturn<T>;
export {};
