import { ValueError, TypeError as CustomTypeError } from '../errors';
import { TRUE_VALUES, FALSE_VALUES } from '../../constants/parse';

/**
 * Convert various input types to boolean.
 * 
 * @param input - Value to convert to boolean
 * @returns Boolean value
 * @throws TypeError if input cannot be converted to boolean
 * @throws ValueError if input string is not a valid boolean value
 * 
 * @example
 * ```typescript
 * validateBoolean(true) // true
 * validateBoolean('yes') // true
 * validateBoolean('false') // false
 * validateBoolean(1) // true
 * validateBoolean(0) // false
 * ```
 */
export function validateBoolean(input: any): boolean {
    // Handle null/undefined
    if (input === null || input === undefined) {
        throw new CustomTypeError('Cannot convert null or undefined to boolean');
    }

    // Handle boolean values
    if (typeof input === 'boolean') {
        return input;
    }

    // Handle numeric values
    if (typeof input === 'number') {
        return Boolean(input);
    }

    // Handle string values
    if (typeof input === 'string') {
        // Clean and normalize the string
        const strValue = input.trim()
            .toLowerCase()
            // Remove special characters and punctuation, keeping alphanumeric and basic symbols
            .replace(/[^a-z0-9\-\/]/g, '');

        if (!strValue) {
            throw new ValueError('Cannot convert empty string to boolean');
        }

        // Check for true values
        if (TRUE_VALUES.has(strValue)) {
            return true;
        }

        // Check for false values
        if (FALSE_VALUES.has(strValue)) {
            return false;
        }

        // Try numeric conversion
        const num = Number(strValue);
        if (!isNaN(num)) {
            return Boolean(num);
        }

        throw new ValueError(
            `Cannot convert string '${input}' to boolean. ` +
            `Valid true values are: ${Array.from(TRUE_VALUES).join(', ')}. ` +
            `Valid false values are: ${Array.from(FALSE_VALUES).join(', ')}.`
        );
    }

    // Handle objects with custom boolean conversion
    if (typeof input === 'object' && input !== null) {
        // Handle arrays
        if (Array.isArray(input)) {
            throw new TypeError();
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

    // If we get here, the type is not supported
    throw new TypeError();
}
