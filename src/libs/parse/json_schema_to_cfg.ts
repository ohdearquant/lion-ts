/**
 * Types for JSON Schema and Grammar Productions
 */
type JsonSchema = {
    type?: string;
    properties?: Record<string, JsonSchema>;
    items?: JsonSchema;
    [key: string]: any;
};

export type Production = [string, string[]];
export type Productions = Production[];

/**
 * Convert JSON schema to context-free grammar productions
 */
export function jsonSchemaToGrammar(
    schema: JsonSchema,
    startSymbol: string = 'S'
): Productions {
    const productions: Productions = [];
    const visited = new Set<string>();
    let symbolCounter = 0;

    /**
     * Generate unique symbol name
     */
    function generateSymbol(base: string): string {
        const symbol = `${base}@${symbolCounter}`;
        symbolCounter++;
        return symbol;
    }

    /**
     * Generate grammar rules for schema
     */
    function generateRules(
        schema: JsonSchema,
        symbol: string
    ): void {
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
    function generateObjectRules(
        schema: JsonSchema,
        symbol: string
    ): void {
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
                } else {
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
        } else {
            productions.push([symbol, ['{', '}']]);
        }
    }

    /**
     * Generate rules for array type
     */
    function generateArrayRules(
        schema: JsonSchema,
        symbol: string
    ): void {
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
    function generatePrimitiveRules(
        schema: JsonSchema,
        symbol: string
    ): void {
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

// Optional utility functions for working with the grammar
export const grammarUtils = {
    /**
     * Get all non-terminal symbols in the grammar
     */
    getNonTerminals(productions: Productions): Set<string> {
        return new Set(productions.map(([lhs]) => lhs));
    },

    /**
     * Get all terminal symbols in the grammar
     */
    getTerminals(productions: Productions): Set<string> {
        const nonTerminals = grammarUtils.getNonTerminals(productions);
        const terminals = new Set<string>();
        
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
    isContextFree(productions: Productions): boolean {
        return productions.every(([lhs]) => {
            return typeof lhs === 'string' && lhs.length > 0;
        });
    }
};
