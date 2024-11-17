import { Complex, NumberParseOptions } from './types';
/**
 * Convert input to numeric type(s) with validation
 */
export declare function toNum(input: any, options?: NumberParseOptions): number | Complex | Array<number | Complex>;
