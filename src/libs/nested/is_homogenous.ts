/**
 * Type for constructor functions
 */
type Constructor = new (...args: any[]) => any;

/**
 * Type guard to check if a value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && 
         value !== null && 
         !Array.isArray(value) &&
         Object.getPrototypeOf(value) === Object.prototype;
}

/**
 * Check if all elements in a list or all values in a dict are of same type.
 * 
 * @param iterables The list or dictionary to check
 * @param typeCheck The type(s) to check against
 * @returns True if all elements/values are of the specified type(s), false otherwise
 * 
 * @example
 * ```typescript
 * isHomogenous([1, 2, 3], Number); // true
 * isHomogenous(['a', 'b'], String); // true
 * isHomogenous({ a: 1, b: 2 }, Number); // true
 * isHomogenous([1, '2'], Number); // false
 * ```
 */
export function isHomogenous(
  iterables: unknown[] | Record<string, unknown> | unknown,
  typeCheck: Constructor | Constructor[]
): boolean {
  // Convert single type to array for consistent handling
  const types = Array.isArray(typeCheck) ? typeCheck : [typeCheck];

  // Handle null/undefined
  if (iterables === null || iterables === undefined) {
    return false;
  }

  // Helper function to check if a value matches any of the types
  function matchesType(value: unknown): boolean {
    return types.some(type => {
      // Handle special cases
      if (type === Array) {
        return Array.isArray(value);
      }
      if (type === Object) {
        // For Object type, check if it's any kind of object (including class instances)
        // but not null
        return value !== null && typeof value === 'object';
      }

      // Handle primitive types
      if (type === Number) return typeof value === 'number';
      if (type === String) return typeof value === 'string';
      if (type === Boolean) return typeof value === 'boolean';

      // Handle class instances
      if (value === null || value === undefined) {
        return false;
      }

      // For class types, check if value is an instance of that type
      return value instanceof type;
    });
  }

  // Helper function to check if a value is an object (including class instances)
  function isObject(value: unknown): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  // Handle arrays
  if (Array.isArray(iterables)) {
    // Empty array is considered homogeneous for any type except Object
    if (iterables.length === 0) {
      return !types.includes(Object);
    }
    // If checking for Object type, check if all elements are objects
    if (types.length === 1 && types[0] === Object) {
      return iterables.every(isObject);
    }
    return iterables.every(matchesType);
  }

  // Handle objects
  if (isPlainObject(iterables)) {
    // Empty object is considered homogeneous for any type except Array
    if (Object.keys(iterables).length === 0) {
      return !types.includes(Array);
    }
    // If checking for Array type, check if all values are arrays
    if (types.length === 1 && types[0] === Array) {
      return Object.values(iterables).every(Array.isArray);
    }
    return Object.values(iterables).every(matchesType);
  }

  // Handle single value
  return matchesType(iterables);
}
