import { type NestedContainer, type NestedIndex } from './get_target_container';
import { UNDEFINED } from '../../types/undefined';

/**
 * Remove and return a value from a nested structure at the specified path.
 * 
 * @param input The nested structure to modify
 * @param indices The path to the value to remove
 * @param defaultValue Optional default value to return if path not found
 * @returns The removed value
 * @throws {Error} If indices list is empty
 * @throws {Error} If path not found and no default value provided
 */
export function npop(
  input: NestedContainer,
  indices: NestedIndex | NestedIndex[],
  defaultValue: any = UNDEFINED
): any {
  if (!indices || (Array.isArray(indices) && indices.length === 0)) {
    throw new Error('Indices list cannot be empty');
  }

  // Convert single index to array
  const indexArray = Array.isArray(indices) ? indices : [indices];

  try {
    // Navigate to parent container
    let current: any = input;
    for (let i = 0; i < indexArray.length - 1; i++) {
      const index = indexArray[i];
      if (Array.isArray(current)) {
        // For arrays, only accept numeric indices
        if (typeof index === 'string') {
          throw new Error('Invalid npop');
        }
        if (index < 0 || index >= current.length) {
          throw new Error('Invalid npop');
        }
        current = current[index];
      } else if (current && typeof current === 'object') {
        if (!(index in current)) {
          throw new Error('Invalid npop');
        }
        current = current[index];
      } else {
        throw new Error('Invalid npop');
      }
    }

    // Get last index
    const lastIndex = indexArray[indexArray.length - 1];

    // Handle array
    if (Array.isArray(current)) {
      // For arrays, only accept numeric indices
      if (typeof lastIndex === 'string') {
        throw new Error('Invalid npop');
      }
      if (lastIndex < 0 || lastIndex >= current.length) {
        throw new Error('Invalid npop');
      }
      const value = current[lastIndex];
      current.splice(lastIndex, 1);
      return value;
    }

    // Handle object
    if (current && typeof current === 'object') {
      if (!(lastIndex in current)) {
        throw new Error('Invalid npop');
      }
      const value = current[lastIndex];
      delete current[lastIndex];
      return value;
    }

    throw new Error('Invalid npop');
  } catch (error) {
    if (defaultValue !== UNDEFINED) {
      return defaultValue;
    }
    if (error instanceof Error && error.message !== 'Invalid npop') {
      throw new Error('Invalid npop');
    }
    throw error;
  }
}
