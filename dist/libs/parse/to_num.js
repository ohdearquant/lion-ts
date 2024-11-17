"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNum = void 0;
const types_1 = require("./types");
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
function toNum(input, options = {}) {
    const { upperBound, lowerBound, numType = 'float', precision, numCount = 1 } = options;
    // Validate input type
    if (Array.isArray(input)) {
        throw new types_1.ParseError('Input cannot be a sequence');
    }
    // Handle boolean input
    if (typeof input === 'boolean') {
        return validateType(Number(input), numType);
    }
    // Handle direct numeric input
    if (typeof input === 'number' || input instanceof types_1.Complex) {
        const value = input;
        const boundedValue = applyBounds(value, upperBound, lowerBound);
        const preciseValue = applyPrecision(boundedValue, precision);
        return convertType(preciseValue, numType);
    }
    // Extract numbers from string
    const inputStr = String(input);
    const matches = extractNumbers(inputStr);
    if (!matches.length) {
        throw new types_1.ParseError(`No valid numbers found in: ${inputStr}`);
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
exports.toNum = toNum;
/**
 * Extract numbers using patterns
 */
function extractNumbers(text) {
    const combined = Object.values(PATTERNS).join('|');
    const regex = new RegExp(combined, 'gi');
    const matches = [];
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
function processMatch(match, options) {
    const [type, value] = match;
    try {
        let parsedValue = parseNumber([type, value]);
        parsedValue = applyBounds(parsedValue, options.upperBound, options.lowerBound);
        parsedValue = applyPrecision(parsedValue, options.precision);
        return convertType(parsedValue, options.numType);
    }
    catch (err) {
        if (err instanceof Error) {
            throw new types_1.ParseError(`Error processing ${value}: ${err.message}`);
        }
        throw new types_1.ParseError(`Error processing ${value}`);
    }
}
/**
 * Parse number string based on type
 */
function parseNumber([type, value]) {
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
            throw new types_1.ParseError(`Unknown number type: ${type}`);
    }
}
/**
 * Utilities for number parsing
 */
function parseSpecial(value) {
    const lower = value.toLowerCase();
    if (lower.includes('infinity') || lower.includes('inf')) {
        return lower.startsWith('-') ? -Infinity : Infinity;
    }
    return NaN;
}
function parsePercentage(value) {
    const num = parseFloat(value.replace('%', ''));
    if (isNaN(num)) {
        throw new types_1.ParseError(`Invalid percentage: ${value}`);
    }
    return num / 100;
}
function parseFraction(value) {
    const [num, denom] = value.split('/').map(Number);
    if (isNaN(num) || isNaN(denom)) {
        throw new types_1.ParseError(`Invalid fraction: ${value}`);
    }
    if (denom === 0) {
        throw new types_1.ParseError('Division by zero');
    }
    return num / denom;
}
function parseComplex(value) {
    // Handle pure imaginary
    if (value.endsWith('j') || value.endsWith('J')) {
        if (/^[+-]?j$/i.test(value)) {
            return new types_1.Complex(0, value.startsWith('-') ? -1 : 1);
        }
        const imag = parseFloat(value.slice(0, -1) || '1');
        return new types_1.Complex(0, imag);
    }
    // Parse complex number
    const match = value.match(/([+-]?\d*\.?\d+)([+-]\d*\.?\d*)[jJ]/);
    if (!match) {
        throw new types_1.ParseError(`Invalid complex number: ${value}`);
    }
    return new types_1.Complex(parseFloat(match[1]), parseFloat(match[2] || '1'));
}
/**
 * Validation and conversion utilities
 */
function validateType(value, type) {
    switch (type) {
        case 'int':
            if (value instanceof types_1.Complex) {
                throw new types_1.ParseError('Cannot convert complex to int');
            }
            if (!Number.isInteger(value)) {
                throw new types_1.ParseError(`Cannot convert ${value} to int`);
            }
            return value;
        case 'float':
            return value instanceof types_1.Complex ? value : Number(value);
        case 'complex':
            return value instanceof types_1.Complex ? value : new types_1.Complex(Number(value), 0);
        default:
            throw new types_1.ParseError(`Invalid number type: ${type}`);
    }
}
function applyBounds(value, upper, lower) {
    if (value instanceof types_1.Complex) {
        return value;
    }
    if (upper != null && value > upper) {
        throw new types_1.ParseError(`Value ${value} exceeds upper bound ${upper}`);
    }
    if (lower != null && value < lower) {
        throw new types_1.ParseError(`Value ${value} below lower bound ${lower}`);
    }
    return value;
}
function applyPrecision(value, precision) {
    if (precision == null || value instanceof types_1.Complex) {
        return value;
    }
    return Number(value.toFixed(precision));
}
function convertType(value, targetType = 'float') {
    return validateType(value, targetType);
}
