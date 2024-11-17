/**
 * Special type to represent undefined values in a type-safe way
 */
class UndefinedType {
  private readonly undefined: true = true;
  private static instance: UndefinedType;

  private constructor() {}

  public static getInstance(): UndefinedType {
    if (!UndefinedType.instance) {
      UndefinedType.instance = new UndefinedType();
    }
    return UndefinedType.instance;
  }

  public valueOf(): undefined {
    return undefined;
  }

  public toString(): string {
    return 'UNDEFINED';
  }

  public toJSON(): null {
    return null;
  }
}

/**
 * Singleton instance of UndefinedType
 */
export const UNDEFINED = Object.freeze(UndefinedType.getInstance());

/**
 * Type guard to check if a value is our UNDEFINED constant
 */
export function isUndefined(value: any): value is UndefinedType {
  return value === UNDEFINED;
}

/**
 * Type for our custom undefined
 */
export type Undefined = typeof UNDEFINED;

/**
 * Type for values that might be undefined
 */
export type MaybeUndefined<T> = T | Undefined;
