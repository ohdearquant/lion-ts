"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FALSE_VALUES = exports.TRUE_VALUES = exports.PY_JSON_MAP = exports.MD_JSON_CHAR_MAP = exports.TYPE_MAP = exports.PATTERNS = void 0;
/**
 * Regular expression patterns for number parsing
 */
exports.PATTERNS = {
    scientific: /[-+]?(?:\d*\.)?\d+[eE][-+]?\d+/,
    complex_sci: /[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?[-+](?:\d*\.)?\d+(?:[eE][-+]?\d+)?[jJ]/,
    complex: /[-+]?(?:\d*\.)?\d+[-+](?:\d*\.)?\d+[jJ]/,
    pure_imaginary: /[-+]?(?:\d*\.)?\d*[jJ]/,
    percentage: /[-+]?(?:\d*\.)?\d+%/,
    fraction: /[-+]?\d+\/\d+/,
    decimal: /[-+]?(?:\d*\.)?\d+/,
    special: /[-+]?(?:inf|infinity|nan)/i
};
/**
 * Type mapping from string to native types
 */
exports.TYPE_MAP = {
    'int': Number,
    'float': Number,
    'complex': Number
};
/**
 * Character mapping for markdown to JSON conversion
 */
exports.MD_JSON_CHAR_MAP = {
    "'": '\\"',
    "\n": "\\n",
    "\r": "\\r",
    "\t": "\\t"
};
/**
 * Python to JSON type mapping
 */
exports.PY_JSON_MAP = {
    'str': 'string',
    'int': 'number',
    'float': 'number',
    'list': 'array',
    'tuple': 'array',
    'bool': 'boolean',
    'dict': 'object'
};
/**
 * Values considered as true in boolean conversion
 */
exports.TRUE_VALUES = new Set([
    'true',
    '1',
    'yes',
    'y',
    'on',
    'correct',
    't',
    'enabled',
    'enable',
    'active',
    'activated'
]);
/**
 * Values considered as false in boolean conversion
 */
exports.FALSE_VALUES = new Set([
    'false',
    '0',
    'no',
    'n',
    'off',
    'incorrect',
    'f',
    'disabled',
    'disable',
    'inactive',
    'deactivated',
    'none',
    'null',
    'n/a',
    'na'
]);
