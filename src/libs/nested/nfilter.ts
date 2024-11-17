import type { NestedContainer } from './get_target_container';

/**
 * Filter elements in a nested structure based on a condition.
 * 
 * @param nested The nested structure (dict or list) to filter
 * @param condition Function returning true for elements to keep, false to discard
 * @returns The filtered nested structure
 * @throws {Error} If nested is not a dict or list
 * 
 * @example
 * ```typescript
 * const data = { a: 1, b: { c: 2, d: 3 }, e: [4, 5, 6] };
 * nfilter(data, x => typeof x === 'number' && x > 2);
 * // { b: { d: 3 }, e: [4, 5, 6] }
 * ```
 */
export function nfilter<T extends NestedContainer>(
  nested: T,
  condition: (value: any) => boolean,
  seen = new WeakSet()
): T {
  if (nested === null || nested === undefined) {
    throw new TypeError('The nested_structure must be either a dict or a list.');
  }

  // Handle circular references
  if (typeof nested === 'object') {
    if (seen.has(nested)) {
      return nested;
    }
    seen.add(nested);
  }

  // Helper function to check if a value or its nested values match the condition
  function hasMatchingValues(value: any, seenValues = new WeakSet()): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value !== 'object') {
      return condition(value);
    }
    if (seenValues.has(value)) {
      return false;
    }
    seenValues.add(value);
    if (Array.isArray(value)) {
      return value.some(item => 
        typeof item !== 'object' ? condition(item) : hasMatchingValues(item, seenValues)
      );
    }
    return Object.values(value).some(item => 
      typeof item !== 'object' ? condition(item) : hasMatchingValues(item, seenValues)
    );
  }

  // Helper function to filter arrays
  function filterArray(arr: any[], seenValues = new WeakSet()): any[] {
    if (seenValues.has(arr)) {
      return arr;
    }
    seenValues.add(arr);

    const result: any[] = [];
    for (const item of arr) {
      if (typeof item !== 'object') {
        if (condition(item)) {
          result.push(item);
        }
      } else if (item !== null) {
        if (Array.isArray(item)) {
          const filtered = filterArray(item, seenValues);
          if (filtered.length > 0) {
            result.push(...filtered); // Flatten nested arrays
          }
        } else {
          const filtered = filterObject(item, seenValues);
          if (Object.keys(filtered).length > 0) {
            result.push(filtered);
          }
        }
      }
    }
    return result;
  }

  // Helper function to filter objects
  function filterObject(obj: Record<string, any>, seenValues = new WeakSet()): Record<string, any> {
    if (seenValues.has(obj)) {
      return obj;
    }
    seenValues.add(obj);

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== 'object') {
        if (condition(value)) {
          result[key] = value;
        }
      } else if (value !== null) {
        if (Array.isArray(value)) {
          const filtered = filterArray(value, seenValues);
          if (filtered.length > 0) {
            result[key] = filtered;
          }
        } else {
          const filtered = filterObject(value, seenValues);
          if (Object.keys(filtered).length > 0) {
            result[key] = filtered;
          }
        }
      }
    }
    return result;
  }

  // Helper function to filter top-level object
  function filterTopLevelObject(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== 'object') {
        if (condition(value)) {
          result[key] = value;
        }
      } else if (value !== null) {
        if (Array.isArray(value)) {
          const filtered = filterArray(value);
          if (filtered.some(item => typeof item !== 'object' ? condition(item) : hasMatchingValues(item))) {
            result[key] = filtered;
          }
        } else {
          const filtered = filterObject(value);
          if (Object.keys(filtered).length > 0) {
            result[key] = filtered;
          }
        }
      }
    }
    return result;
  }

  if (Array.isArray(nested)) {
    return filterArray(nested) as T;
  }

  if (nested && typeof nested === 'object') {
    return filterTopLevelObject(nested) as T;
  }

  throw new TypeError('The nested_structure must be either a dict or a list.');
}
