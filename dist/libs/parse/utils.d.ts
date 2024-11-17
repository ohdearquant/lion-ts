import { type ValidNumericType } from '../../constants';
import type { ReadableJsonOptions, ToDictOptions, ToListOptions, StringKeyedDict } from './types';
/**
 * Convert input to a human-readable JSON string
 */
export declare function asReadableJson(input: any, options?: Partial<ReadableJsonOptions>): string;
/**
 * Convert input to readable string with optional markdown formatting
 */
export declare function asReadable(input: any, md?: boolean, options?: Partial<ReadableJsonOptions>): string;
/**
 * Extract code blocks from markdown text
 */
export declare function extractCodeBlock(strToParse: string, returnAsList?: boolean, languages?: string[] | null, categorize?: boolean): string | string[] | Record<string, string[]>;
/**
 * Extract numbers from text using regex patterns
 */
export declare function extractNumbers(text: string): [string, string][];
/**
 * Validate numeric type specification
 */
export declare function validateNumType(numType: ValidNumericType): NumberConstructor;
/**
 * Validate and convert boolean values
 */
export declare function validateBoolean(x: any): boolean;
/**
 * Convert special float values (inf, -inf, nan)
 */
export declare function convertSpecial(value: string): number;
/**
 * Convert percentage string to number
 */
export declare function convertPercentage(value: string): number;
/**
 * Convert fraction string to number
 */
export declare function convertFraction(value: string): number;
/**
 * Basic dictionary conversion
 */
export declare function toDict(input: any, options?: Partial<ToDictOptions>): StringKeyedDict;
/**
 * Convert any input to array
 */
export declare function toList(input: any, options?: Partial<ToListOptions>): any[];
