/**
 * Options for list conversion
 */
interface ListOptions {
    flatten?: boolean;
    dropna?: boolean;
    unique?: boolean;
    useValues?: boolean;
}
/**
 * Convert various input types to a list
 *
 * @param input - Input to convert to list
 * @param options - Conversion options
 * @returns Converted list
 */
export declare function toList<T = any>(input: any, options?: ListOptions): T[];
/**
 * Utility functions for working with lists
 */
export declare const listUtils: {
    /**
     * Flatten a list to specified depth
     */
    flatten<T>(list: T[], depth?: number): T[];
    /**
     * Remove null and undefined values
     */
    dropNulls<T_1>(list: T_1[]): NonNullable<T_1>[];
    /**
     * Get unique values from list
     */
    unique<T_2>(list: T_2[]): T_2[];
    /**
     * Check if value is list-like
     */
    isListLike(value: any): boolean;
};
export {};
