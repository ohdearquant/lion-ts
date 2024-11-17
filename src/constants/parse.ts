/**
 * Regular expression patterns for number parsing
 */
export const PATTERNS = {
  scientific: /[-+]?(?:\d*\.)?\d+[eE][-+]?\d+/,
  complex_sci: /[-+]?(?:\d*\.)?\d+(?:[eE][-+]?\d+)?[-+](?:\d*\.)?\d+(?:[eE][-+]?\d+)?[jJ]/,
  complex: /[-+]?(?:\d*\.)?\d+[-+](?:\d*\.)?\d+[jJ]/,
  pure_imaginary: /[-+]?(?:\d*\.)?\d*[jJ]/,
  percentage: /[-+]?(?:\d*\.)?\d+%/,
  fraction: /[-+]?\d+\/\d+/,
  decimal: /[-+]?(?:\d*\.)?\d+/,
  special: /[-+]?(?:inf|infinity|nan)/i
} as const;

/**
 * Type mapping from string to native types
 */
export const TYPE_MAP: Record<string, NumberConstructor> = {
  'int': Number,
  'float': Number,
  'complex': Number
};

/**
 * Character mapping for markdown to JSON conversion
 */
export const MD_JSON_CHAR_MAP: Record<string, string> = {
  "'": '\\"',
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t"
};

/**
 * Python to JSON type mapping
 */
export const PY_JSON_MAP: Record<string, string> = {
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
export const TRUE_VALUES = new Set([
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
export const FALSE_VALUES = new Set([
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
