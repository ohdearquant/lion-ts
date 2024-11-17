import { SIMILARITY_TYPE } from '../../libs/string_similarity';
import { KeysDict } from '../../types';
/**
 * Validate and correct dictionary keys based on expected keys using string similarity.
 *
 * @param d_ - The dictionary to validate and correct keys for.
 * @param keys - List of expected keys or dictionary mapping keys to types.
 * @param similarity_algo - String similarity algorithm to use or custom function.
 * @param similarity_threshold - Minimum similarity score for fuzzy matching.
 * @param fuzzy_match - If True, use fuzzy matching for key correction.
 * @param handle_unmatched - Specifies how to handle unmatched keys:
 *   - "ignore": Keep unmatched keys in output.
 *   - "raise": Raise ValueError if unmatched keys exist.
 *   - "remove": Remove unmatched keys from output.
 *   - "fill": Fill unmatched keys with default value/mapping.
 *   - "force": Combine "fill" and "remove" behaviors.
 * @param fill_value - Default value for filling unmatched keys.
 * @param fill_mapping - Dictionary mapping unmatched keys to default values.
 * @param strict - If True, raise ValueError if any expected key is missing.
 * @returns A new dictionary with validated and corrected keys.
 * @throws ValueError - If validation fails based on specified parameters.
 * @throws TypeError - If input types are invalid.
 * @throws AttributeError - If key validation fails.
 */
export declare function validateKeys(d_: Record<string, any>, keys: string[] | KeysDict, similarity_algo?: SIMILARITY_TYPE | ((a: string, b: string) => number), similarity_threshold?: number, fuzzy_match?: boolean, handle_unmatched?: 'ignore' | 'raise' | 'remove' | 'fill' | 'force', fill_value?: any, fill_mapping?: Record<string, any> | null, strict?: boolean): Record<string, any>;
