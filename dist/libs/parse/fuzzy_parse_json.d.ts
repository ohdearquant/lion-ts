/**
 * Parse a JSON string with automatic fixing of common formatting issues.
 *
 * @param strToParse - The JSON string to parse
 * @returns Parsed JSON object
 * @throws Error if parsing fails after all fixing attempts
 */
export declare function fuzzyParseJson(strToParse: string): Record<string, unknown> | Array<Record<string, unknown>>;
