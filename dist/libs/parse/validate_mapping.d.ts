import { SIMILARITY_TYPE } from '../../libs/string_similarity';
import { KeysDict } from '../../types';
/**
 * Validate and correct any input into a dictionary with expected keys.
 *
 * @param d - Input to validate. Can be:
 *   - Dictionary
 *   - JSON string or markdown code block
 *   - XML string
 *   - Object with to_dict/model_dump method
 *   - Any type convertible to dictionary
 * @param keys - List of expected keys or dictionary mapping keys to types.
 * @param similarity_algo - String similarity algorithm or custom function.
 * @param similarity_threshold - Minimum similarity score for fuzzy matching.
 * @param fuzzy_match - If True, use fuzzy matching for key correction.
 * @param handle_unmatched - How to handle unmatched keys:
 *   - "ignore": Keep unmatched keys
 *   - "raise": Raise error for unmatched keys
 *   - "remove": Remove unmatched keys
 *   - "fill": Fill missing keys with default values
 *   - "force": Combine "fill" and "remove" behaviors
 * @param fill_value - Default value for filling unmatched keys.
 * @param fill_mapping - Dictionary mapping keys to default values.
 * @param strict - Raise error if any expected key is missing.
 * @param suppress_conversion_errors - Return empty dict on conversion errors.
 * @returns Validated and corrected dictionary.
 * @throws ValueError - If input cannot be converted or validation fails.
 * @throws TypeError - If input types are invalid.
 */
export declare function validateMapping(d: any, keys: string[] | KeysDict, similarity_algo?: SIMILARITY_TYPE | ((a: string, b: string) => number), similarity_threshold?: number, fuzzy_match?: boolean, handle_unmatched?: 'ignore' | 'raise' | 'remove' | 'fill' | 'force', fill_value?: any, fill_mapping?: Record<string, any> | null, strict?: boolean, suppress_conversion_errors?: boolean): Record<string, any>;
