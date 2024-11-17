/**
 * Supported docstring styles
 */
type DocStyle = 'google' | 'rest';
/**
 * Extract function description and parameter descriptions from docstring.
 *
 * @param func - Function to extract docstring from
 * @param style - Docstring style ('google' or 'rest')
 * @returns Tuple of description and parameter descriptions
 * @throws Error if unsupported style provided
 */
export declare function extractDocstring(func: Function, style?: DocStyle): [string | null, Record<string, string>];
export {};
