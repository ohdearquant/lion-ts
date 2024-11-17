"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grammarUtils = exports.jsonSchemaToGrammar = void 0;
/**
 * Convert JSON schema to context-free grammar productions
 */
function jsonSchemaToGrammar(schema, startSymbol = 'S') {
    const productions = [];
    const visited = new Set();
    let symbolCounter = 0;
    /**
     * Generate unique symbol name
     */
    function generateSymbol(base) {
        const symbol = `${base}@${symbolCounter}`;
        symbolCounter++;
        return symbol;
    }
    /**
     * Generate grammar rules for schema
     */
    function generateRules(schema, symbol) {
        if (visited.has(symbol)) {
            return;
        }
        visited.add(symbol);
        switch (schema.type) {
            case 'object':
                generateObjectRules(schema, symbol);
                break;
            case 'array':
                generateArrayRules(schema, symbol);
                break;
            default:
                generatePrimitiveRules(schema, symbol);
        }
    }
    /**
     * Generate rules for object type
     */
    function generateObjectRules(schema, symbol) {
        const properties = schema.properties || {};
        if (Object.keys(properties).length > 0) {
            const propsSymbol = generateSymbol('PROPS');
            productions.push([symbol, ['{', propsSymbol, '}']]);
            // Empty object
            productions.push([propsSymbol, []]);
            // Generate rules for each property
            Object.entries(properties).forEach(([prop, propSchema], index) => {
                const propSymbol = generateSymbol(prop);
                if (index === 0) {
                    productions.push([propsSymbol, [propSymbol]]);
                }
                else {
                    productions.push([
                        propsSymbol,
                        [propsSymbol, ',', propSymbol]
                    ]);
                }
                const valueSymbol = generateSymbol('VALUE');
                productions.push([
                    propSymbol,
                    [`"${prop}"`, ':', valueSymbol]
                ]);
                generateRules(propSchema, valueSymbol);
            });
        }
        else {
            productions.push([symbol, ['{', '}']]);
        }
    }
    /**
     * Generate rules for array type
     */
    function generateArrayRules(schema, symbol) {
        const items = schema.items || {};
        const itemsSymbol = generateSymbol('ITEMS');
        const valueSymbol = generateSymbol('VALUE');
        productions.push([symbol, ['[', ']']]);
        productions.push([symbol, ['[', itemsSymbol, ']']]);
        productions.push([itemsSymbol, [valueSymbol]]);
        productions.push([
            itemsSymbol,
            [valueSymbol, ',', itemsSymbol]
        ]);
        generateRules(items, valueSymbol);
    }
    /**
     * Generate rules for primitive types
     */
    function generatePrimitiveRules(schema, symbol) {
        switch (schema.type) {
            case 'string':
                productions.push([symbol, ['STRING']]);
                break;
            case 'number':
                productions.push([symbol, ['NUMBER']]);
                break;
            case 'integer':
                productions.push([symbol, ['INTEGER']]);
                break;
            case 'boolean':
                productions.push([symbol, ['BOOLEAN']]);
                break;
            case 'null':
                productions.push([symbol, ['NULL']]);
                break;
            default:
                productions.push([symbol, ['ANY']]);
        }
    }
    // Start rule generation
    generateRules(schema, startSymbol);
    return productions;
}
exports.jsonSchemaToGrammar = jsonSchemaToGrammar;
// Optional utility functions for working with the grammar
exports.grammarUtils = {
    /**
     * Get all non-terminal symbols in the grammar
     */
    getNonTerminals(productions) {
        return new Set(productions.map(([lhs]) => lhs));
    },
    /**
     * Get all terminal symbols in the grammar
     */
    getTerminals(productions) {
        const nonTerminals = exports.grammarUtils.getNonTerminals(productions);
        const terminals = new Set();
        productions.forEach(([_, rhs]) => {
            rhs.forEach(symbol => {
                if (!nonTerminals.has(symbol)) {
                    terminals.add(symbol);
                }
            });
        });
        return terminals;
    },
    /**
     * Verify grammar is context-free
     */
    isContextFree(productions) {
        return productions.every(([lhs]) => {
            return typeof lhs === 'string' && lhs.length > 0;
        });
    }
};
// Example usage:
/*
const schema = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        address: {
            type: 'object',
            properties: {
                street: { type: 'string' },
                city: { type: 'string' }
            }
        }
    }
};

const grammar = jsonSchemaToGrammar(schema);
console.log(grammar);
*/ 
