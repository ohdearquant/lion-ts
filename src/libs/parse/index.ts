// Type definitions
export * from './types';

// Core conversion functions
export { toDict } from './to_dict';
export { toList, listUtils } from './to_list';
export { toStr, stripLower } from './to_str';
export { toNum } from './to_num';

// XML parsing
export { xmlToDict, xmlToDictSync, dictToXml } from './xml_parser';

// JSON parsing and utilities
export { fuzzyParseJson } from './fuzzy_parse_json';
export { toJson } from './to_json';
export { asReadable, asReadableJson } from './as_readable';

// Validation utilities
export { validateBoolean } from './validate_boolean';
export { validateKeys } from './validate_keys';
export { validateMapping } from './validate_mapping';

// Extraction utilities
export { extractCodeBlock } from './extract_code_block';
export { extractDocstring } from './extract_docstring';
export { extractJsonBlocks, extractBlock } from './extract_json_blocks';
export { extractJsonSchema } from './extract_json_schema';

// Schema utilities
export { functionToSchema, param, doc } from './function_to_schema';
export { jsonSchemaToGrammar, grammarUtils } from './json_schema_to_cfg';
export { jsonSchemaToRegex, regexUtils } from './json_schema_to_regex';

/**
 * @module parse
 * 
 * A comprehensive parsing library for TypeScript that provides utilities for:
 * 
 * - Type conversion (dict, list, string, number)
 * - XML/JSON parsing and serialization
 * - Data validation
 * - Code and documentation extraction
 * - Schema generation and conversion
 * 
 * Key features:
 * 
 * - Strong TypeScript typing
 * - Comprehensive error handling
 * - Flexible configuration options
 * - Support for complex data structures
 * - Utilities for common parsing tasks
 * 
 * @example Basic Usage
 * ```typescript
 * import { toDict, toList, toStr, toNum } from './parse';
 * 
 * // Convert to dictionary
 * const dict = toDict('{"a": 1}');  // { a: 1 }
 * 
 * // Convert to list
 * const list = toList('abc', { useValues: true });  // ['a', 'b', 'c']
 * 
 * // Convert to string
 * const str = toStr({ a: 1 }, { serializeAs: 'json' });  // '{"a":1}'
 * 
 * // Convert to number
 * const num = toNum('123.45', { numType: 'float' });  // 123.45
 * ```
 * 
 * @example XML Parsing
 * ```typescript
 * import { xmlToDict, dictToXml } from './parse';
 * 
 * // Parse XML to dictionary
 * const data = await xmlToDict('<root><item>value</item></root>');
 * // { item: 'value' }
 * 
 * // Convert dictionary to XML
 * const xml = dictToXml({ item: 'value' }, 'root');
 * // '<root><item>value</item></root>'
 * ```
 * 
 * @example Validation
 * ```typescript
 * import { validateBoolean, validateKeys } from './parse';
 * 
 * // Validate boolean values
 * const bool = validateBoolean('true');  // true
 * 
 * // Validate object keys
 * const valid = validateKeys(obj, {
 *   required: ['id', 'name'],
 *   optional: ['email']
 * });
 * ```
 * 
 * @example Schema Generation
 * ```typescript
 * import { functionToSchema, jsonSchemaToRegex } from './parse';
 * 
 * // Generate OpenAPI schema from function
 * const schema = functionToSchema(myFunction);
 * 
 * // Convert JSON schema to regex
 * const regex = jsonSchemaToRegex(schema);
 * ```
 */
