/**
 * Insert a value into a nested structure at a specified path.
 * Creates intermediate containers (arrays or objects) as needed.
 * 
 * @param data The nested structure to modify
 * @param indices The path where to insert the value
 * @param value The value to insert
 */
export function ninsert(
  data: any,
  indices: Array<string | number>,
  value: any
): void {
  if (!indices || indices.length === 0) {
    throw new Error('Indices list cannot be empty');
  }

  let currentElement: any = data;
  for (let i = 0; i < indices.length - 1; i++) {
    const index = indices[i];
    const nextIndex = indices[i + 1];

    if (Array.isArray(currentElement)) {
      if (typeof index === 'string' && isNaN(parseInt(index))) {
        throw new TypeError('Cannot use string key on non-object');
      }
      const numIndex = typeof index === 'number' ? index : parseInt(index as string);
      while (currentElement.length <= numIndex) {
        currentElement.push(null);
      }

      if (currentElement[numIndex] === null || typeof currentElement[numIndex] !== 'object') {
        currentElement[numIndex] = (typeof nextIndex === 'number' || !isNaN(parseInt(String(nextIndex)))) ? [] : {};
      }
      currentElement = currentElement[numIndex];
    } else if (currentElement && typeof currentElement === 'object') {
      if (typeof index === 'number') {
        throw new TypeError('Cannot use numeric index on non-array');
      }
      const key = String(index);
      if (!(key in currentElement) || currentElement[key] === null || typeof currentElement[key] !== 'object') {
        currentElement[key] = (typeof nextIndex === 'number' || !isNaN(parseInt(String(nextIndex)))) ? [] : {};
      }
      currentElement = currentElement[key];
    } else {
      throw new TypeError('Cannot set property on non-object/non-array');
    }
  }

  // Handle the last index
  const lastIndex = indices[indices.length - 1];

  if (Array.isArray(currentElement)) {
    if (typeof lastIndex === 'string' && isNaN(parseInt(lastIndex))) {
      throw new TypeError('Cannot use string key on non-object');
    }
    const numIndex = typeof lastIndex === 'number' ? lastIndex : parseInt(lastIndex as string);
    while (currentElement.length <= numIndex) {
      currentElement.push(null);
    }
    currentElement[numIndex] = value;
  } else if (currentElement && typeof currentElement === 'object') {
    if (typeof lastIndex === 'number') {
      throw new TypeError('Cannot use numeric index on non-array');
    }
    const key = String(lastIndex);
    currentElement[key] = value;
  } else {
    throw new TypeError('Cannot insert into non-object/non-array');
  }
}
