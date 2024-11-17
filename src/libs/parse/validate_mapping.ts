import { toJson } from './to_json';
import { toDict } from './to_dict';
import { validateKeys, type KeysDict } from './validate_keys';
import { ValueError, TypeError } from '../errors';
import { type SimilarityAlgorithm, type SimilarityFunction } from '../string_similarity';

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
export function validateMapping(
  d: any,
  keys: string[] | KeysDict,
  similarity_algo: SimilarityAlgorithm | SimilarityFunction = 'jaro_winkler',
  similarity_threshold: number = 0.85,
  fuzzy_match: boolean = true,
  handle_unmatched: 'ignore' | 'raise' | 'remove' | 'fill' | 'force' = 'ignore',
  fill_value: any = null,
  fill_mapping: Record<string, any> | null = null,
  strict: boolean = false,
  suppress_conversion_errors: boolean = false
): Record<string, any> {
  if (d === null || d === undefined) {
    throw new TypeError("Input cannot be null or undefined");
  }

  // Try converting to dictionary
  let dictInput: Record<string, any>;
  try {
    if (typeof d === 'string') {
      // First try toJson for JSON strings and code blocks
      try {
        const jsonResult = toJson(d);
        dictInput = Array.isArray(jsonResult) ? jsonResult[0] : jsonResult;
      } catch {
        // Fall back to toDict for other string formats
        dictInput = toDict(d, { strType: 'json', fuzzyParse: true, suppress: true });
      }
    } else {
      dictInput = toDict(d, { fuzzyParse: true, suppress: true });
    }

    if (typeof dictInput !== 'object' || dictInput === null) {
      if (suppress_conversion_errors) {
        dictInput = {};
      } else {
        throw new ValueError(`Failed to convert input to dictionary: ${typeof dictInput}`);
      }
    }
  } catch (e) {
    if (suppress_conversion_errors) {
      dictInput = {};
    } else {
      throw new ValueError(`Failed to convert input to dictionary: ${e}`);
    }
  }

  // Validate the dictionary
  return validateKeys(
    dictInput,
    keys,
    similarity_algo,
    similarity_threshold,
    fuzzy_match,
    handle_unmatched,
    fill_value,
    fill_mapping,
    strict
  );
}
