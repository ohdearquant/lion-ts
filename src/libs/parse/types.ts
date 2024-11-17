import { type NumTypes } from '../../constants';

/**
 * Common numeric types that can be validated
 */
export type ValidNumericType = 'int' | 'float' | 'complex';

/**
 * Complex number representation
 */
export class Complex {
    constructor(public real: number, public imag: number) {}
    
    toString(): string {
        return `${this.real}${this.imag >= 0 ? '+' : ''}${this.imag}j`;
    }
}

/**
 * Base options for data conversion
 */
export interface BaseOptions {
    suppress?: boolean;
}

/**
 * Options for converting to dictionary
 */
export interface ToDictOptions extends BaseOptions {
    useDictDump?: boolean;
    fuzzyParse?: boolean;
    recursive?: boolean;
    recursivePythonOnly?: boolean;
    maxRecursiveDepth?: number;
    strType?: 'json' | 'xml' | null;
    parser?: (input: string) => Record<string, any>;
    excludeTypes?: any[];
}

/**
 * Options for JSON conversion
 */
export interface JsonOptions extends BaseOptions {
    fuzzyParse?: boolean;
    indent?: number;
    ensureAscii?: boolean;
}

/**
 * Options for readable JSON conversion
 */
export interface ReadableJsonOptions extends JsonOptions {
    useDictDump?: boolean;
    recursive?: boolean;
    recursivePythonOnly?: boolean;
    maxRecursiveDepth?: number;
}

/**
 * Options for list conversion
 */
export interface ToListOptions extends BaseOptions {
    flatten?: boolean;
    dropna?: boolean;
    unique?: boolean;
    useValues?: boolean;
}

/**
 * Options for number parsing
 */
export interface NumberParseOptions extends BaseOptions {
    upperBound?: number;
    lowerBound?: number;
    numType?: ValidNumericType;
    precision?: number;
    numCount?: number;
}

/**
 * Options for XML parsing
 */
export interface XmlParserOptions extends BaseOptions {
    explicitArray?: boolean;
    mergeAttrs?: boolean;
    removeRoot?: boolean;
    rootTag?: string;
}

/**
 * JSON Schema related types
 */
export type JsonSchemaType = 'string' | 'number' | 'integer' | 'boolean' |
                           'array' | 'object' | 'null' | 'any';

export interface JsonSchema {
    type: JsonSchemaType;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema | JsonSchema[];
    oneOf?: JsonSchema[];
    required?: string[];
    enum?: any[];
    description?: string;
    default?: any;
    [key: string]: any;
}

/**
 * Common type aliases
 */
export type StringKeyedDict = Record<string, any>;
export type Numeric = number | string | boolean | { valueOf(): number };
export type NumberMatch = [string, string];

/**
 * Error classes
 */
export class ParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ParseError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class ConversionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ConversionError';
    }
}

export class ValueError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValueError';
    }
}

/**
 * Validation related types
 */
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export interface KeyValidationOptions extends BaseOptions {
    required?: string[];
    optional?: string[];
    allowExtra?: boolean;
}

/**
 * String conversion types
 */
export type SerializeFormat = 'json' | 'xml';

export interface SerializeOptions extends BaseOptions {
    stripLower?: boolean;
    chars?: string | null;
    strType?: SerializeFormat | null;
    useModelDump?: boolean;
    strParser?: (input: string) => Record<string, any>;
    parserKwargs?: Record<string, any>;
    indent?: number;
    rootTag?: string;
}

/**
 * Block extraction types
 */
export interface ExtractOptions extends BaseOptions {
    returnAsList?: boolean;
    categorize?: boolean;
    language?: string;
    languages?: string[];
}

/**
 * JSON block extraction options
 */
export interface JsonBlockOptions extends ExtractOptions {
    fuzzyParse?: boolean;
    dropna?: boolean;
}

/**
 * Documentation types
 */
export type DocStyle = 'google' | 'rest';

export interface DocstringSection {
    examples: string[];
    notes: string[];
    references: string[];
}

export interface DocstringResult extends DocstringSection {
    description: string | undefined;
    params: Record<string, string>;
    returns: string | undefined;
    raises: Record<string, string>;
}
