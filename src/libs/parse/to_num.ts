/**
 * Number processing types and patterns
 */
type NumberType = 'int' | 'float' | 'complex';
type NumberResult = number | Complex;

// Complex number class
class Complex {
    constructor(public real: number, public imag: number) {}
    
    toString(): string {
        return `${this.real}${this.imag >= 0 ? '+' : ''}${this.imag}j`;
    }
}

// Number patterns
const PATTERNS = {
    complex_sci: /[+-]?\d*\.?\d+[eE][+-]?\d+[+-]\d*\.?\d*[jJ]/,
    complex: /[+-]?\d*\.?\d+[+-]\d*\.?\d*[jJ]/,
    pure_imaginary: /[+-]?\d*\.?\d*[jJ]/,
    scientific: /[+-]?\d*\.?\d+[eE][+-]?\d+/,
    decimal: /[+-]?\d*\.?\d+/,
    percentage: /[+-]?\d*\.?\d+%/,
    fraction: /[+-]?\d+\/\d+/,
    special: /[+-]?(?:infinity|inf|nan)/i
};

/**
 * Options for number conversion
 */
interface NumberOptions {
    upperBound?: number;
    lowerBound?: number;
    numType?: NumberType;
    precision?: number;
    numCount?: number;
}

/**
 * Convert input to numeric type(s) with validation
 */
export function toNum(
    input: any,
    options: NumberOptions = {}
): NumberResult | NumberResult[] {
    const {
        upperBound,
        lowerBound,
        numType = 'float',
        precision,
        numCount = 1
    } = options;

    // Validate input type
    if (Array.isArray(input)) {
        throw new TypeError('Input cannot be a sequence');
    }

    // Handle boolean input
    if (typeof input === 'boolean') {
        return validateType(Number(input), numType);
    }

    // Handle direct numeric input
    if (typeof input === 'number' || input instanceof Complex) {
        const value = typeof input === 'number' ? input : input;
        const boundedValue = applyBounds(value, upperBound, lowerBound);
        const preciseValue = applyPrecision(boundedValue, precision);
        return convertType(preciseValue, numType);
    }

    // Extract numbers from string
    const inputStr = String(input);
    const matches = extractNumbers(inputStr);

    if (!matches.length) {
        throw new Error(`No valid numbers found in: ${inputStr}`);
    }

    // Process matches
    const results = matches
        .slice(0, numCount)
        .map(match => processMatch(match, { 
            upperBound, 
            lowerBound, 
            numType, 
            precision 
        }));

    return numCount === 1 ? results[0] : results;
}

/**
 * Extract numbers using patterns
 */
function extractNumbers(text: string): Array<[string, string]> {
    const combined = Object.values(PATTERNS).join('|');
    const regex = new RegExp(combined, 'gi');
    const matches: Array<[string, string]> = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
        const value = match[0];
        for (const [name, pattern] of Object.entries(PATTERNS)) {
            if (new RegExp(`^${pattern.source}$`, 'i').test(value)) {
                matches.push([name, value]);
                break;
            }
        }
    }

    return matches;
}

/**
 * Process a single number match
 */
function processMatch(
    match: [string, string],
    options: NumberOptions
): NumberResult {
    const [type, value] = match;
    let parsedValue: NumberResult;

    try {
        parsedValue = parseNumber([type, value]);
        parsedValue = applyBounds(parsedValue, options.upperBound, options.lowerBound);
        parsedValue = applyPrecision(parsedValue, options.precision);
        return convertType(parsedValue, options.numType);
    } catch (error) {
        throw new Error(`Error processing ${value}: ${error.message}`);
    }
}

/**
 * Parse number string based on type
 */
function parseNumber([type, value]: [string, string]): NumberResult {
    value = value.trim();

    switch (type) {
        case 'special':
            return parseSpecial(value);
        case 'percentage':
            return parsePercentage(value);
        case 'fraction':
            return parseFraction(value);
        case 'complex':
        case 'complex_sci':
        case 'pure_imaginary':
            return parseComplex(value);
        case 'scientific':
        case 'decimal':
            return parseFloat(value);
        default:
            throw new Error(`Unknown number type: ${type}`);
    }
}

/**
 * Utilities for number parsing
 */
function parseSpecial(value: string): number {
    const lower = value.toLowerCase();
    if (lower.includes('infinity') || lower.includes('inf')) {
        return lower.startsWith('-') ? -Infinity : Infinity;
    }
    return NaN;
}

function parsePercentage(value: string): number {
    const num = parseFloat(value.replace('%', ''));
    if (isNaN(num)) {
        throw new Error(`Invalid percentage: ${value}`);
    }
    return num / 100;
}

function parseFraction(value: string): number {
    const [num, denom] = value.split('/').map(Number);
    if (isNaN(num) || isNaN(denom)) {
        throw new Error(`Invalid fraction: ${value}`);
    }
    if (denom === 0) {
        throw new Error('Division by zero');
    }
    return num / denom;
}

function parseComplex(value: string): Complex {
    // Handle pure imaginary
    if (value.endsWith('j') || value.endsWith('J')) {
        if (/^[+-]?j$/i.test(value)) {
            return new Complex(0, value.startsWith('-') ? -1 : 1);
        }
        const imag = parseFloat(value.slice(0, -1) || '1');
        return new Complex(0, imag);
    }

    // Parse complex number
    const match = value.match(/([+-]?\d*\.?\d+)([+-]\d*\.?\d*)[jJ]/);
    if (!match) {
        throw new Error(`Invalid complex number: ${value}`);
    }
    return new Complex(
        parseFloat(match[1]),
        parseFloat(match[2] || '1')
    );
}

/**
 * Validation and conversion utilities
 */
function validateType(
    value: NumberResult,
    type: NumberType
): NumberResult {
    switch (type) {
        case 'int':
            if (value instanceof Complex) {
                throw new TypeError('Cannot convert complex to int');
            }
            if (!Number.isInteger(value)) {
                throw new TypeError(`Cannot convert ${value} to int`);
            }
            return value;
        case 'float':
            return value instanceof Complex ? value : Number(value);
        case 'complex':
            return value instanceof Complex ? value : new Complex(Number(value), 0);
        default:
            throw new Error(`Invalid number type: ${type}`);
    }
}

function applyBounds(
    value: NumberResult,
    upper?: number,
    lower?: number
): NumberResult {
    if (value instanceof Complex) {
        return value;
    }
    if (upper != null && value > upper) {
        throw new Error(`Value ${value} exceeds upper bound ${upper}`);
    }
    if (lower != null && value < lower) {
        throw new Error(`Value ${value} below lower bound ${lower}`);
    }
    return value;
}

function applyPrecision(
    value: NumberResult,
    precision?: number
): NumberResult {
    if (precision == null || value instanceof Complex) {
        return value;
    }
    return Number(value.toFixed(precision));
}

function convertType(
    value: NumberResult,
    targetType: NumberType = 'float'
): NumberResult {
    return validateType(value, targetType);
}

// Example usage:
/*
// Basic number parsing
const num = toNum('42.5');  // 42.5
const int = toNum('42.5', { numType: 'int' });  // 42

// Complex numbers
const complex = toNum('3+4j', { numType: 'complex' });  // Complex(3, 4)

// Bounds checking
const bounded = toNum('50', { 
    upperBound: 100, 
    lowerBound: 0 
});  // 50

// Multiple numbers
const numbers = toNum('The values are 42 and 73', { 
    numCount: 2 
});  // [42, 73]

// Precision
const precise = toNum('3.14159', { 
    precision: 2 
});  // 3.14
*/