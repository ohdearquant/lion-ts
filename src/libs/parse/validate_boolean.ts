import { ValueError, TypeError as CustomTypeError } from '../errors';
import { TRUE_VALUES, FALSE_VALUES } from '../../constants/parse';

/**
 * Forcefully validate and convert the input into a boolean value.
 * 
 * This function attempts to convert various input types to a boolean value.
 * It recognizes common string representations of true and false, as well
 * as numeric values. The conversion is case-insensitive.
 * 
 * @param input - Value to convert to boolean. Can be:
 *   - Boolean: returned as-is
 *   - Number (including complex): converted using Python's bool rules
 *   - String: converted based on common boolean representations
 *   - None: raises TypeError
 *   - Other types: converted to string and then evaluated
 * 
 * @returns Boolean value
 * @throws TypeError if input cannot be converted to boolean
 * @throws ValueError if input string is not a valid boolean value
 * 
 * @example
 * ```typescript
 * validateBoolean(true)      // true
 * validateBoolean('yes')     // true
 * validateBoolean('OFF')     // false
 * validateBoolean(1)         // true
 * validateBoolean(0)         // false
 * ```
 */
export function validateBoolean(input: any): boolean {
    // Handle null/undefined
    if (input === null || input === undefined) {
        throw new CustomTypeError('Cannot convert None to boolean');
    }

    // Handle boolean values
    if (typeof input === 'boolean') {
        return input;
    }

    // Handle numeric values (including complex numbers)
    if (typeof input === 'number') {
        return Boolean(input);
    }

    // Handle string values
    if (typeof input === 'string') {
        const strValue = input.trim().toLowerCase();

        if (!strValue) {
            throw new ValueError('Cannot convert empty string to boolean');
        }

        // Clean string by removing special characters
        const cleanValue = strValue.replace(/[^a-z0-9\+\-j\/]/g, '');

        // Check for true values
        if (TRUE_VALUES.has(cleanValue)) {
            return true;
        }

        // Check for false values
        if (FALSE_VALUES.has(cleanValue)) {
            return false;
        }

        // Try numeric conversion as a last resort
        try {
            // Check for complex number notation
            if (cleanValue.includes('j')) {
                // Handle special cases first
                if (cleanValue === '0j') return false;
                if (cleanValue === 'j') return true;
                if (cleanValue === '+j') return true;
                if (cleanValue === '-j') return true;

                // Parse complex number string
                const match = cleanValue.match(/^([-+]?\d*\.?\d*)([-+]?\d*\.?\d*)j$/);
                if (match) {
                    const real = parseFloat(match[1] || '0');
                    const imag = parseFloat(match[2] || '1');
                    // In Python, a complex number is false only if both real and imaginary parts are 0
                    return real !== 0 || imag !== 0;
                }
            }

            // Try regular number conversion
            const num = parseFloat(cleanValue);
            if (!isNaN(num)) {
                return Boolean(num);
            }

            // If we get here, the string is invalid
            throw new ValueError(
                `Cannot convert '${input}' to boolean. ` +
                `Valid true values are: ${Array.from(TRUE_VALUES).sort().join(', ')}, ` +
                `valid false values are: ${Array.from(FALSE_VALUES).sort().join(', ')}`
            );
        } catch (e) {
            if (e instanceof ValueError) {
                throw e;
            }
            // If numeric conversion fails, throw ValueError with valid values
            throw new ValueError(
                `Cannot convert '${input}' to boolean. ` +
                `Valid true values are: ${Array.from(TRUE_VALUES).sort().join(', ')}, ` +
                `valid false values are: ${Array.from(FALSE_VALUES).sort().join(', ')}`
            );
        }
    }

    // Handle objects with custom boolean conversion
    if (typeof input === 'object' && input !== null) {
        // Handle arrays - always throw TypeError like Python
        if (Array.isArray(input)) {
            throw new CustomTypeError('Cannot convert array to boolean');
        }

        // Try valueOf() method
        if (typeof input.valueOf === 'function') {
            try {
                const value = input.valueOf();
                if (typeof value === 'boolean') {
                    return value;
                }
                if (typeof value === 'number') {
                    return Boolean(value);
                }
                if (typeof value === 'string' && value !== input.toString()) {
                    return validateBoolean(value);
                }
            } catch {
                // Ignore conversion errors and continue
            }
        }

        // Try toString() method
        if (typeof input.toString === 'function') {
            try {
                const str = input.toString();
                if (str !== '[object Object]') {
                    return validateBoolean(str);
                }
            } catch {
                // Ignore conversion errors and continue
            }
        }
    }

    throw new CustomTypeError(`Cannot convert ${typeof input} to boolean`);
}
