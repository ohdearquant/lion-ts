import { type NestedContainer, type NestedIndex } from './get_target_container';
import { UNDEFINED } from '../../types/undefined';

/**
 * Set a value within a nested structure at the specified path.
 * If the path doesn't exist, it will be created.
 * 
 * @param nested The nested structure to modify
 * @param indices The path where to set the value
 * @param value The value to set
 */
export function nset(
  nested: any,
  indices: string | number | (string | number)[],
  value: any
): void {
  if (!indices || (Array.isArray(indices) && indices.length === 0)) {
    throw new Error('Indices list cannot be empty');
  }

  // Convert single index to array
  const indexArray = Array.isArray(indices) ? indices : [indices];

  let current: any = nested;
  for (let i = 0; i < indexArray.length - 1; i++) {
    const index = indexArray[i];
    const nextIndex = indexArray[i + 1];

    if (Array.isArray(current)) {
      const numIndex = typeof index === 'number' ? index : parseInt(index as string);
      if (isNaN(numIndex)) {
        throw new TypeError('Cannot use non-numeric index on array');
      }

      while (current.length <= numIndex) {
        current.push(null);
      }

      if (current[numIndex] === null || typeof current[numIndex] !== 'object') {
        current[numIndex] = (typeof nextIndex === 'number' || !isNaN(parseInt(String(nextIndex)))) ? [] : {};
      }
      current = current[numIndex];
    } else if (current && typeof current === 'object') {
      const key = String(index);
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        current[key] = (typeof nextIndex === 'number' || !isNaN(parseInt(String(nextIndex)))) ? [] : {};
      }
      current = current[key];
    } else {
      throw new TypeError('Cannot set property on non-object/non-array');
    }
  }

  // Handle the last index
  const lastIndex = indexArray[indexArray.length - 1];

  if (Array.isArray(current)) {
    const numIndex = typeof lastIndex === 'number' ? lastIndex : parseInt(lastIndex as string);
    if (isNaN(numIndex)) {
      throw new TypeError('Cannot use non-numeric index on array');
    }
    while (current.length <= numIndex) {
      current.push(null);
    }
    current[numIndex] = value;
  } else if (current && typeof current === 'object') {
    const key = String(lastIndex);
    current[key] = value;
  } else {
    throw new TypeError('Cannot set property on non-object/non-array');
  }
}
