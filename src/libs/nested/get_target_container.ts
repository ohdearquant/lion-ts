/**
 * Valid index types for nested structures
 */
export type NestedIndex = string | number;

/**
 * Valid container types for nested structures
 */
export type NestedContainer = Record<string, any> | any[];

/**
 * Get the container at the specified path in a nested structure.
 * 
 * @param nested The nested structure to navigate
 * @param indices The path to follow
 * @returns The container at the specified path
 * @throws {Error} If path is invalid or not found
 */
export function getTargetContainer(
  nested: NestedContainer,
  indices: NestedIndex[]
): NestedContainer {
  if (nested === null || nested === undefined) {
    throw new Error('Target not found');
  }

  let current: any = nested;

  for (const index of indices) {
    if (Array.isArray(current)) {
      if (typeof index === 'number' || (typeof index === 'string' && !isNaN(parseInt(index)))) {
        const numIndex = typeof index === 'string' ? parseInt(index) : index;
        if (numIndex < 0 || numIndex >= current.length) {
          throw new Error('List index is invalid or out of range');
        }
        current = current[numIndex];
      } else {
        throw new Error('Cannot use non-numeric index on array');
      }
    } else if (current && typeof current === 'object') {
      if (!(index in current)) {
        throw new Error('Key not found in dictionary');
      }
      current = current[index];
    } else {
      throw new Error('Current element is neither a list nor a dictionary');
    }
  }

  return current;
}
