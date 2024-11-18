import { ParseError } from './types';

/**
 * Convert a JSON schema to a regular expression pattern.
 * 
 * @param schema - The JSON schema to convert
 * @returns A regular expression pattern that matches JSON strings conforming to the schema
 */
export function jsonSchemaToRegex(schema: any): string {
    function escapeRegExp(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function schemaToRegex(s: any): string {
        if (s.type === 'object') {
            const properties = s.properties || {};
            if (Object.keys(properties).length === 0) {
                return '\\{\\s*\\}';
            }

            // Create patterns for each property
            const propPatterns = Object.entries(properties).map(([prop, propSchema]) => 
                `"${escapeRegExp(prop)}"\\s*:\\s*${schemaToRegex(propSchema)}`
            );

            // All properties must be present but can be in any order
            const allProps = propPatterns.join('\\s*,\\s*');
            const permutations = generatePermutations(propPatterns);
            return '\\{\\s*(' + permutations.join('|') + ')\\s*\\}';
        }
        
        if (s.type === 'array') {
            const items = s.items || {};
            const itemPattern = schemaToRegex(items);
            return '\\[\\s*(' + itemPattern + '(\\s*,\\s*' + itemPattern + ')*)?\\s*\\]';
        }
        
        if (s.type === 'string') {
            return '"[^"]*"';
        }
        
        if (s.type === 'integer') {
            return '-?\\d+';
        }
        
        if (s.type === 'number') {
            return '-?\\d+(\\.\\d+)?';
        }
        
        if (s.type === 'boolean') {
            return '(true|false)';
        }
        
        if (s.type === 'null') {
            return 'null';
        }

        return '.*';
    }

    return '^' + schemaToRegex(schema) + '$';
}

/**
 * Generate all possible permutations of property patterns
 */
function generatePermutations(patterns: string[]): string[] {
    if (patterns.length <= 1) return patterns;
    
    const result: string[] = [];
    for (let i = 0; i < patterns.length; i++) {
        const current = patterns[i];
        const remaining = [...patterns.slice(0, i), ...patterns.slice(i + 1)];
        const subPermutations = generatePermutations(remaining);
        
        for (const subPerm of subPermutations) {
            result.push(current + '\\s*,\\s*' + subPerm);
        }
    }
    return result;
}

/**
 * Utility functions for testing regex patterns
 */
export const regexUtils = {
    /**
     * Test if a string matches a regex pattern
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
     * Find all matches of a pattern in a string
     */
    findMatches(pattern: string, input: string): string[] {
        try {
            const regex = new RegExp(pattern, 'g');
            return input.match(regex) || [];
        } catch (error) {
            console.error('Invalid regex pattern:', error);
            return [];
        }
    },

    /**
     * Validate if a pattern is a valid regular expression
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
     * Simplify a regex pattern by removing unnecessary escapes and whitespace
     */
    simplifyPattern(pattern: string): string {
        // First preserve escaped sequences
        const preserved: { [key: string]: string } = {};
        let counter = 0;
        pattern = pattern.replace(/\\[a-z*+]/g, (match) => {
            const placeholder = `__PRESERVED_${counter}__`;
            preserved[placeholder] = match;
            counter++;
            return placeholder;
        });
        
        // Remove unnecessary whitespace
        pattern = pattern.replace(/\s+/g, '');
        
        // Replace preserved sequences
        Object.entries(preserved).forEach(([placeholder, value]) => {
            pattern = pattern.replace(placeholder, value);
        });
        
        // Convert \s+ to \s*
        pattern = pattern.replace(/\\s\+/g, '\\s*');
        
        return pattern;
    }
};
