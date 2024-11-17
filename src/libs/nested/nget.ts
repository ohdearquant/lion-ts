import { UNDEFINED } from '../../types/undefined';
import { type NestedIndex } from './get_target_container';

/**
 * Get a value from a nested structure using a list of indices
 * 
 * @param nested The nested structure to get from
 * @param indices List of indices to traverse
 * @param defaultValue Value to return if path not found
 * @returns The value at the specified path or defaultValue if not found
 * @throws {Error} If path not found and no default value provided
 * 
 * @example
 * ```typescript
 * nget({ a: { b: [1, 2] } }, ['a', 'b', 1]); // 2
 * nget({ a: { b: 1 } }, ['a', 'c'], 'default'); // 'default'
 * ```
 */
export function nget(
  nested: any,
  indices: NestedIndex[],
  defaultValue: any = UNDEFINED
): any {
  // Handle empty indices - return the entire structure
  if (!indices || indices.length === 0) {
    return nested;
  }

  try {
    // Handle null/undefined/primitive input
    if (nested === null || nested === undefined || typeof nested !== 'object') {
      throw new Error('Target not found');
    }

    // Handle single index case
    if (indices.length === 1) {
      const index = indices[0];
      if (Array.isArray(nested)) {
        // For arrays, only accept numeric indices
        if (typeof index === 'string') {
          throw new Error('Target not found');
        }
        if (index < 0 || index >= nested.length) {
          throw new Error('Target not found');
        }
        return nested[index];
      }
      if (nested && typeof nested === 'object') {
        if (!(index in nested)) {
          throw new Error('Target not found');
        }
        return nested[index];
      }
      throw new Error('Target not found');
    }

    // Handle multi-index case
    let current: any = nested;
    for (let i = 0; i < indices.length - 1; i++) {
      const index = indices[i];
      if (Array.isArray(current)) {
        // For arrays, only accept numeric indices
        if (typeof index === 'string') {
          throw new Error('Target not found');
        }
        if (index < 0 || index >= current.length) {
          throw new Error('Target not found');
        }
        current = current[index];
      } else if (current && typeof current === 'object') {
        if (!(index in current)) {
          throw new Error('Target not found');
        }
        current = current[index];
      } else {
        throw new Error('Target not found');
      }
    }

    const lastIndex = indices[indices.length - 1];
    if (Array.isArray(current)) {
      // For arrays, only accept numeric indices
      if (typeof lastIndex === 'string') {
        throw new Error('Target not found');
      }
      if (lastIndex < 0 || lastIndex >= current.length) {
        throw new Error('Target not found');
      }
      return current[lastIndex];
    }

    if (current && typeof current === 'object') {
      if (!(lastIndex in current)) {
        throw new Error('Target not found');
      }
      return current[lastIndex];
    }

    throw new Error('Target not found');
  } catch (error) {
    if (defaultValue !== UNDEFINED) {
      return defaultValue;
    }
    throw new Error('Target not found and no default value provided');
  }
}
