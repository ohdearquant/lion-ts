import { toDict } from './to_dict';
import { stringSimilarity, type SimilarityAlgorithm, type SimilarityFunction } from '../string_similarity';
import { ValueError, TypeError } from '../errors';
import type { StringKeyedDict } from './types';

type HandleUnmatchedMode = 'ignore' | 'remove' | 'fill' | 'force' | 'raise';

/**
 * Normalize key for comparison
 */
function normalizeKey(key: string): string {
    return key
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
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
    similarityThreshold: number = 0.8,
    fuzzyMatch: boolean = false,
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
        const result: StringKeyedDict = {};

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

            for (const inputKey of Array.from(inputKeys)) {
                let bestMatch = '';
                let bestSimilarity = 0;

                const normalizedInput = normalizeKey(inputKey);
                for (const expectedKey of unmatchedExpected) {
                    const normalizedExpected = normalizeKey(expectedKey);

                    // Try exact match first
                    if (normalizedInput === normalizedExpected) {
                        bestMatch = expectedKey;
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
                        bestMatch = expectedKey;
                        bestSimilarity = score;
                    }
                }

                if (bestMatch) {
                    matchedKeys.set(inputKey, bestMatch);
                    inputKeys.delete(inputKey);                }
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
        if (handleUnmatched === 'ignore') {
            // Add matched keys with original names if not fuzzy matching
            if (!fuzzyMatch) {
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    result[inputKey] = dictInput[inputKey];
                }
            } else {
                // In fuzzy match mode, use expected keys
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    result[expectedKey] = dictInput[inputKey];
                }
            }
            // Keep unmatched keys with original names
            for (const key of inputKeys) {
                result[key] = dictInput[key];
            }
        } else {
            // For all other modes, use expected keys for matches
            for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                result[expectedKey] = dictInput[inputKey];
            }

            // Handle unmatched keys based on mode
            if (handleUnmatched === 'fill') {
                // Add unmatched input keys
                for (const key of inputKeys) {
                    result[key] = dictInput[key];
                }
                // Fill missing expected keys
                for (const expectedKey of expectedKeys) {
                    if (!result.hasOwnProperty(expectedKey)) {
                        result[expectedKey] = fillMapping && expectedKey in fillMapping 
                            ? fillMapping[expectedKey] 
                            : fillValue;
                    }
                }
            } else if (handleUnmatched === 'force') {
                // Fill missing expected keys
                for (const expectedKey of expectedKeys) {
                    if (!result.hasOwnProperty(expectedKey)) {
                        result[expectedKey] = fillMapping && expectedKey in fillMapping 
                            ? fillMapping[expectedKey] 
                            : fillValue;
                    }
                }
            } else if (handleUnmatched === 'raise') {
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
        }

        return result;
    } catch (error) {
        throw error instanceof ValueError || error instanceof TypeError ? error : new ValueError(String(error));
    }
}
