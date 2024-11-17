"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.regexUtils = exports.printCFG = exports.jsonSchemaToRegex = void 0;
/**
 * Convert JSON schema to regular expression pattern
 */
function jsonSchemaToRegex(schema) {
    return '^' + schemaToRegex(schema) + '$';
}
exports.jsonSchemaToRegex = jsonSchemaToRegex;
/**
 * Convert schema component to regex pattern
 */
function schemaToRegex(schema) {
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
function generateObjectPattern(schema) {
    const properties = schema.properties || {};
    if (Object.keys(properties).length === 0) {
        return '\\{\\s*\\}';
    }
    const propPatterns = Object.entries(properties).map(([prop, propSchema]) => `"${escapeRegex(prop)}"\\s*:\\s*${schemaToRegex(propSchema)}`);
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
function generateArrayPattern(schema) {
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
function generateStringPattern() {
    return '"[^"]*"';
}
function generateIntegerPattern() {
    return '-?\\d+';
}
function generateNumberPattern() {
    return '-?\\d+(\\.\\d+)?';
}
function generateBooleanPattern() {
    return '(true|false)';
}
function generateNullPattern() {
    return 'null';
}
/**
 * Escape special regex characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Print context-free grammar productions
 */
function printCFG(productions) {
    return productions
        .map(([lhs, rhs]) => `${lhs} -> ${rhs.join(' ')}`)
        .join('\n');
}
exports.printCFG = printCFG;
/**
 * Utility functions for working with generated patterns
 */
exports.regexUtils = {
    /**
     * Test if a string matches the generated pattern
     */
    testPattern(pattern, input) {
        try {
            const regex = new RegExp(pattern);
            return regex.test(input);
        }
        catch (error) {
            console.error('Invalid regex pattern:', error);
            return false;
        }
    },
    /**
     * Validate a generated pattern
     */
    validatePattern(pattern) {
        try {
            new RegExp(pattern);
            return true;
        }
        catch {
            return false;
        }
    },
    /**
     * Get a simplified version of the pattern
     */
    simplifyPattern(pattern) {
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
