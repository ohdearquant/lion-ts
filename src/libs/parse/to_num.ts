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

    // First try to match complex numbers with scientific notation
    let remaining = text;
    let match;

    // Try complex_sci first
    while ((match = remaining.match(PATTERNS.complex_sci))) {
        matches.push(['complex', match[0]]);
        remaining = remaining.slice(0, match.index) + ' ' + remaining.slice(match.index! + match[0].length);
    }

    // Then try other complex patterns
    while ((match = remaining.match(PATTERNS.complex))) {
        matches.push(['complex', match[0]]);
        remaining = remaining.slice(0, match.index) + ' ' + remaining.slice(match.index! + match[0].length);
    }

    while ((match = remaining.match(PATTERNS.pure_imaginary))) {
        matches.push(['complex', match[0]]);
        remaining = remaining.slice(0, match.index) + ' ' + remaining.slice(match.index! + match[0].length);
    }

    // Then try other patterns on the remaining text
    const tokens = remaining.split(/[\s,;:]+/);
    for (const token of tokens) {
        if (!token) continue;
        
        if (PATTERNS.scientific.test(token)) {
            matches.push(['scientific', token]);
        } else if (PATTERNS.percentage.test(token)) {
            matches.push(['percentage', token]);
        } else if (PATTERNS.fraction.test(token)) {
            matches.push(['fraction', token]);
        } else if (PATTERNS.special.test(token)) {
            matches.push(['special', token]);
        } else if (PATTERNS.decimal.test(token)) {
            const cleanValue = token.trim();
            const dec = parseFloat(cleanValue);
            if (!isNaN(dec)) {
                matches.push(['decimal', cleanValue]);
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
            if (lower.includes('nan')) return NaN;
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
            const numerator = parseFloat(numStr);
            const denominator = parseFloat(denomStr);
            if (isNaN(numerator) || isNaN(denominator)) {
                throw new ParseError(`Invalid fraction: ${value}`);
            }
            if (denominator === 0) {
                throw new ParseError('Division by zero');
            }
            return numerator / denominator;
        }

        case 'complex': {
            try {
                if (value === 'j' || value === 'J') {
                    return new Complex(0, 1);
                }
                if (value === '+j' || value === '+J') {
                    return new Complex(0, 1);
                }
                if (value === '-j' || value === '-J') {
                    return new Complex(0, -1);
                }

                // Handle pure imaginary numbers
                if (value.endsWith('j') || value.endsWith('J')) {
                    if (!value.includes('+') && !value.includes('-', 1)) {
                        const imag = parseFloat(value.slice(0, -1) || '1');
                        if (isNaN(imag)) {
                            throw new ParseError(`Invalid complex number: ${value}`);
                        }
                        return new Complex(0, imag);
                    }
                }

                // Remove j/J suffix
                const withoutJ = value.slice(0, -1);

                // Split into real and imaginary parts
                const parts = withoutJ.split(/([+-])/);
                let real = 0;
                let imag = 0;

                if (parts.length === 1) {
                    // Single number (imaginary part)
                    imag = parseFloat(parts[0] || '1');
                } else {
                    // Handle scientific notation and regular numbers
                    const realPart = parts[0];
                    const sign = parts[1];
                    const imagPart = parts.slice(2).join('');
                    
                    real = parseFloat(realPart);
                    imag = parseFloat(sign + (imagPart || '1'));
                }

                if (isNaN(real) || isNaN(imag)) {
                    throw new ParseError(`Invalid complex number: ${value}`);
                }

                return new Complex(real, imag);
            } catch (e) {
                throw new ParseError(`Invalid complex number: ${value}`);
            }
        }

        case 'scientific':
        case 'decimal': {
            const cleanValue = value.trim();
            const dec = parseFloat(cleanValue);
            if (isNaN(dec)) {
                throw new ParseError(`No valid numbers found in: ${value}`);
            }
            return dec;
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
