export interface FlattenOptions {
  sep?: string;
  maxDepth?: number;
  dictOnly?: boolean;
  inplace?: boolean;
  coerceKeys?: boolean;
  dynamic?: boolean;
  coerceSequence?: 'dict' | 'list' | null;
}

/**
 * Flatten a nested structure into a single-level dictionary.
 * 
 * @param input The nested structure to flatten
 * @param options Optional configuration:
 *   - sep: Separator for joining keys (default: '|')
 *   - maxDepth: Maximum depth to flatten (default: unlimited)
 *   - dictOnly: Only flatten dictionary structures (default: false)
 *   - inplace: Modify input object in place (default: false)
 *   - coerceKeys: Convert non-string keys to strings (default: false)
 *   - dynamic: Allow dynamic key generation (default: false)
 *   - coerceSequence: How to handle sequences ('dict', 'list', or null) (default: null)
 * @returns Flattened dictionary
 * @throws {Error} If input is null or has invalid key types
 */
export function flatten(
  input: any,
  options: FlattenOptions = {}
): Record<string, any> {
  const {
    sep = '|',
    maxDepth = undefined,
    dictOnly = false,
    inplace = false,
    coerceKeys = false,
    dynamic = false,
    coerceSequence = null,
  } = options;

  if (input === null || input === undefined) {
    throw new Error('Cannot flatten null objects');
  }

  if (inplace && !isPlainObject(input)) {
    throw new Error("Object must be a dictionary when 'inplace' is True");
  }

  const result: Record<string, any> = {};

  function flattenRecursive(obj: any, prefix: string = '', depth: number = 0): void {
    if (maxDepth !== undefined && depth >= maxDepth) {
      result[prefix] = obj;
      return;
    }

    if (Array.isArray(obj) && !dictOnly) {
      if (obj.length === 0) {
        if (prefix) result[prefix] = obj;
      } else {
        obj.forEach((item, index) => {
          const newPrefix = prefix ? `${prefix}${sep}${index}` : `${index}`;
          if (isNestedStructure(item) && (!dictOnly || isPlainObject(item))) {
            flattenRecursive(item, newPrefix, depth + 1);
          } else {
            result[newPrefix] = item;
          }
        });
      }
    } else if (isPlainObject(obj)) {
      if (Object.keys(obj).length === 0) {
        if (prefix) result[prefix] = obj;
      } else {
        for (const key of Object.keys(obj)) {
          // Check if key is numeric
          if (!coerceKeys && !isNaN(Number(key)) && key !== '') {
            throw new Error('Unsupported key type: number. Only string keys are acceptable');
          }
          const value = obj[key];
          const newPrefix = prefix ? `${prefix}${sep}${key}` : key;
          if (isNestedStructure(value) && (!dictOnly || isPlainObject(value))) {
            flattenRecursive(value, newPrefix, depth + 1);
          } else {
            result[newPrefix] = value;
          }
        }
      }
    } else {
      if (prefix) result[prefix] = obj;
    }
  }

  flattenRecursive(input);

  if (inplace && isPlainObject(input)) {
    // Type assertion since we know input is a plain object at this point
    const inputObj = input as Record<string, any>;
    Object.keys(inputObj).forEach(key => delete inputObj[key]);
    Object.assign(inputObj, result);
    return inputObj;
  }

  return result;
}

function isPlainObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

function isNestedStructure(value: any): boolean {
  return value !== null && typeof value === 'object' && !(value instanceof Set) && !(value instanceof Map);
}
