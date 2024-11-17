import { type Undefined, type NumTypes } from '../../constants';

/**
 * Type for numeric types that can be validated
 */
export type ValidNumericType = 
  | 'int' 
  | 'float' 
  | 'complex' 
  | NumberConstructor;

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
 * Type for dictionary with string keys
 */
export type StringKeyedDict = Record<string, any>;

/**
 * Type for a value that can be converted to a number
 */
export type Numeric = number | string | boolean | { valueOf(): number };

/**
 * Result of number extraction
 */
export type NumberMatch = [string, string];

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
