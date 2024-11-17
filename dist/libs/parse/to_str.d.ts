type SerializeFormat = 'json' | 'xml';
interface SerializeOptions {
    stripLower?: boolean;
    chars?: string | null;
    strType?: SerializeFormat | null;
    useModelDump?: boolean;
    strParser?: (input: string) => Record<string, any>;
    parserKwargs?: Record<string, any>;
    indent?: number;
    rootTag?: string;
    [key: string]: any;
}
/**
 * Convert any input to its string representation.
 *
 * @param input - The input to convert to a string
 * @param options - Configuration options for string conversion
 * @returns The string representation of the input
 *
 * @example
 * ```typescript
 * toStr(123) // '123'
 * toStr('  HELLO  ', { stripLower: true }) // 'hello'
 * toStr({ a: 1 }, { serializeAs: 'json' }) // '{"a":1}'
 * toStr({ a: 1 }, { serializeAs: 'xml' }) // '<root><a>1</a></root>'
 * ```
 */
export declare function toStr(input: any, options?: SerializeOptions & {
    serializeAs?: SerializeFormat;
}): Promise<string>;
/**
 * Convert input to stripped and lowercase string representation.
 * This is a convenience wrapper around toStr that always applies
 * stripping and lowercasing.
 *
 * @param input - The input to convert to a string
 * @param options - Additional configuration options
 * @returns Stripped and lowercase string representation of the input
 *
 * @example
 * ```typescript
 * stripLower('  HELLO WORLD  ') // 'hello world'
 * ```
 */
export declare function stripLower(input: any, options?: Omit<SerializeOptions & {
    serializeAs?: SerializeFormat;
}, 'stripLower'>): Promise<string>;
export {};
