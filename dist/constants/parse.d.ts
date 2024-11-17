/**
 * Regular expression patterns for number parsing
 */
export declare const PATTERNS: {
    readonly scientific: RegExp;
    readonly complex_sci: RegExp;
    readonly complex: RegExp;
    readonly pure_imaginary: RegExp;
    readonly percentage: RegExp;
    readonly fraction: RegExp;
    readonly decimal: RegExp;
    readonly special: RegExp;
};
/**
 * Type mapping from string to native types
 */
export declare const TYPE_MAP: Record<string, NumberConstructor>;
/**
 * Character mapping for markdown to JSON conversion
 */
export declare const MD_JSON_CHAR_MAP: Record<string, string>;
/**
 * Python to JSON type mapping
 */
export declare const PY_JSON_MAP: Record<string, string>;
/**
 * Values considered as true in boolean conversion
 */
export declare const TRUE_VALUES: Set<string>;
/**
 * Values considered as false in boolean conversion
 */
export declare const FALSE_VALUES: Set<string>;
