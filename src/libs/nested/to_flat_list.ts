/**
 * Options for flattening lists
 */
export interface ToFlatListOptions {
  /** Remove null and undefined values from result */
  dropna?: boolean;
  /** Remove duplicate values from result */
  unique?: boolean;
}

/**
 * Type guard to check if a value is iterable
 */
function isIterable(value: unknown): value is Iterable<unknown> {
  return value !== null && 
         value !== undefined && 
         typeof value === 'object' && 
         Symbol.iterator in value;
}

/**
 * Generator function to flatten a list recursively
 */
function* flattenListGenerator(
  list: unknown[],
  dropna: boolean,
  seen = new WeakSet()
): Generator<unknown> {
  for (const item of list) {
    if (Array.isArray(item)) {
      // Handle circular references
      if (seen.has(item)) {
        continue;
      }
      seen.add(item);
      yield* flattenListGenerator(item, dropna, seen);
    } else if (!dropna || (item !== null && item !== undefined)) {
      yield item;
    }
  }
}

/**
 * Filter out null and undefined values from an array
 */
function dropNaValues(arr: unknown[]): unknown[] {
  return arr.filter(item => item !== null && item !== undefined);
}

/**
 * Convert Map entries to array format
 */
function mapToArray(map: Map<unknown, unknown>): unknown[] {
  return Array.from(map.entries()).map(([key, value]) => [key, value]);
}

/**
 * Convert any input into a flattened list.
 * 
 * @param input The input to convert to a flat list
 * @param options Optional configuration:
 *   - dropna: Remove null and undefined values from result
 *   - unique: Remove duplicate values from result
 * @returns A flattened list
 * 
 * @example
 * ```typescript
 * toFlatList([1, [2, 3], [[4]]]); // [1, 2, 3, 4]
 * toFlatList([1, null, [2, undefined]], { dropna: true }); // [1, 2]
 * toFlatList([1, [2, 1], [2]], { unique: true }); // [1, 2]
 * ```
 */
export function toFlatList(
  input: unknown,
  { dropna = false, unique = false }: ToFlatListOptions = {}
): unknown[] {
  // Handle null/undefined input
  if (input === null || input === undefined) {
    return [];
  }

  // Handle non-iterable input
  if (!isIterable(input) || typeof input === 'string' || input instanceof Uint8Array) {
    return [input];
  }

  // Handle Map input
  if (input instanceof Map) {
    return mapToArray(input);
  }

  // Convert input to array if it's not already
  const inputArray = Array.isArray(input) ? input : Array.from(input);

  // Handle empty input
  if (inputArray.length === 0) {
    return [];
  }

  // Flatten the list
  let result = Array.from(flattenListGenerator(inputArray, dropna));

  // Apply dropna if requested
  if (dropna) {
    result = dropNaValues(result);
  }

  // Remove duplicates if requested
  if (unique) {
    try {
      // Try to use Set for primitive values
      result = Array.from(new Set(result));
    } catch {
      // If Set conversion fails (e.g., with objects), use manual deduplication
      const seen = new Set();
      result = result.filter(item => {
        const key = typeof item === 'object' ? JSON.stringify(item) : item;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  }

  return result;
}
