import { type Undefined, UNDEFINED, type UndefinedType } from '../../types/undefined';
import { toDict } from './to_dict';
import { dictToXml } from './xml_parser';

type SerializeFormat = 'json' | 'xml';

interface SerializeOptions {
  stripLower?: boolean;
  chars?: string | null;
  strType?: SerializeFormat | null;
  useModelDump?: boolean;
  strParser?: (input: string) => Record<string, any>;
  parserKwargs?: Record<string, any>;
  [key: string]: any;
}

/**
 * Internal function to serialize input to JSON or XML format
 */
function serializeAs(
  input: any,
  format: SerializeFormat,
  options: SerializeOptions = {}
): string {
  const {
    stripLower = false,
    chars = null,
    strType = null,
    useModelDump = false,
    strParser = null,
    parserKwargs = {},
    ...kwargs
  } = options;

  try {
    const dict = toDict(input, {
      useModelDump,
      strType,
      suppress: true,
      parser: strParser,
      ...parserKwargs
    });

    if (strType || chars) {
      const str = JSON.stringify(dict);
      const processedStr = processString(str, stripLower, chars);
      const processedDict = JSON.parse(processedStr);
      
      if (format === 'json') {
        return JSON.stringify(processedDict, null, kwargs.indent);
      }
      
      return dictToXml(processedDict, kwargs);
    }

    if (format === 'json') {
      return JSON.stringify(dict, null, kwargs.indent);
    }

    return dictToXml(dict, kwargs);
  } catch (e) {
    throw new Error(
      `Failed to serialize input of ${input?.constructor?.name || typeof input} ` +
      `into <${strType}>`
    );
  }
}

/**
 * Convert input to its string representation
 */
function toStrType(input: any): string {
  if (input === null || input === undefined || input === UNDEFINED) {
    return '';
  }

  if (Array.isArray(input) && input.length === 0) {
    return '';
  }

  if (typeof input === 'object' && Object.keys(input).length === 0) {
    return '';
  }

  if (input instanceof Uint8Array || input instanceof ArrayBuffer) {
    return new TextDecoder().decode(input);
  }

  if (typeof input === 'string') {
    return input;
  }

  if (typeof input === 'object' && !Array.isArray(input)) {
    return JSON.stringify(input);
  }

  try {
    return String(input);
  } catch (e) {
    throw new Error(
      `Could not convert input of type <${input?.constructor?.name || typeof input}> to string`
    );
  }
}

/**
 * Process a string with optional lowercasing and character stripping
 */
function processString(
  s: string,
  stripLower: boolean,
  chars: string | null
): string {
  if (
    s === '' ||
    s === 'undefined' ||
    s === 'null' ||
    s === '[]' ||
    s === '{}'
  ) {
    return '';
  }

  if (stripLower) {
    s = s.toLowerCase();
    if (chars !== null) {
      const regex = new RegExp(`^[${chars}]+|[${chars}]+$`, 'g');
      s = s.replace(regex, '');
    } else {
      s = s.trim();
    }
  }
  return s;
}

/**
 * Convert any input to its string representation.
 * 
 * @param input - The input to convert to a string
 * @param options - Configuration options for string conversion
 * @returns The string representation of the input
 * 
 * @example
 * ```typescript
 * toStr(123) // '123'
 * toStr('  HELLO  ', { stripLower: true }) // 'hello'
 * toStr({ a: 1 }, { serializeAs: 'json' }) // '{"a":1}'
 * toStr({ a: 1 }, { serializeAs: 'xml' }) // '<root><a>1</a></root>'
 * ```
 */
export function toStr(
  input: any,
  options: SerializeOptions & { serializeAs?: SerializeFormat } = {}
): string {
  const {
    serializeAs: format,
    stripLower = false,
    chars = null,
    ...rest
  } = options;

  if (format) {
    return serializeAs(input, format, { stripLower, chars, ...rest });
  }

  let str = toStrType(input);
  if (stripLower || chars) {
    str = processString(str, stripLower, chars);
  }
  return str;
}

/**
 * Convert input to stripped and lowercase string representation.
 * This is a convenience wrapper around toStr that always applies
 * stripping and lowercasing.
 * 
 * @param input - The input to convert to a string
 * @param options - Additional configuration options
 * @returns Stripped and lowercase string representation of the input
 * 
 * @example
 * ```typescript
 * stripLower('  HELLO WORLD  ') // 'hello world'
 * ```
 */
export function stripLower(
  input: any,
  options: Omit<SerializeOptions & { serializeAs?: SerializeFormat }, 'stripLower'> = {}
): string {
  return toStr(input, { ...options, stripLower: true });
}
