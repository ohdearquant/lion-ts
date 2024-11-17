/**
 * Type for numeric types that can be validated
 */
export type ValidNumericType = 'int' | 'float' | 'complex';
/**
 * Complex number class
 */
export declare class Complex {
    real: number;
    imag: number;
    constructor(real: number, imag: number);
    toString(): string;
}
/**
 * Options for converting to dictionary
 */
export interface ToDictOptions {
    useDictDump?: boolean;
    fuzzyParse?: boolean;
    recursive?: boolean;
    recursivePythonOnly?: boolean;
    maxRecursiveDepth?: number;
    suppress?: boolean;
    strType?: 'json' | 'xml' | null;
    parser?: (input: string) => Record<string, any>;
    excludeTypes?: any[];
}
/**
 * Options for readable JSON conversion
 */
export interface ReadableJsonOptions {
    indent?: number;
    ensureAscii?: boolean;
    useDictDump?: boolean;
    fuzzyParse?: boolean;
    recursive?: boolean;
    recursivePythonOnly?: boolean;
    maxRecursiveDepth?: number;
}
/**
 * Options for list conversion
 */
export interface ToListOptions {
    flatten?: boolean;
    dropna?: boolean;
    unique?: boolean;
    useValues?: boolean;
}
/**
 * Options for number parsing
 */
export interface NumberParseOptions {
    upperBound?: number;
    lowerBound?: number;
    numType?: ValidNumericType;
    precision?: number;
    numCount?: number;
}
/**
 * XML Parser Options
 */
export interface XmlParserOptions {
    explicitArray?: boolean;
    mergeAttrs?: boolean;
    removeRoot?: boolean;
    rootTag?: string;
    suppress?: boolean;
}
/**
 * Type for dictionary with string keys
 */
export type StringKeyedDict = Record<string, any>;
/**
 * Type for a value that can be converted to a number
 */
export type Numeric = number | string | boolean | {
    valueOf(): number;
};
/**
 * Result of number extraction
 */
export type NumberMatch = [string, string];
/**
 * Common error types
 */
export declare class ParseError extends Error {
    constructor(message: string);
}
export declare class ValidationError extends Error {
    constructor(message: string);
}
export declare class ConversionError extends Error {
    constructor(message: string);
}
/**
 * Type for mapping validation
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
/**
 * Type for key validation options
 */
export interface KeyValidationOptions {
    required?: string[];
    optional?: string[];
    allowExtra?: boolean;
}
/**
 * Custom error for value-related errors
 */
export declare class ValueError extends Error {
    constructor(message: string);
}
