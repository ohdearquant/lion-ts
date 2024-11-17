"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMapping = void 0;
const to_json_1 = require("./to_json");
const validate_keys_1 = require("./validate_keys");
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
function validateMapping(d, keys, similarity_algo = 'jaro_winkler', similarity_threshold = 0.85, fuzzy_match = true, handle_unmatched = 'ignore', fill_value = null, fill_mapping = null, strict = false, suppress_conversion_errors = false) {
    if (d === null || d === undefined) {
        throw new TypeError("Input cannot be null or undefined");
    }
    // Try converting to dictionary
    let dictInput;
    try {
        if (typeof d === 'string') {
            // First try toJson for JSON strings and code blocks
            try {
                const jsonResult = (0, to_json_1.toJson)(d);
                dictInput = Array.isArray(jsonResult) ? jsonResult[0] : jsonResult;
            }
            catch {
                // Fall back to toDict for other string formats
                dictInput = (0, to_json_1.toDict)(d, { strType: 'json', fuzzyParse: true, suppress: true });
            }
        }
        else {
            dictInput = (0, to_json_1.toDict)(d, { useModelDump: true, fuzzyParse: true, suppress: true });
        }
        if (typeof dictInput !== 'object' || dictInput === null) {
            if (suppress_conversion_errors) {
                dictInput = {};
            }
            else {
                throw new ValueError(`Failed to convert input to dictionary: ${typeof dictInput}`);
            }
        }
    }
    catch (e) {
        if (suppress_conversion_errors) {
            dictInput = {};
        }
        else {
            throw new ValueError(`Failed to convert input to dictionary: ${e}`);
        }
    }
    // Validate the dictionary
    return (0, validate_keys_1.validateKeys)(dictInput, keys, similarity_algo, similarity_threshold, fuzzy_match, handle_unmatched, fill_value, fill_mapping, strict);
}
exports.validateMapping = validateMapping;
