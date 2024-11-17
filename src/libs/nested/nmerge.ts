/**
 * Options for merging nested structures
 */
export interface NMergeOptions {
  /** If true, overwrite existing keys in dictionaries */
  overwrite?: boolean;
  /** Enable unique key generation for duplicate keys by appending a sequence number */
  dictSequence?: boolean;
  /** Sort the resulting list after merging (only affects arrays) */
  sortList?: boolean;
  /** Custom sorting function for the merged list */
  customSort?: (a: unknown, b: unknown) => number;
}

/**
 * Type guard to check if a value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && 
         value !== null && 
         !Array.isArray(value) &&
         Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Deep merge two dictionaries recursively
 */
function deepMergeDicts(
  dict1: Record<string, unknown>,
  dict2: Record<string, unknown>,
  overwrite: boolean
): Record<string, unknown> {
  const result = { ...dict1 };

  for (const [key, value] of Object.entries(dict2)) {
    if (key in result) {
      if (isPlainObject(result[key]) && isPlainObject(value)) {
        result[key] = deepMergeDicts(
          result[key] as Record<string, unknown>,
          value,
          overwrite
        );
      } else if (overwrite) {
        result[key] = value;
      } else if (Array.isArray(result[key]) && Array.isArray(value)) {
        // If both are arrays, preserve array structure
        result[key] = [(result[key] as unknown[]), value];
      } else if (Array.isArray(result[key])) {
        // If result is already an array, append value
        (result[key] as unknown[]).push(value);
      } else if (Array.isArray(value)) {
        // If value is an array, prepend existing value
        result[key] = [result[key], value];
      } else {
        // Convert to array
        result[key] = [result[key], value];
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Merge multiple dictionaries into a single dictionary
 */
function mergeDicts(
  dicts: Record<string, unknown>[],
  dictUpdate: boolean,
  dictSequence: boolean
): Record<string, unknown> {
  const mergedDict: Record<string, unknown> = {};
  const sequenceCounters: Record<string, number> = {};

  for (const dict of dicts) {
    for (const [key, value] of Object.entries(dict)) {
      if (!(key in mergedDict) || dictUpdate) {
        if (key in mergedDict && isPlainObject(mergedDict[key]) && isPlainObject(value)) {
          mergedDict[key] = deepMergeDicts(
            mergedDict[key] as Record<string, unknown>,
            value,
            dictUpdate
          );
        } else {
          mergedDict[key] = value;
        }
      } else if (dictSequence) {
        sequenceCounters[key] = (sequenceCounters[key] || 0) + 1;
        const newKey = `${key}${sequenceCounters[key]}`;
        mergedDict[newKey] = value;
      } else if (isPlainObject(mergedDict[key]) && isPlainObject(value)) {
        mergedDict[key] = deepMergeDicts(
          mergedDict[key] as Record<string, unknown>,
          value,
          false
        );
      } else if (Array.isArray(mergedDict[key]) && Array.isArray(value)) {
        // If both are arrays, preserve array structure
        mergedDict[key] = [(mergedDict[key] as unknown[]), value];
      } else if (Array.isArray(mergedDict[key])) {
        // If result is already an array, append value
        (mergedDict[key] as unknown[]).push(value);
      } else if (Array.isArray(value)) {
        // If value is an array, prepend existing value
        mergedDict[key] = [mergedDict[key], value];
      } else {
        // Convert to array
        mergedDict[key] = [mergedDict[key], value];
      }
    }
  }

  return mergedDict;
}

/**
 * Merge multiple arrays into a single array
 */
function mergeArrays(
  arrays: unknown[][],
  sortList: boolean,
  customSort?: (a: unknown, b: unknown) => number
): unknown[] {
  let result = arrays.flat();

  if (sortList) {
    if (customSort) {
      result.sort(customSort);
    } else {
      result.sort((a, b) => {
        const aStr = String(a);
        const bStr = String(b);
        return aStr.localeCompare(bStr);
      });
    }
  }

  return result;
}

/**
 * Merge multiple dictionaries, lists, or sequences into a unified structure.
 * 
 * @param structures Array of structures to merge
 * @param options Optional configuration:
 *   - overwrite: If true, overwrite existing keys in dictionaries
 *   - dictSequence: Enable unique key generation for duplicate keys
 *   - sortList: Sort the resulting list after merging
 *   - customSort: Custom sorting function for the merged list
 * @returns Merged structure (dictionary or array)
 * 
 * @example
 * ```typescript
 * nmerge([{ a: 1 }, { b: 2 }]); // { a: 1, b: 2 }
 * nmerge([{ a: 1 }, { a: 2 }], { overwrite: true }); // { a: 2 }
 * nmerge([{ a: 1 }, { a: 2 }], { dictSequence: true }); // { a: 1, a1: 2 }
 * nmerge([[1, 3], [2, 4]], { sortList: true }); // [1, 2, 3, 4]
 * ```
 */
export function nmerge<T extends Record<string, unknown> | unknown[]>(
  structures: T[],
  options: NMergeOptions = {}
): T extends Record<string, unknown> ? Record<string, unknown> : unknown[] {
  const {
    overwrite = false,
    dictSequence = false,
    sortList = false,
    customSort
  } = options;

  if (!Array.isArray(structures)) {
    throw new TypeError('Input must be an array');
  }

  // Handle empty input
  if (structures.length === 0) {
    return (Array.isArray(structures[0]) ? [] : {}) as any;
  }

  // Check if all items are dictionaries
  if (structures.every(isPlainObject)) {
    return mergeDicts(
      structures as Record<string, unknown>[],
      overwrite,
      dictSequence
    ) as T extends Record<string, unknown> ? Record<string, unknown> : unknown[];
  }

  // Check if all items are arrays
  if (structures.every(Array.isArray)) {
    return mergeArrays(
      structures as unknown[][],
      sortList,
      customSort
    ) as T extends Record<string, unknown> ? Record<string, unknown> : unknown[];
  }

  throw new TypeError(
    'All items in the input array must be of the same type, ' +
    'either objects or arrays.'
  );
}
