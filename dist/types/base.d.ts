/**
* Type for any callable function
*/
export type Callable = (...args: any[]) => any;
/**
 * Type for dictionary with string keys
 */
export type Dict<T = any> = Record<string, T>;
/**
 * Type for a class constructor
 */
export type Constructor<T = any> = new (...args: any[]) => T;
/**
 * Type for field information
 */
export interface FieldInfo {
    type?: any;
    description?: string;
    required?: boolean;
    default?: any;
    defaultFactory?: () => any;
    validators?: Array<(value: any) => boolean | Promise<boolean>>;
    title?: string;
    examples?: any[];
    exclude?: boolean;
    deprecated?: boolean;
    frozen?: boolean;
    alias?: string;
    aliasPriority?: number;
}
/**
 * Type for model configuration
 */
export interface ModelConfig {
    extraFields?: boolean;
    validateDefaults?: boolean;
    populateByName?: boolean;
    arbitraryTypesAllowed?: boolean;
    useEnumValues?: boolean;
}
/**
 * Numeric type literals
 */
export type NumTypeLiteral = 'int' | 'float' | 'complex';
/**
 * Valid numeric types
 */
export type NumTypes = typeof Number | NumTypeLiteral;
/**
 * Type for dictionary with any keys and values
 */
export type KeysDict = Record<string, any>;
/**
 * Common configuration for models
 */
export declare const COMMON_CONFIG: {
    readonly populateByName: true;
    readonly arbitraryTypesAllowed: true;
    readonly useEnumValues: true;
};
