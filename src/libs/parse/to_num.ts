import { Complex, NumberParseOptions, Numeric, NumberMatch, ParseError, ValidNumericType } from './types';

// Number patterns - ordered from most specific to most general
const PATTERNS = {
    complex_sci: /[+-]?(?:\d*\.?\d+(?:[eE][+-]?\d+)?[+-]\d*\.?\d+(?:[eE][+-]?\d+)?|[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?)[jJ]/,
    complex: /[+-]?(?:\d*\.?\d+[+-]\d*\.?\d+|[+-]?\d*\.?\d+)[jJ]/,
    pure_imaginary: /[+-]?(?:\d*\.?\d*)?[jJ]/,
    scientific: /[+-]?\d*\.?\d+[eE][+-]?\d+/,
    percentage: /[+-]?\d*\.?\d+%/,
    fraction: /[+-]?\d+\/\d+/,
    decimal: /[+-]?\d*\.?\d+/,
    special: /[+-]?(?:infinity|inf|nan)/i
};

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

    if (Array.isArray(input)) {
        throw new TypeError('Input cannot be a sequence');
    }

    if (typeof input === 'boolean') {
        return validateType(Number(input), numType as ValidNumericType);
    }

    if (typeof input === 'number' || input instanceof Complex) {
        const value = input;
        const boundedValue = applyBounds(value, upperBound, lowerBound);
        const preciseValue = applyPrecision(boundedValue, precision);
        return convertType(preciseValue, numType as ValidNumericType);
    }

    const inputStr = String(input).trim();
    if (!inputStr) {
        throw new ParseError('No valid numbers found in empty string');
    }

    const matches = extractNumbers(inputStr);
    if (!matches.length) {
        throw new ParseError(`No valid numbers found in: ${inputStr}`);
    }

    try {
        const results = matches
            .slice(0, numCount)
            .map(match => {
                const [type, value] = match;
                const parsedValue = parseNumber([type, value]);
                const boundedValue = applyBounds(parsedValue, upperBound, lowerBound);
                const preciseValue = applyPrecision(boundedValue, precision);
                return convertType(preciseValue, numType as ValidNumericType);
            });

        return numCount === 1 ? results[0] : results;
    } catch (err) {
        if (err instanceof ParseError) throw err;
        throw new ParseError(`No valid numbers found in: ${inputStr}`);
    }
}

function extractNumbers(text: string): NumberMatch[] {
    const matches: NumberMatch[] = [];
    const tokens = text.split(/[\s,;:]+/);

    for (const token of tokens) {
        if (PATTERNS.complex.test(token) || PATTERNS.pure_imaginary.test(token)) {
            matches.push(['complex', token]);
        } else if (PATTERNS.scientific.test(token)) {
            matches.push(['scientific', token]);
        } else if (PATTERNS.percentage.test(token)) {
            matches.push(['percentage', token]);
        } else if (PATTERNS.fraction.test(token)) {
            matches.push(['fraction', token]);
        } else if (PATTERNS.special.test(token)) {
            matches.push(['special', token]);
        } else if (PATTERNS.decimal.test(token)) {
            const parsed = parseFloat(token);
            if (!isNaN(parsed)) {
                matches.push(['decimal', token]);
            }
        }
    }

    return matches;
}

function parseNumber([type, value]: NumberMatch): number | Complex {
    value = value.trim();

    switch (type) {
        case 'special': {
            const lower = value.toLowerCase();
            return lower.startsWith('-') ? -Infinity : Infinity;
        }

        case 'percentage': {
            const percent = parseFloat(value.replace('%', ''));
            if (isNaN(percent)) {
                throw new ParseError(`Invalid percentage value: ${value}`);
            }
            return percent / 100;
        }

        case 'fraction': {
            const [numStr, denomStr] = value.split('/');
            const numerator = parseInt(numStr, 10);
            const denominator = parseInt(denomStr, 10);
            if (isNaN(numerator) || isNaN(denominator)) {
                throw new ParseError(`Invalid fraction: ${value}`);
            }
            if (denominator === 0) {
                throw new ParseError('Division by zero');
            }
            return numerator / denominator;
        }

        case 'complex': {
            if (value.endsWith('j') || value.endsWith('J')) {
                if (value === 'j' || value === 'J') {
                    return new Complex(0, 1);
                }
                if (value === '-j' || value === '-J') {
                    return new Complex(0, -1);
                }
                const match = value.slice(0, -1).match(/([+-]?\d*\.?\d+)([+-]\d*\.?\d+)/);
                if (!match) {
                    const imaginary = parseFloat(value.slice(0, -1));
                    if (isNaN(imaginary)) {
                        throw new ParseError(`Invalid complex number: ${value}`);
                    }
                    return new Complex(0, imaginary);
                }
                const real = parseFloat(match[1]);
                const imaginary = parseFloat(match[2]);
                if (isNaN(real) || isNaN(imaginary)) {
                    throw new ParseError(`Invalid complex number: ${value}`);
                }
                return new Complex(real, imaginary);
            }
            throw new ParseError(`Invalid complex number: ${value}`);
        }

        case 'scientific':
        case 'decimal': {
            const parsed = parseFloat(value);
            if (isNaN(parsed)) {
                throw new ParseError(`No valid numbers found in: ${value}`);
            }
            return parsed;
        }

        default:
            throw new ParseError(`Unknown number type: ${type}`);
    }
}

function validateType(
    value: number | Complex,
    type: ValidNumericType
): number | Complex {
    switch (type) {
        case 'int':
            if (value instanceof Complex) {
                throw new ParseError('Cannot convert complex number to int');
            }
            if (!Number.isFinite(value)) {
                throw new ParseError('Cannot convert infinite or NaN to int');
            }
            return Math.round(value);
        case 'float':
            if (value instanceof Complex) {
                throw new ParseError('Cannot convert complex number to float');
            }
            return value;
        case 'complex':
            return value instanceof Complex ? value : new Complex(value, 0);
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
    if (!Number.isFinite(value)) {
        return value;
    }
    return Number(value.toFixed(precision));
}

function convertType(
    value: number | Complex,
    targetType: ValidNumericType
): number | Complex {
    if (value instanceof Complex && targetType === 'float') {
        return value;
    }
    return validateType(value, targetType);
}
