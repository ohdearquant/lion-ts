import { Undefined, UNDEFINED } from '../../types/undefined';
import { toDict } from './to_dict';
import { dictToXml } from './xml_parser';
import { SerializeFormat, SerializeOptions, ParseError, StringKeyedDict } from './types';

/**
 * Internal function to serialize input to JSON or XML format
 */
async function serializeAs(
    input: any,
    format: SerializeFormat,
    options: SerializeOptions = {}
): Promise<string> {
    const {
        stripLower = false,
        chars = null,
        strType = null,
        useModelDump = false,
        strParser = undefined,
        parserKwargs = {},
        indent = 2,
        rootTag = 'root',
        suppress = false
    } = options;

    try {
        const dict = toDict(input, {
            useDictDump: useModelDump,
            strType,
            suppress,
            parser: strParser,
            ...parserKwargs
        });

        // Process string if needed
        if (stripLower || chars) {
            const processDict = (obj: any): any => {
                if (typeof obj === 'string') {
                    return processString(obj, stripLower, chars);
                }
                if (Array.isArray(obj)) {
                    return obj.map(processDict);
                }
                if (obj && typeof obj === 'object') {
                    const result: Record<string, any> = {};
                    for (const [key, value] of Object.entries(obj)) {
                        const processedKey = stripLower ? key.toLowerCase() : key;
                        result[processedKey] = processDict(value);
                    }
                    return result;
                }
                return obj;
            };

            const processedDict = processDict(dict);
            return format === 'json' 
                ? JSON.stringify(processedDict, null, stripLower ? 0 : indent)
                : dictToXml(processedDict, rootTag, { pretty: true, indent: ' '.repeat(indent) });
        }

        // Direct conversion
        return format === 'json'
            ? JSON.stringify(dict, null, stripLower ? 0 : indent)
            : dictToXml(dict, rootTag, { pretty: true, indent: ' '.repeat(indent) });
    } catch (error) {
        if (suppress) {
            return '';
        }
        throw new ParseError(
            `Failed to serialize input of ${input?.constructor?.name || typeof input} ` +
            `into <${format}>: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Convert input to its string representation
 */
function toStrType(input: any): string {
    // Handle special cases
    if (input === null || input === undefined || input === UNDEFINED) {
        return '';
    }

    // Handle empty arrays
    if (Array.isArray(input) && input.length === 0) {
        return '';
    }

    // Handle empty plain objects (but not custom objects)
    if (input && typeof input === 'object' && 
        Object.getPrototypeOf(input) === Object.prototype && 
        Object.keys(input).length === 0) {
        return '';
    }

    // Handle non-convertible types
    if (typeof input === 'symbol') {
        throw new ParseError('Cannot convert Symbol to string');
    }

    // Handle binary data
    if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
        try {
            return new TextDecoder().decode(input);
        } catch {
            return '';
        }
    }

    // Handle strings
    if (typeof input === 'string') {
        return input;
    }

    // Handle primitive types
    if (typeof input !== 'object' || input === null) {
        return String(input);
    }

    // Handle arrays
    if (Array.isArray(input)) {
        try {
            return JSON.stringify(input);
        } catch {
            return input.map(item => toStrType(item)).join(',');
        }
    }

    // Handle custom toString
    if (input && typeof input === 'object' && typeof input.toString === 'function') {
        const customToString = input.toString;
        if (customToString !== Object.prototype.toString) {
            try {
                const result = customToString.call(input);
                if (result && result !== '[object Object]') {
                    return result;
                }
            } catch {
                // Fall through to JSON handling
            }
        }
    }

    // Handle objects
    try {
        return JSON.stringify(input);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('circular')) {
                throw new ParseError('Cannot convert circular structure to string');
            }
            throw new ParseError(`Failed to convert object to string: ${error.message}`);
        }
        throw new ParseError('Failed to convert object to string');
    }
}

/**
 * Process a string with optional lowercasing and character stripping
 */
function processString(
    s: string,
    stripLower: boolean,
    chars: string | null
): string {
    // Handle empty values
    if (!s || s === 'undefined' || s === 'null' || s === '[]' || s === '{}') {
        return '';
    }

    let result = s;
    if (stripLower) {
        result = result.toLowerCase();
    }
    if (chars !== null) {
        const regex = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
        result = result.replace(regex, '');
    } else if (stripLower) {
        result = result.trim();
    }
    return result;
}

/**
 * Convert any input to its string representation.
 * 
 * @param input - The input to convert to a string
 * @param options - Configuration options for string conversion
 * @returns The string representation of the input
 * 
 * @example
 * ```typescript
 * toStr(123) // '123'
 * toStr('  HELLO  ', { stripLower: true }) // 'hello'
 * toStr({ a: 1 }, { serializeAs: 'json' }) // '{"a":1}'
 * toStr({ a: 1 }, { serializeAs: 'xml' }) // '<root><a>1</a></root>'
 * ```
 */
export async function toStr(
    input: any,
    options: SerializeOptions & { serializeAs?: SerializeFormat } = {}
): Promise<string> {
    const {
        serializeAs: format,
        stripLower = false,
        chars = null,
        suppress = false,
        ...rest
    } = options;

    try {
        if (format) {
            return serializeAs(input, format, { stripLower, chars, suppress, ...rest });
        }

        let str = toStrType(input);
        if (stripLower || chars) {
            str = processString(str, stripLower, chars);
        }
        return str;
    } catch (error) {
        if (suppress) {
            return '';
        }
        throw error;
    }
}

/**
 * Convert input to stripped and lowercase string representation.
 * This is a convenience wrapper around toStr that always applies
 * stripping and lowercasing.
 * 
 * @param input - The input to convert to a string
 * @param options - Additional configuration options
 * @returns Stripped and lowercase string representation of the input
 * 
 * @example
 * ```typescript
 * stripLower('  HELLO WORLD  ') // 'hello world'
 * ```
 */
export async function stripLower(
    input: any,
    options: Omit<SerializeOptions & { serializeAs?: SerializeFormat }, 'stripLower'> = {}
): Promise<string> {
    return toStr(input, { ...options, stripLower: true });
}
