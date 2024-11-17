import { Complex, NumberParseOptions, Numeric, NumberMatch, ParseError, ValidNumericType } from './types';

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
 * Convert input to numeric type(s) with validation
 */
export function toNum(
    input: any,
    options: NumberParseOptions = {}
): number | Complex | Array<number | Complex> {
    const {
        upperBound,
        lowerBound,
        numType = 'float',
        precision,
        numCount = 1
    } = options;

    // Validate input type
    if (Array.isArray(input)) {
        throw new ParseError('Input cannot be a sequence');
    }

    // Handle boolean input
    if (typeof input === 'boolean') {
        return validateType(Number(input), numType as ValidNumericType);
    }

    // Handle direct numeric input
    if (typeof input === 'number' || input instanceof Complex) {
        const value = input;
        const boundedValue = applyBounds(value, upperBound, lowerBound);
        const preciseValue = applyPrecision(boundedValue, precision);
        return convertType(preciseValue, numType as ValidNumericType);
    }

    // Extract numbers from string
    const inputStr = String(input);
    const matches = extractNumbers(inputStr);

    if (!matches.length) {
        throw new ParseError(`No valid numbers found in: ${inputStr}`);
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
function extractNumbers(text: string): NumberMatch[] {
    const combined = Object.values(PATTERNS).join('|');
    const regex = new RegExp(combined, 'gi');
    const matches: NumberMatch[] = [];
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
    match: NumberMatch,
    options: NumberParseOptions
): number | Complex {
    const [type, value] = match;
    try {
        let parsedValue = parseNumber([type, value]);
        parsedValue = applyBounds(parsedValue, options.upperBound, options.lowerBound);
        parsedValue = applyPrecision(parsedValue, options.precision);
        return convertType(parsedValue, options.numType as ValidNumericType);
    } catch (err) {
        if (err instanceof Error) {
            throw new ParseError(`Error processing ${value}: ${err.message}`);
        }
        throw new ParseError(`Error processing ${value}`);
    }
}

/**
 * Parse number string based on type
 */
function parseNumber([type, value]: NumberMatch): number | Complex {
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
            throw new ParseError(`Unknown number type: ${type}`);
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
        throw new ParseError(`Invalid percentage: ${value}`);
    }
    return num / 100;
}

function parseFraction(value: string): number {
    const [num, denom] = value.split('/').map(Number);
    if (isNaN(num) || isNaN(denom)) {
        throw new ParseError(`Invalid fraction: ${value}`);
    }
    if (denom === 0) {
        throw new ParseError('Division by zero');
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
        throw new ParseError(`Invalid complex number: ${value}`);
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
    value: number | Complex,
    type: ValidNumericType
): number | Complex {
    switch (type) {
        case 'int':
            if (value instanceof Complex) {
                throw new ParseError('Cannot convert complex to int');
            }
            if (!Number.isInteger(value)) {
                throw new ParseError(`Cannot convert ${value} to int`);
            }
            return value;
        case 'float':
            return value instanceof Complex ? value : Number(value);
        case 'complex':
            return value instanceof Complex ? value : new Complex(Number(value), 0);
        default:
            throw new ParseError(`Invalid number type: ${type}`);
    }
}

function applyBounds(
    value: number | Complex,
    upper?: number,
    lower?: number
): number | Complex {
    if (value instanceof Complex) {
        return value;
    }
    if (upper != null && value > upper) {
        throw new ParseError(`Value ${value} exceeds upper bound ${upper}`);
    }
    if (lower != null && value < lower) {
        throw new ParseError(`Value ${value} below lower bound ${lower}`);
    }
    return value;
}

function applyPrecision(
    value: number | Complex,
    precision?: number
): number | Complex {
    if (precision == null || value instanceof Complex) {
        return value;
    }
    return Number(value.toFixed(precision));
}

function convertType(
    value: number | Complex,
    targetType: ValidNumericType = 'float'
): number | Complex {
    return validateType(value, targetType);
}
