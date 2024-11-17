"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueError = exports.ConversionError = exports.ValidationError = exports.ParseError = exports.Complex = void 0;
/**
 * Complex number class
 */
class Complex {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }
    toString() {
        return `${this.real}${this.imag >= 0 ? '+' : ''}${this.imag}j`;
    }
}
exports.Complex = Complex;
/**
 * Common error types
 */
class ParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ParseError';
    }
}
exports.ParseError = ParseError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ConversionError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConversionError';
    }
}
exports.ConversionError = ConversionError;
/**
 * Custom error for value-related errors
 */
class ValueError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValueError';
    }
}
exports.ValueError = ValueError;
