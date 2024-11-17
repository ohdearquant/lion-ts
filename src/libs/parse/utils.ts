import { 
  UNDEFINED, 
  PATTERNS,
  TRUE_VALUES, 
  FALSE_VALUES,
} from '../../constants';

import { ValidNumericType } from './types';


import { ValueError, TypeError } from '../errors';

import type {
  ReadableJsonOptions,
  ToDictOptions,
  ToListOptions,
  StringKeyedDict
} from './types';

/**
 * Convert input to a human-readable JSON string
 */
export function asReadableJson(input: any, options: Partial<ReadableJsonOptions> = {}): string {
  const {
    indent = 4,
    ensureAscii = false,
    useDictDump = true,
    fuzzyParse = true,
    recursive = true,
    recursivePythonOnly = true,
    maxRecursiveDepth = 5,
  } = options;

  // Handle empty input
  if (!input) {
    if (Array.isArray(input)) return '';
    return '{}';
  }

  try {
    if (Array.isArray(input)) {
      // For lists, convert and format each item separately
      const items = input.map(item => {
        const dict = toDict(item, {
          useDictDump,
          fuzzyParse,
          recursive,
          recursivePythonOnly,
          maxRecursiveDepth,
        });
        return JSON.stringify(dict, null, indent);
      });
      return items.join('\n\n');
    }

    // Handle single items
    const dict = toDict(input, {
      useDictDump,
      fuzzyParse,
      recursive,
      recursivePythonOnly,
      maxRecursiveDepth,
    });

    return JSON.stringify(dict, null, indent);
  } catch (e) {
    throw new Error(`Failed to convert input to readable JSON: ${e}`);
  }
}

/**
 * Convert input to readable string with optional markdown formatting
 */
export function asReadable(input: any, md = false, options: Partial<ReadableJsonOptions> = {}): string {
  try {
    const result = asReadableJson(input, options);
    return md ? `\`\`\`json\n${result}\n\`\`\`` : result;
  } catch {
    return String(input);
  }
}

/**
 * Extract code blocks from markdown text
 */
export function extractCodeBlock(
  strToParse: string,
  returnAsList = false,
  languages: string[] | null = null,
  categorize = false
): string | string[] | Record<string, string[]> {
  const codeBlocks: string[] = [];
  const codeDict: Record<string, string[]> = {};

  const pattern = /^(?:```|~~~)[ \t]*([\w+-]*)[ \t]*\n(.*?)(?<=\n)^(?:```|~~~)[ \t]*$/gms;

  for (const match of strToParse.matchAll(pattern)) {
    const lang = match[1] || 'plain';
    const code = match[2];

    if (!languages || languages.includes(lang)) {
      if (categorize) {
        if (!codeDict[lang]) {
          codeDict[lang] = [];
        }
        codeDict[lang].push(code);
      } else {
        codeBlocks.push(code);
      }
    }
  }

  if (categorize) {
    return codeDict;
  }
  if (returnAsList) {
    return codeBlocks;
  }
  return codeBlocks.join('\n\n');
}

/**
 * Extract numbers from text using regex patterns
 */
export function extractNumbers(text: string): [string, string][] {
  const combinedPattern = Object.values(PATTERNS).join('|');
  const matches = text.matchAll(new RegExp(combinedPattern, 'gi'));
  const numbers: [string, string][] = [];

  for (const match of matches) {
    const value = match[0];
    // Check which pattern matched
    for (const [patternName, pattern] of Object.entries(PATTERNS)) {
      if (new RegExp(String(pattern), 'i').test(value)) {
        numbers.push([patternName, value]);
        break;
      }
    }
  }

  return numbers;
}

/**
 * Validate numeric type specification
 */
export function validateNumType(numType: ValidNumericType): NumberConstructor {
  if (typeof numType === 'string') {
    switch (numType) {
      case 'int':
      case 'float':
      case 'complex':
        return Number;
      default:
        throw new ValueError(`Invalid number type: ${numType}`);
    }
  }

  if (numType !== Number) {
    throw new ValueError(`Invalid number type: ${numType}`);
  }

  return numType;
}

/**
 * Validate and convert boolean values
 */
export function validateBoolean(x: any): boolean {
  if (x === null) {
    throw new TypeError('Cannot convert null to boolean');
  }

  if (typeof x === 'boolean') {
    return x;
  }

  // Handle numeric types
  if (typeof x === 'number') {
    return Boolean(x);
  }

  // Convert to string if not already
  const strValue = String(x).trim().toLowerCase();

  if (!strValue) {
    throw new ValueError('Cannot convert empty string to boolean');
  }

  if (TRUE_VALUES.has(strValue)) {
    return true;
  }

  if (FALSE_VALUES.has(strValue)) {
    return false;
  }

  // Try numeric conversion as last resort
  const num = Number(strValue);
  if (!isNaN(num)) {
    return Boolean(num);
  }

  throw new ValueError(
    `Cannot convert '${x}' to boolean. Valid true values are: ${[...TRUE_VALUES]}, ` +
    `valid false values are: ${[...FALSE_VALUES]}`
  );
}

/**
 * Convert special float values (inf, -inf, nan)
 */
export function convertSpecial(value: string): number {
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('infinity') || lowerValue.includes('inf')) {
    return lowerValue.startsWith('-') ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
  return Number.NaN;
}

/**
 * Convert percentage string to number
 */
export function convertPercentage(value: string): number {
  try {
    return Number(value.replace('%', '')) / 100;
  } catch (e) {
    throw new ValueError(`Invalid percentage value: ${value}`);
  }
}

/**
 * Convert fraction string to number
 */
export function convertFraction(value: string): number {
  const [num, denom] = value.split('/').map(Number);
  if (denom === 0) {
    throw new ValueError('Division by zero');
  }
  return num / denom;
}

/**
 * Basic dictionary conversion
 */
export function toDict(input: any, options: Partial<ToDictOptions> = {}): StringKeyedDict {
  if (input === null || input === UNDEFINED) {
    return {};
  }

  if (typeof input === 'object') {
    return { ...input };
  }

  try {
    return JSON.parse(input);
  } catch {
    return { [String(input)]: input };
  }
}

/**
 * Convert any input to array
 */
export function toList(
  input: any,
  options: Partial<ToListOptions> = {}
): any[] {
  const { flatten = false, dropna = false, unique = false, useValues = false } = options;

  if (unique && !flatten) {
    throw new ValueError('unique=true requires flatten=true');
  }

  if (input === null || input === UNDEFINED) {
    return [];
  }

  let result: any[];

  if (Array.isArray(input)) {
    result = input;
  } else if (typeof input === 'string') {
    result = useValues ? Array.from(input) : [input];
  } else if (typeof input === 'object') {
    result = useValues ? Object.values(input) : [input];
  } else {
    result = [input];
  }

  if (flatten) {
    result = result.flat(Infinity);
  }

  if (dropna) {
    result = result.filter(x => x != null);
  }

  if (unique) {
    result = [...new Set(result)];
  }

  return result;
}
