import { fuzzyParseJson } from './fuzzy_parse_json';
import { xmlToDict, xmlToDictSync } from './xml_parser';
import { ToDictOptions, ParseError, StringKeyedDict } from './types';

/**
 * Convert various input types to a dictionary
 * 
 * @param input - The input to convert to a dictionary
 * @param options - Configuration options for dictionary conversion
 * @returns A dictionary representation of the input
 * 
 * @example
 * ```typescript
 * toDict('{"a": 1}') // { a: 1 }
 * toDict(new Map([['a', 1]])) // { a: 1 }
 * toDict('<root><a>1</a></root>', { strType: 'xml' }) // { a: '1' }
 * ```
 */
export function toDict(
    input: any,
    options: ToDictOptions = {}
): StringKeyedDict {
    const {
        useDictDump = true,
        fuzzyParse = false,
        strType = 'json',
        parser = undefined,
        recursive = false,
        maxRecursiveDepth = 5,
        excludeTypes = [],
        recursivePythonOnly = true,
        suppress = false
    } = options;

    try {
        if (recursive) {
            return recursiveToDict(input, {
                useDictDump,
                fuzzyParse,
                strType,
                parser,
                maxRecursiveDepth,
                excludeTypes,
                recursiveCustomTypes: !recursivePythonOnly,
                suppress
            });
        }

        return toDictCore(input, {
            useDictDump,
            fuzzyParse,
            strType,
            parser,
            excludeTypes,
            suppress
        });
    } catch (error) {
        if (suppress) {
            return {};
        }
        throw error;
    }
}

/**
 * Core dictionary conversion logic
 */
function toDictCore(
    input: any,
    options: ToDictOptions
): StringKeyedDict {
    const {
        useDictDump = true,
        fuzzyParse = false,
        strType = 'json',
        parser = undefined,
        excludeTypes = [],
        suppress = false
    } = options;

    try {
        // Handle excluded types
        if (excludeTypes.length > 0 && excludeTypes.some(type => input instanceof type)) {
            return input;
        }

        // Handle null/undefined
        if (input == null) {
            return {};
        }

        // Handle plain objects
        if (isPlainObject(input)) {
            return input;
        }

        // Handle model dump
        if (useDictDump && typeof input?.modelDump === 'function') {
            return input.modelDump();
        }

        // Handle string conversion
        if (typeof input === 'string') {
            return stringToDict(input, { strType, parser, fuzzyParse, suppress });
        }

        // Handle Maps
        if (input instanceof Map) {
            return Object.fromEntries(input);
        }

        // Handle Sets
        if (input instanceof Set) {
            return Array.from(input).reduce((acc: StringKeyedDict, val) => {
                acc[String(val)] = val;
                return acc;
            }, {});
        }

        // Handle Arrays and other iterables
        if (Symbol.iterator in Object(input)) {
            return Array.from(input).reduce((acc: StringKeyedDict, val, idx) => {
                acc[idx] = val;
                return acc;
            }, {});
        }

        // Handle generic objects
        return convertGenericToDict(input);
    } catch (error) {
        if (suppress) {
            return {};
        }
        throw error;
    }
}

/**
 * Recursively convert to dictionary with depth control
 */
function recursiveToDict(
    input: any,
    options: ToDictOptions & { 
        maxRecursiveDepth?: number;
        recursiveCustomTypes?: boolean;
    }
): any {
    const {
        maxRecursiveDepth = 5,
        recursiveCustomTypes = false,
        suppress = false,
        ...rest
    } = options;

    if (!Number.isInteger(maxRecursiveDepth) || maxRecursiveDepth < 0) {
        throw new ParseError('maxRecursiveDepth must be a non-negative integer');
    }

    if (maxRecursiveDepth > 10) {
        throw new ParseError('maxRecursiveDepth must be less than or equal to 10');
    }

    function recursiveHelper(value: any, depth: number): any {
        if (depth >= maxRecursiveDepth) {
            return value;
        }

        try {
            // Handle strings
            if (typeof value === 'string') {
                const parsed = toDictCore(value, { ...rest, suppress });
                return recursiveHelper(parsed, depth + 1);
            }

            // Handle arrays
            if (Array.isArray(value)) {
                return value.map(item => recursiveHelper(item, depth + 1));
            }

            // Handle plain objects
            if (isPlainObject(value)) {
                return Object.fromEntries(
                    Object.entries(value).map(([k, v]) => [
                        k,
                        recursiveHelper(v, depth + 1)
                    ])
                );
            }

            // Handle custom types
            if (recursiveCustomTypes) {
                const converted = toDictCore(value, { ...rest, suppress });
                return recursiveHelper(converted, depth + 1);
            }

            return value;
        } catch (error) {
            if (suppress) {
                return value;
            }
            throw error;
        }
    }

    return recursiveHelper(input, 0);
}

/**
 * Convert string to dictionary
 */
function stringToDict(
    input: string,
    options: {
        strType?: 'json' | 'xml' | null;
        parser?: (str: string) => StringKeyedDict;
        fuzzyParse?: boolean;
        suppress?: boolean;
    }
): StringKeyedDict {
    const {
        strType = 'json',
        parser = undefined,
        fuzzyParse = false,
        suppress = false
    } = options;

    if (!input.trim()) {
        return {};
    }

    try {
        if (strType === 'json') {
            if (parser) {
                return parser(input);
            }
            return fuzzyParse ? fuzzyParseJson(input) : JSON.parse(input);
        }

        if (strType === 'xml') {
            if (parser) {
                return parser(input);
            }
            return xmlToDictSync(input, { suppress });
        }

        throw new ParseError('Unsupported string type, must be "json" or "xml"');
    } catch (error) {
        if (suppress) {
            return {};
        }
        throw error;
    }
}

/**
 * Convert generic object to dictionary
 */
function convertGenericToDict(input: any): StringKeyedDict {
    // Try common conversion methods
    const methods = ['toDict', 'dict', 'json', 'toJson'];
    for (const method of methods) {
        if (typeof input[method] === 'function') {
            try {
                const result = input[method]();
                return typeof result === 'string' ? 
                       JSON.parse(result) : 
                       result;
            } catch {
                continue;
            }
        }
    }

    // Try __dict__ property (Python-style objects)
    if (input.__dict__ && typeof input.__dict__ === 'object') {
        return input.__dict__;
    }

    // Try direct conversion
    try {
        return Object.fromEntries(
            Object.entries(input).filter(([key]) => !key.startsWith('_'))
        );
    } catch {
        throw new ParseError('Unable to convert input to dictionary');
    }
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: any): boolean {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
