/**
 * Special type to represent undefined values in a type-safe way
 */
declare class UndefinedType {
    private readonly undefined;
    private static instance;
    private constructor();
    static getInstance(): UndefinedType;
    valueOf(): undefined;
    toString(): string;
    toJSON(): null;
}
/**
 * Singleton instance of UndefinedType
 */
export declare const UNDEFINED: Readonly<UndefinedType>;
/**
 * Type guard to check if a value is our UNDEFINED constant
 */
export declare function isUndefined(value: any): value is UndefinedType;
/**
 * Type for our custom undefined
 */
export type Undefined = typeof UNDEFINED;
/**
 * Type for values that might be undefined
 */
export type MaybeUndefined<T> = T | Undefined;
export {};
