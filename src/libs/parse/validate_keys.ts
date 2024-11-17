import { stringSimilarity, SIMILARITY_ALGO_MAP, SIMILARITY_TYPE } from '../../libs/string_similarity';
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
export function validateKeys(
  d_: Record<string, any>,
  keys: string[] | KeysDict,
  similarity_algo: SIMILARITY_TYPE | ((a: string, b: string) => number) = 'jaro_winkler',
  similarity_threshold: number = 0.85,
  fuzzy_match: boolean = true,
  handle_unmatched: 'ignore' | 'raise' | 'remove' | 'fill' | 'force' = 'ignore',
  fill_value: any = null,
  fill_mapping: Record<string, any> | null = null,
  strict: boolean = false
): Record<string, any> {
  // Input validation
  if (typeof d_ !== 'object' || d_ === null) {
    throw new TypeError('First argument must be a dictionary');
  }
  if (keys === null) {
    throw new TypeError('Keys argument cannot be null');
  }
  if (similarity_threshold < 0.0 || similarity_threshold > 1.0) {
    throw new ValueError('similarity_threshold must be between 0.0 and 1.0');
  }

  // Extract expected keys
  const fields_set = Array.isArray(keys) ? new Set(keys) : new Set(Object.keys(keys));
  if (fields_set.size === 0) {
    return { ...d_ }; // Return copy of original if no expected keys
  }

  // Initialize output dictionary and tracking sets
  const corrected_out: Record<string, any> = {};
  const matched_expected = new Set<string>();
  const matched_input = new Set<string>();

  // Get similarity function
  let similarity_func: (a: string, b: string) => number;
  if (typeof similarity_algo === 'string') {
    if (!(similarity_algo in SIMILARITY_ALGO_MAP)) {
      throw new ValueError(`Unknown similarity algorithm: ${similarity_algo}`);
    }
    similarity_func = SIMILARITY_ALGO_MAP[similarity_algo];
  } else {
    similarity_func = similarity_algo;
  }

  // First pass: exact matches
  for (const key of Object.keys(d_)) {
    if (fields_set.has(key)) {
      corrected_out[key] = d_[key];
      matched_expected.add(key);
      matched_input.add(key);
    }
  }

  // Second pass: fuzzy matching if enabled
  if (fuzzy_match) {
    const remaining_input = new Set(Object.keys(d_).filter(key => !matched_input.has(key)));
    const remaining_expected = new Set(Array.from(fields_set).filter(key => !matched_expected.has(key)));

    for (const key of remaining_input) {
      if (remaining_expected.size === 0) {
        break;
      }

      const matches = stringSimilarity(
        key,
        Array.from(remaining_expected),
        similarity_func,
        similarity_threshold,
        true
      );

      if (matches) {
        const match = matches;
        corrected_out[match] = d_[key];
        matched_expected.add(match);
        matched_input.add(key);
        remaining_expected.delete(match);
      } else if (handle_unmatched === 'ignore') {
        corrected_out[key] = d_[key];
      }
    }
  }

  // Handle unmatched keys based on handle_unmatched parameter
  const unmatched_input = new Set(Object.keys(d_).filter(key => !matched_input.has(key)));
  const unmatched_expected = new Set(Array.from(fields_set).filter(key => !matched_expected.has(key)));

  if (handle_unmatched === 'raise' && unmatched_input.size > 0) {
    throw new ValueError(`Unmatched keys found: ${Array.from(unmatched_input)}`);
  } else if (handle_unmatched === 'ignore') {
    for (const key of unmatched_input) {
      corrected_out[key] = d_[key];
    }
  } else if (handle_unmatched === 'fill' || handle_unmatched === 'force') {
    // Fill missing expected keys
    for (const key of unmatched_expected) {
      if (fill_mapping && key in fill_mapping) {
        corrected_out[key] = fill_mapping[key];
      } else {
        corrected_out[key] = fill_value;
      }
    }

    // For "fill" mode, also keep unmatched original keys
    if (handle_unmatched === 'fill') {
      for (const key of unmatched_input) {
        corrected_out[key] = d_[key];
      }
    }
  }

  // Check strict mode
  if (strict && unmatched_expected.size > 0) {
    throw new ValueError(`Missing required keys: ${Array.from(unmatched_expected)}`);
  }

  return corrected_out;
}
