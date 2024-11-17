/**
 * Forcefully validate and convert the input into a boolean value.
 *
 * This function attempts to convert various input types to a boolean value.
 * It recognizes common string representations of true and false, as well
 * as numeric values. The conversion is case-insensitive.
 *
 * @param x - The input to be converted to boolean. Can be:
 *   - Boolean: returned as-is
 *   - Number (including complex): converted using JavaScript's bool rules
 *   - String: converted based on common boolean representations
 *   - null or undefined: raises TypeError
 *   - Other types: converted to string and then evaluated
 * @returns The boolean representation of the input.
 * @throws Error if the input cannot be unambiguously converted to a boolean value.
 * @throws TypeError if the input type is unsupported or null/undefined.
 *
 * @example
 * ```typescript
 * validateBoolean(true); // true
 * validateBoolean("yes"); // true
 * validateBoolean("OFF"); // false
 * validateBoolean(1); // true
 * validateBoolean(0); // false
 * validateBoolean(1 + 1j); // true
 * ```
 *
 * @remarks
 * - String matching is case-insensitive
 * - Leading/trailing whitespace is stripped
 * - Numeric values follow JavaScript's Boolean() rules
 * - null or undefined values raise TypeError
 * - Empty strings raise Error
 */
export declare function validateBoolean(x: any): boolean;
