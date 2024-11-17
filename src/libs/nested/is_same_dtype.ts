/**
 * Type for constructor functions
 */
type Constructor = new (...args: any[]) => any;

/**
 * Interface for options when checking data types
 */
export interface IsSameDtypeOptions {
  /** The data type to check against. If not provided, uses type of first element */
  dtype?: Constructor;
  /** If true, returns tuple of [boolean, constructor function] */
  returnDtype?: boolean;
}

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
 * Check if all elements in a list or dict values are of the same data type.
 * 
 * @param input The input list or dictionary to check
 * @param options Optional configuration:
 *   - dtype: The data type to check against. If not provided, uses type of first element
 *   - returnDtype: If true, returns tuple of [boolean, constructor function]
 * @returns If returnDtype is false, returns true if all elements are of same type.
 *          If returnDtype is true, returns tuple [boolean, constructor function | null]
 * 
 * @example
 * ```typescript
 * isSameDtype([1, 2, 3]); // true
 * isSameDtype([1, '2', 3]); // false
 * isSameDtype([1, 2, 3], { dtype: Number }); // true
 * isSameDtype([1, 2, 3], { returnDtype: true }); // [true, Number]
 * ```
 */
export function isSameDtype(
  input: unknown[] | Record<string, unknown>,
  options: IsSameDtypeOptions = {}
): boolean | [boolean, Constructor | null] {
  const { dtype, returnDtype = false } = options;

  // Handle empty input
  if (Array.isArray(input) && input.length === 0) {
    return returnDtype ? [true, null] : true;
  }
  if (isPlainObject(input) && Object.keys(input).length === 0) {
    return returnDtype ? [true, null] : true;
  }

  // Get values to check
  const values = Array.isArray(input) ? input : Object.values(input);
  
  // Get first element and its type
  const firstElement = values[0];
  let firstElementType: Constructor | null = null;

  if (dtype) {
    firstElementType = dtype;
  } else if (firstElement !== null && firstElement !== undefined) {
    // Handle primitive types
    if (typeof firstElement === 'number') firstElementType = Number;
    else if (typeof firstElement === 'string') firstElementType = String;
    else if (typeof firstElement === 'boolean') firstElementType = Boolean;
    // Handle objects with constructors
    else if (typeof firstElement === 'object') {
      const constructor = firstElement.constructor as Constructor;
      if (constructor && constructor !== Object.prototype.constructor) {
        firstElementType = constructor;
      }
    }
  }

  // If no type can be determined
  if (!firstElementType) {
    return returnDtype ? [true, null] : true;
  }

  // Check if all elements match the type
  const result = values.every(element => {
    if (element === null || element === undefined) {
      return false;
    }

    // Handle primitive types
    if (firstElementType === Number) {
      return typeof element === 'number';
    }
    if (firstElementType === String) {
      return typeof element === 'string';
    }
    if (firstElementType === Boolean) {
      return typeof element === 'boolean';
    }

    // Handle objects and other types
    return element instanceof firstElementType || 
           (element.constructor && element.constructor === firstElementType);
  });

  return returnDtype ? [result, firstElementType] : result;
}
