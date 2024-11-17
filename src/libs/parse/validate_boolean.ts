import { TRUE_VALUES, FALSE_VALUES } from '../../constants';

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
export function validateBoolean(x: any): boolean {
  if (x === null || x === undefined) {
    throw new TypeError("Cannot convert null or undefined to boolean");
  }

  if (typeof x === 'boolean') {
    return x;
  }

  // Handle all numeric types using JavaScript's Boolean
  if (typeof x === 'number') {
    return Boolean(x);
  }

  // Convert to string if not already a string
  if (typeof x !== 'string') {
    try {
      x = String(x);
    } catch (e) {
      throw new TypeError(`Cannot convert ${typeof x} to boolean: ${e}`);
    }
  }

  // Handle string inputs
  const xCleaned = x.trim().toLowerCase();

  if (!xCleaned) {
    throw new Error("Cannot convert empty string to boolean");
  }

  if (TRUE_VALUES.has(xCleaned)) {
    return true;
  }

  if (FALSE_VALUES.has(xCleaned)) {
    return false;
  }

  // Try numeric conversion as a last resort
  try {
    return Boolean(parseFloat(xCleaned));
  } catch {
    throw new Error(
      `Cannot convert '${x}' to boolean. Valid true values are: ${[...TRUE_VALUES]}, ` +
      `valid false values are: ${[...FALSE_VALUES]}`
    );
  }
}
