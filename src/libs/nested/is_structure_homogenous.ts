/**
 * Type for constructor functions
 */
type Constructor = new (...args: any[]) => any;

/**
 * Interface for options when checking structure homogeneity
 */
export interface IsStructureHomogenousOptions {
  /** If true, returns tuple of [boolean, constructor function] */
  returnStructureType?: boolean;
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
 * Check if a nested structure is homogeneous (no mix of arrays and objects).
 * 
 * @param structure The nested structure to check
 * @param options Optional configuration:
 *   - returnStructureType: If true, returns tuple of [boolean, constructor function]
 * @returns If returnStructureType is false, returns true if structure is homogeneous.
 *          If returnStructureType is true, returns tuple [boolean, constructor function | null]
 * 
 * @example
 * ```typescript
 * isStructureHomogenous({ a: { b: 1 }, c: { d: 2 } }); // true
 * isStructureHomogenous({ a: { b: 1 }, c: [1, 2] }); // false
 * isStructureHomogenous([[1, 2], [3, 4]]); // true
 * isStructureHomogenous({ a: [1], b: { c: 2 } }); // false
 * ```
 */
export function isStructureHomogenous(
  structure: unknown,
  options: IsStructureHomogenousOptions = {}
): boolean | [boolean, Constructor | null] {
  const { returnStructureType = false } = options;

  function checkStructure(
    substructure: unknown
  ): [boolean, Constructor | null] {
    // Handle arrays
    if (Array.isArray(substructure)) {
      let hasNestedArrays = false;
      for (const item of substructure) {
        // Skip non-container items
        if (!isPlainObject(item) && !Array.isArray(item)) {
          continue;
        }
        // If item is a container but not an array, structure is not homogeneous
        if (!Array.isArray(item)) {
          return [false, null];
        }
        hasNestedArrays = true;
        // Recursively check nested arrays
        const [isHomogeneous] = checkStructure(item);
        if (!isHomogeneous) {
          return [false, null];
        }
      }
      return [true, hasNestedArrays ? Array : null];
    }

    // Handle objects
    if (isPlainObject(substructure)) {
      let hasNestedObjects = false;
      for (const value of Object.values(substructure)) {
        // Skip non-container values
        if (!isPlainObject(value) && !Array.isArray(value)) {
          continue;
        }
        // If value is a container but not an object, structure is not homogeneous
        if (!isPlainObject(value)) {
          return [false, null];
        }
        hasNestedObjects = true;
        // Recursively check nested objects
        const [isHomogeneous] = checkStructure(value);
        if (!isHomogeneous) {
          return [false, null];
        }
      }
      return [true, hasNestedObjects ? Object : null];
    }

    // Non-container types are considered homogeneous
    return [true, null];
  }

  // Handle null/undefined
  if (structure === null || structure === undefined) {
    return returnStructureType ? [true, null] : true;
  }

  // Handle empty structures
  if (Array.isArray(structure) && structure.length === 0) {
    return returnStructureType ? [true, null] : true;
  }
  if (isPlainObject(structure) && Object.keys(structure).length === 0) {
    return returnStructureType ? [true, null] : true;
  }

  // Handle primitive values
  if (!isPlainObject(structure) && !Array.isArray(structure)) {
    return returnStructureType ? [true, null] : true;
  }

  const [isHomogeneous, structureType] = checkStructure(structure);
  return returnStructureType ? [isHomogeneous, structureType] : isHomogeneous;
}
