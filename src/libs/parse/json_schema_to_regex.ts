/**
 * Types for JSON Schema and Grammar Productions
 */
type JsonSchema = {
    type?: string;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    [key: string]: any;
};

type Production = [string, string[]];

/**
 * Convert JSON schema to regular expression pattern
 */
export function jsonSchemaToRegex(schema: JsonSchema): string {
    return '^' + schemaToRegex(schema) + '$';
}

/**
 * Convert schema component to regex pattern
 */
function schemaToRegex(schema: JsonSchema): string {
    switch (schema.type) {
        case 'object':
            return generateObjectPattern(schema);
        case 'array':
            return generateArrayPattern(schema);
        case 'string':
            return generateStringPattern();
        case 'integer':
            return generateIntegerPattern();
        case 'number':
            return generateNumberPattern();
        case 'boolean':
            return generateBooleanPattern();
        case 'null':
            return generateNullPattern();
        default:
            return '.*';
    }
}

/**
 * Generate pattern for object type
 */
function generateObjectPattern(schema: JsonSchema): string {
    const properties = schema.properties || {};
    
    if (Object.keys(properties).length === 0) {
        return '\\{\\s*\\}';
    }

    const propPatterns = Object.entries(properties).map(
        ([prop, propSchema]) =>
            `"${escapeRegex(prop)}"\\s*:\\s*${schemaToRegex(propSchema)}`
    );

    const propPattern = propPatterns.join('|');
    
    return '\\{\\s*(' +
           propPattern +
           ')(\\s*,\\s*(' +
           propPattern +
           '))*\\s*\\}';
}

/**
 * Generate pattern for array type
 */
function generateArrayPattern(schema: JsonSchema): string {
    const items = schema.items || {};
    const itemPattern = schemaToRegex(items);
    
    return '\\[\\s*(' +
           itemPattern +
           '(\\s*,\\s*' +
           itemPattern +
           ')*)?\\s*\\]';
}

/**
 * Generate patterns for primitive types
 */
function generateStringPattern(): string {
    return '"[^"]*"';
}

function generateIntegerPattern(): string {
    return '-?\\d+';
}

function generateNumberPattern(): string {
    return '-?\\d+(\\.\\d+)?';
}

function generateBooleanPattern(): string {
    return '(true|false)';
}

function generateNullPattern(): string {
    return 'null';
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Print context-free grammar productions
 */
export function printCFG(productions: Production[]): string {
    return productions
        .map(([lhs, rhs]) => `${lhs} -> ${rhs.join(' ')}`)
        .join('\n');
}

/**
 * Utility functions for working with generated patterns
 */
export const regexUtils = {
    /**
     * Test if a string matches the generated pattern
     */
    testPattern(pattern: string, input: string): boolean {
        try {
            const regex = new RegExp(pattern);
            return regex.test(input);
        } catch (error) {
            console.error('Invalid regex pattern:', error);
            return false;
        }
    },

    /**
     * Validate a generated pattern
     */
    validatePattern(pattern: string): boolean {
        try {
            new RegExp(pattern);
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Get a simplified version of the pattern
     */
    simplifyPattern(pattern: string): string {
        return pattern
            .replace(/\s+/g, '\\s*')
            .replace(/\\\s\*/g, '\\s*');
    }
};

// Example usage:
/*
const schema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        scores: {
            type: 'array',
            items: { type: 'number' }
        }
    }
};

const pattern = jsonSchemaToRegex(schema);
console.log(pattern);

const testJson = '{"name":"John","age":30,"scores":[95.5,87.3]}';
console.log(regexUtils.testPattern(pattern, testJson));
*/