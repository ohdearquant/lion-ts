"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUndefined = exports.UNDEFINED = void 0;
/**
 * Special type to represent undefined values in a type-safe way
 */
class UndefinedType {
    constructor() {
        this.undefined = true;
    }
    static getInstance() {
        if (!UndefinedType.instance) {
            UndefinedType.instance = new UndefinedType();
        }
        return UndefinedType.instance;
    }
    valueOf() {
        return undefined;
    }
    toString() {
        return 'UNDEFINED';
    }
    toJSON() {
        return null;
    }
}
/**
 * Singleton instance of UndefinedType
 */
exports.UNDEFINED = Object.freeze(UndefinedType.getInstance());
/**
 * Type guard to check if a value is our UNDEFINED constant
 */
function isUndefined(value) {
    return value === exports.UNDEFINED;
}
exports.isUndefined = isUndefined;
