/**
 * Options for dictionary conversion
 */
interface DictOptions {
    useModelDump?: boolean;
    fuzzyParse?: boolean;
    suppress?: boolean;
    strType?: 'json' | 'xml' | null;
    parser?: (str: string) => Record<string, any>;
    recursive?: boolean;
    maxRecursiveDepth?: number;
    excludeTypes?: any[];
    recursivePythonOnly?: boolean;
}

/**
 * Convert various input types to a dictionary
 */
export function toDict(
    input: any,
    options: DictOptions = {}
): Record<string, any> {
    const {
        useModelDump = true,
        fuzzyParse = false,
        suppress = false,
        strType = 'json',
        parser = null,
        recursive = false,
        maxRecursiveDepth = null,
        excludeTypes = [],
        recursivePythonOnly = true,
    } = options;

    try {
        if (recursive) {
            return recursiveToDict(input, {
                useModelDump,
                fuzzyParse,
                strType,
                parser,
                maxRecursiveDepth,
                excludeTypes,
                recursiveCustomTypes: !recursivePythonOnly,
            });
        }

        return toDictCore(input, {
            useModelDump,
            fuzzyParse,
            strType,
            parser,
            excludeTypes,
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
    options: DictOptions
): Record<string, any> {
    const {
        useModelDump,
        fuzzyParse,
        strType,
        parser,
        excludeTypes = [],
    } = options;

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
    if (useModelDump && typeof input?.modelDump === 'function') {
        return input.modelDump();
    }

    // Handle string conversion
    if (typeof input === 'string') {
        if (fuzzyParse) {
            return fuzzyParseJson(input);
        }
        return stringToDict(input, strType, parser);
    }

    // Handle Maps
    if (input instanceof Map) {
        return Object.fromEntries(input);
    }

    // Handle Sets
    if (input instanceof Set) {
        return Array.from(input).reduce((acc, val) => {
            acc[val] = val;
            return acc;
        }, {});
    }

    // Handle Arrays and other iterables
    if (Symbol.iterator in Object(input)) {
        return Array.from(input).reduce((acc, val, idx) => {
            acc[idx] = val;
            return acc;
        }, {});
    }

    // Handle generic objects
    return convertGenericToDict(input);
}

/**
 * Recursively convert to dictionary with depth control
 */
function recursiveToDict(
    input: any,
    options: DictOptions & { maxRecursiveDepth?: number }
): any {
    const {
        maxRecursiveDepth = 5,
        recursiveCustomTypes = false,
        ...rest
    } = options;

    if (!Number.isInteger(maxRecursiveDepth) || maxRecursiveDepth < 0) {
        throw new Error('maxRecursiveDepth must be a non-negative integer');
    }

    if (maxRecursiveDepth > 10) {
        throw new Error('maxRecursiveDepth must be less than or equal to 10');
    }

    function recursiveHelper(value: any, depth: number): any {
        if (depth >= maxRecursiveDepth) {
            return value;
        }

        // Handle strings
        if (typeof value === 'string') {
            try {
                const parsed = toDictCore(value, rest);
                return recursiveHelper(parsed, depth + 1);
            } catch {
                return value;
            }
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
            try {
                const converted = toDictCore(value, rest);
                return recursiveHelper(converted, depth + 1);
            } catch {
                return value;
            }
        }

        return value;
    }

    return recursiveHelper(input, 0);
}

/**
 * Convert string to dictionary
 */
function stringToDict(
    input: string,
    strType: 'json' | 'xml' | null = 'json',
    parser: ((str: string) => Record<string, any>) | null = null
): Record<string, any> {
    if (!input) return {};

    if (strType === 'json') {
        try {
            return parser ? parser(input) : JSON.parse(input);
        } catch (error) {
            throw new Error('Failed to parse JSON string');
        }
    }

    if (strType === 'xml') {
        try {
            return parser ? parser(input) : xmlToDict(input);
        } catch (error) {
            throw new Error('Failed to parse XML string');
        }
    }

    throw new Error('Unsupported string type, must be "json" or "xml"');
}

/**
 * Convert generic object to dictionary
 */
function convertGenericToDict(input: any): Record<string, any> {
    // Try common conversion methods
    const methods = ['toDict', 'dict', 'json', 'toJson'];
    for (const method of methods) {
        if (typeof input[method] === 'function') {
            const result = input[method]();
            return typeof result === 'string' ? 
                   JSON.parse(result) : 
                   result;
        }
    }

    // Try __dict__ property
    if (input.__dict__) {
        return input.__dict__;
    }

    // Try direct conversion
    try {
        return Object.fromEntries(input);
    } catch {
        throw new Error('Unable to convert input to dictionary');
    }
}

/**
 * Check if value is a plain object
 */
function isPlainObject(value: any): boolean {
    return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * XML to dictionary conversion (placeholder)
 */
function xmlToDict(xml: string): Record<string, any> {
    // Implement XML parsing logic or use external library
    throw new Error('XML parsing not implemented');
}

// Example usage:
/*
const data = {
    name: 'John',
    details: {
        age: 30,
        scores: [95, 87, 92]
    }
};

const dict = toDict(data, { recursive: true });
*/