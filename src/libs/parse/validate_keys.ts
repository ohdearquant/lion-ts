import { toDict } from './to_dict';
import { stringSimilarity, type SimilarityAlgorithm, type SimilarityFunction } from '../string_similarity';
import { ValueError, TypeError } from '../errors';
import type { StringKeyedDict } from './types';

type HandleUnmatchedMode = 'ignore' | 'remove' | 'fill' | 'force' | 'raise';

/**
 * Normalize key for comparison
 */
function normalizeKey(key: string): string {
    // Convert to lowercase and remove special characters
    return key
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')  // Replace special chars with underscore
        .replace(/^_+|_+$/g, '')      // Remove leading/trailing underscores
        .trim();
}

/**
 * Check if two keys match
 */
function keysMatch(key1: string, key2: string): boolean {
    return normalizeKey(key1) === normalizeKey(key2);
}

/**
 * Validate dictionary keys against expected keys
 */
export function validateKeys(
    input: StringKeyedDict,
    expectedKeys: string[],
    similarityAlgo: SimilarityAlgorithm | SimilarityFunction = 'jaro_winkler',
    similarityThreshold: number = 0.85,  // Aligned with Python version
    fuzzyMatch: boolean = false,         // Default to false to preserve original keys
    handleUnmatched: HandleUnmatchedMode = 'ignore',
    fillValue: any = null,
    fillMapping: Record<string, any> | null = null,
    strict: boolean = false
): StringKeyedDict {
    try {
        // Handle null/undefined input
        if (input === null || input === undefined) {
            throw new TypeError('Cannot validate null or undefined input');
        }

        // Handle null/undefined expected keys
        if (expectedKeys === null || expectedKeys === undefined) {
            throw new TypeError('Expected keys cannot be null or undefined');
        }

        // Handle empty expected keys
        if (expectedKeys.length === 0) {
            return toDict(input);
        }

        // Validate similarity threshold
        if (similarityThreshold < 0 || similarityThreshold > 1) {
            throw new ValueError('Similarity threshold must be between 0 and 1');
        }

        // Validate similarity algorithm
        if (typeof similarityAlgo === 'string' && !['jaro_winkler', 'levenshtein', 'sequence_matcher', 'hamming', 'cosine'].includes(similarityAlgo)) {
            throw new ValueError(`Invalid similarity algorithm: ${similarityAlgo}`);
        }

        // Convert input to dictionary if needed
        const dictInput = toDict(input);
        const inputKeys = new Set(Object.keys(dictInput));
        const matchedKeys = new Map<string, string>(); // input -> expected
        let result: StringKeyedDict = {};

        // First pass: exact matches (case insensitive)
        for (const expectedKey of expectedKeys) {
            for (const inputKey of inputKeys) {
                if (keysMatch(inputKey, expectedKey)) {
                    matchedKeys.set(inputKey, expectedKey);
                    inputKeys.delete(inputKey);
                    break;
                }
            }
        }

        // Second pass: fuzzy matches if enabled
        if (fuzzyMatch && inputKeys.size > 0 && expectedKeys.length > 0) {
            const unmatchedExpected = expectedKeys.filter(key => 
                !Array.from(matchedKeys.values()).includes(key)
            );

            for (const expectedKey of unmatchedExpected) {
                let bestMatch = '';
                let bestSimilarity = 0;

                for (const inputKey of Array.from(inputKeys)) {
                    const normalizedInput = normalizeKey(inputKey);
                    const normalizedExpected = normalizeKey(expectedKey);

                    // Try exact match first
                    if (normalizedInput === normalizedExpected) {
                        bestMatch = inputKey;
                        bestSimilarity = 1;
                        break;
                    }

                    // Then try fuzzy match
                    const similarity = typeof similarityAlgo === 'function'
                        ? similarityAlgo(normalizedInput, normalizedExpected)
                        : stringSimilarity(normalizedInput, [normalizedExpected], {
                            algorithm: similarityAlgo,
                            caseSensitive: false,
                            returnMostSimilar: true
                        });

                    const score = typeof similarity === 'string' ? 1 : (typeof similarity === 'number' ? similarity : 0);
                    if (score >= similarityThreshold && score > bestSimilarity) {
                        bestMatch = inputKey;
                        bestSimilarity = score;
                    }
                }

                if (bestMatch) {
                    matchedKeys.set(bestMatch, expectedKey);
                    inputKeys.delete(bestMatch);
                }
            }
        }

        // Handle strict mode first
        if (strict) {
            const missing = expectedKeys.filter(key => 
                !Array.from(matchedKeys.values()).includes(key)
            );
            if (missing.length > 0) {
                throw new ValueError(`Missing required keys: ${missing.join(', ')}`);
            }
            if (inputKeys.size > 0) {
                throw new ValueError(`Unmatched keys found: ${Array.from(inputKeys).join(', ')}`);
            }
        }

        // Build result based on mode
        switch (handleUnmatched) {
            case 'ignore':
                // Keep all input keys with original names
                result = { ...dictInput };
                // Update matched keys to expected names if fuzzy matching
                if (fuzzyMatch) {
                    for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                        if (inputKey !== expectedKey) {
                            result[expectedKey] = dictInput[inputKey];
                            delete result[inputKey];
                        }
                    }
                }
                break;

            case 'remove':
                // Only include matched keys with expected names
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    result[fuzzyMatch ? expectedKey : inputKey] = dictInput[inputKey];
                }
                break;

            case 'fill':
                // Include matched keys with expected names
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    result[fuzzyMatch ? expectedKey : inputKey] = dictInput[inputKey];
                }
                // Include unmatched input keys
                for (const key of inputKeys) {
                    result[key] = dictInput[key];
                }
                // Fill missing expected keys
                for (const expectedKey of expectedKeys) {
                    if (!Array.from(matchedKeys.values()).includes(expectedKey)) {
                        result[expectedKey] = fillMapping && expectedKey in fillMapping 
                            ? fillMapping[expectedKey] 
                            : fillValue;
                    }
                }
                break;

            case 'force':
                // Only include expected keys
                for (const expectedKey of expectedKeys) {
                    const inputKey = Array.from(matchedKeys.entries())
                        .find(([_, exp]) => exp === expectedKey)?.[0];
                    result[expectedKey] = inputKey
                        ? dictInput[inputKey]
                        : (fillMapping && expectedKey in fillMapping 
                            ? fillMapping[expectedKey] 
                            : fillValue);
                }
                break;

            case 'raise':
                if (inputKeys.size > 0) {
                    throw new ValueError(`Unmatched keys found: ${Array.from(inputKeys).join(', ')}`);
                }
                // Include matched keys with expected names
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    result[fuzzyMatch ? expectedKey : inputKey] = dictInput[inputKey];
                }
                // Check for missing expected keys
                const missing = expectedKeys.filter(key => 
                    !Array.from(matchedKeys.values()).includes(key)
                );
                if (missing.length > 0) {
                    throw new ValueError(`Missing required keys: ${missing.join(', ')}`);
                }
                break;

            default:
                throw new ValueError(`Invalid handleUnmatched mode: ${handleUnmatched}`);
        }

        return result;
    } catch (error) {
        throw error instanceof ValueError || error instanceof TypeError ? error : new ValueError(String(error));
    }
}
