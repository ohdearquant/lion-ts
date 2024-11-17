import type { NestedContainer } from './get_target_container';

export interface UnflattenOptions {
  sep?: string;
  inplace?: boolean;
}

/**
 * Convert a flattened dictionary back into a nested structure.
 * 
 * @param flatDict The flattened dictionary to unflatten
 * @param options Optional configuration:
 *   - sep: Separator used in flattened keys (default: '|')
 *   - inplace: Modify input object in place (default: false)
 * @returns The unflattened nested structure
 * @throws {Error} If input is invalid or has invalid key types
 */
export function unflatten(
  flatDict: Record<string, any>,
  options: UnflattenOptions = {}
): NestedContainer {
  const { sep = '|', inplace = false } = options;

  if (!flatDict || typeof flatDict !== 'object') {
    throw new Error('Input must be a dictionary');
  }

  if (sep === '') {
    throw new Error('Separator cannot be empty');
  }

  // Handle empty input
  if (Object.keys(flatDict).length === 0) {
    return {};
  }

  // Check if all keys are numeric to determine if result should be an array
  const allNumericKeys = Object.keys(flatDict).every(key => {
    const firstPart = key.split(sep)[0];
    return !isNaN(parseInt(firstPart));
  });

  const result: Record<string, any> = allNumericKeys ? [] : {};

  for (const [key, value] of Object.entries(flatDict)) {
    if (typeof key !== 'string') {
      throw new TypeError('Keys must be strings');
    }

    const parts = key.split(sep);
    let current: Record<string, any> = result;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const nextPart = parts[i + 1];
      const isNextNumeric = !isNaN(parseInt(nextPart));

      if (!(part in current)) {
        current[part] = isNextNumeric ? [] : {};
      } else if (typeof current[part] !== 'object') {
        // If we encounter a non-object where we need an object, create one
        current[part] = isNextNumeric ? [] : {};
      }

      current = current[part] as Record<string, any>;
    }

    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  }

  // Convert numeric indices to actual arrays
  function convertNumericIndices(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => convertNumericIndices(item));
    }
    
    if (obj && typeof obj === 'object') {
      const allNumeric = Object.keys(obj).every(key => !isNaN(parseInt(key)));
      if (allNumeric && Object.keys(obj).length > 0) {
        const maxIndex = Math.max(...Object.keys(obj).map(k => parseInt(k)));
        const arr = new Array(maxIndex + 1).fill(null);
        for (const [key, value] of Object.entries(obj)) {
          arr[parseInt(key)] = convertNumericIndices(value);
        }
        return arr;
      }

      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = convertNumericIndices(value);
      }
      return result;
    }

    return obj;
  }

  const finalResult = convertNumericIndices(result);

  if (inplace && typeof flatDict === 'object' && !Array.isArray(flatDict)) {
    Object.keys(flatDict).forEach(key => delete flatDict[key]);
    Object.assign(flatDict, finalResult);
    return flatDict as NestedContainer;
  }

  return finalResult as NestedContainer;
}
