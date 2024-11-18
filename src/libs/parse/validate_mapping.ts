import { toJson } from './to_json';
import { stringSimilarity } from '../string_similarity';
import { ValueError, TypeError } from '../errors';
import { extractCodeBlock } from './extract_code_block';
import type { StringKeyedDict } from './types';

type HandleUnmatchedMode = 'ignore' | 'remove' | 'fill' | 'force' | 'raise';

interface ValidateMappingOptions {
    similarityThreshold?: number;
    fuzzyMatch?: boolean;
    suppress?: boolean;
    strict?: boolean;
    fillValue?: any;
    fillMapping?: Record<string, any>;
    handleUnmatched?: HandleUnmatchedMode;
    similarityFunction?: (a: string, b: string) => number;
}

/**
 * Normalize key for comparison
 */
function normalizeKey(key: string): string {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string, similarityFunction?: (a: string, b: string) => number): number {
    if (similarityFunction) {
        return similarityFunction(str1, str2);
    }

    // For high thresholds, require exact match after normalization
    if (str1 === str2) {
        return 1;
    }

    // For fuzzy matching, use string similarity
    const similarity = stringSimilarity(str1, [str2], {
        caseSensitive: false,
        returnMostSimilar: true
    });

    return typeof similarity === 'number' ? similarity : 0;
}

/**
 * Find best matching key using similarity
 */
function findBestMatch(
    expectedKey: string,
    keys: Set<string>,
    threshold: number,
    similarityFunction?: (a: string, b: string) => number
): string | null {
    let bestMatch = null;
    let bestSimilarity = 0;

    // Normalize expected key for comparison
    const normalizedExpected = normalizeKey(expectedKey);

    for (const key of keys) {
        const normalizedKey = normalizeKey(key);
        
        // For high thresholds (>= 0.9), require exact match after normalization
        if (threshold >= 0.9) {
            if (normalizedKey === normalizedExpected) {
                return key;
            }
            continue;
        }

        // For lower thresholds, use fuzzy matching
        const similarity = calculateSimilarity(normalizedKey, normalizedExpected, similarityFunction);
        if (similarity >= threshold && similarity > bestSimilarity) {
            bestMatch = key;
            bestSimilarity = similarity;
        }
    }

    return bestMatch;
}

/**
 * Get fill value for a key
 */
function getFillValue(key: string, fillMapping: Record<string, any>, fillValue: any): any {
    return fillMapping.hasOwnProperty(key) ? fillMapping[key] : fillValue;
}

/**
 * Parse string input to object
 */
function parseStringInput(input: string): Record<string, unknown> {
    if (input.trim().startsWith('```')) {
        const extracted = extractCodeBlock(input);
        if (typeof extracted === 'string') {
            return toJson(extracted, { fuzzyParse: true }) as Record<string, unknown>;
        }
        throw new ValueError('Failed to extract code block');
    }
    return toJson(input, { fuzzyParse: true }) as Record<string, unknown>;
}

/**
 * Validate and correct dictionary keys based on expected mapping.
 */
export function validateMapping(
    input: unknown,
    mapping: StringKeyedDict,
    options: ValidateMappingOptions = {}
): Record<string, unknown> {
    const {
        similarityThreshold = 0.85,
        fuzzyMatch = true,
        suppress = false,
        strict = false,
        fillValue = null,
        fillMapping = {},
        handleUnmatched = 'ignore',
        similarityFunction
    } = options;

    try {
        // Handle null/undefined input
        if (input === null || input === undefined) {
            throw new TypeError('Cannot validate null or undefined input');
        }

        // Convert input to dictionary
        let dictInput: Record<string, unknown>;
        try {
            if (typeof input === 'string') {
                dictInput = parseStringInput(input);
            } else if (typeof input === 'object' && input !== null) {
                if (Object.keys(input as object).length === 0) {
                    if (strict) {
                        throw new ValueError('Empty input in strict mode');
                    }
                    if (handleUnmatched === 'fill' || handleUnmatched === 'force') {
                        const result: Record<string, unknown> = {};
                        for (const key of Object.keys(mapping)) {
                            result[key] = getFillValue(key, fillMapping, fillValue);
                        }
                        return result;
                    }
                    return {};
                }
                // Handle objects with toDict method
                if ('toDict' in input && typeof (input as any).toDict === 'function') {
                    dictInput = (input as any).toDict();
                } else {
                    dictInput = input as Record<string, unknown>;
                }
            } else {
                throw new TypeError('Input must be a string or object');
            }
        } catch (e) {
            if (suppress) {
                const result: Record<string, unknown> = {};
                if (handleUnmatched === 'fill' || handleUnmatched === 'force') {
                    for (const key of Object.keys(mapping)) {
                        result[key] = getFillValue(key, fillMapping, fillValue);
                    }
                }
                return result;
            }
            throw e;
        }

        // Initialize tracking variables
        let result: Record<string, unknown> = {};
        const inputKeys = new Set(Object.keys(dictInput));
        const matchedKeys = new Map<string, string>(); // inputKey -> expectedKey
        const expectedKeys = Object.keys(mapping);

        // First pass: exact matches (case-insensitive)
        for (const expectedKey of expectedKeys) {
            const normalizedExpected = normalizeKey(expectedKey);
            for (const inputKey of inputKeys) {
                if (normalizeKey(inputKey) === normalizedExpected) {
                    matchedKeys.set(inputKey, expectedKey);
                    inputKeys.delete(inputKey);
                    break;
                }
            }
        }

        // Second pass: fuzzy matches if enabled
        if (fuzzyMatch) {
            const unmatchedExpectedKeys = expectedKeys.filter(
                key => !Array.from(matchedKeys.values()).includes(key)
            );

            for (const expectedKey of unmatchedExpectedKeys) {
                const match = findBestMatch(expectedKey, inputKeys, similarityThreshold, similarityFunction);
                if (match) {
                    matchedKeys.set(match, expectedKey);
                    inputKeys.delete(match);
                }
            }
        }

        // Handle strict mode
        if (strict) {
            const missingExpectedKeys = expectedKeys.filter(
                key => !Array.from(matchedKeys.values()).includes(key)
            );
            if (missingExpectedKeys.length > 0) {
                throw new ValueError(`Missing required keys: ${missingExpectedKeys.join(', ')}`);
            }
            if (inputKeys.size > 0) {
                throw new ValueError(`Unmatched keys found: ${Array.from(inputKeys).join(', ')}`);
            }
        }

        // Handle unmatched keys based on mode
        switch (handleUnmatched) {
            case 'ignore':
                // Keep all input keys and matched keys with original case
                result = { ...dictInput };
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    // For high thresholds or custom similarity function, preserve input key
                    if (similarityFunction || similarityThreshold >= 0.9) {
                        result[inputKey] = dictInput[inputKey];
                    } else {
                        // For default similarity, use expected key
                        result[expectedKey] = dictInput[inputKey];
                        if (inputKey !== expectedKey) {
                            delete result[inputKey];
                        }
                    }
                }
                break;

            case 'remove':
                // Only include matched keys with appropriate case
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    const useKey = similarityFunction || similarityThreshold >= 0.9 ? inputKey : expectedKey;
                    result[useKey] = dictInput[inputKey];
                }
                break;

            case 'fill':
                // Include matched keys with appropriate case
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    const useKey = similarityFunction || similarityThreshold >= 0.9 ? inputKey : expectedKey;
                    result[useKey] = dictInput[inputKey];
                }
                // Include unmatched input keys
                for (const inputKey of inputKeys) {
                    result[inputKey] = dictInput[inputKey];
                }
                // Fill missing expected keys
                for (const expectedKey of expectedKeys) {
                    if (!result.hasOwnProperty(expectedKey)) {
                        result[expectedKey] = getFillValue(expectedKey, fillMapping, fillValue);
                    }
                }
                break;

            case 'force':
                // Only include expected keys
                for (const expectedKey of expectedKeys) {
                    const matchedInputKey = Array.from(matchedKeys.entries())
                        .find(([_, exp]) => exp === expectedKey)?.[0];
                    result[expectedKey] = matchedInputKey
                        ? dictInput[matchedInputKey]
                        : getFillValue(expectedKey, fillMapping, fillValue);
                }
                break;

            case 'raise':
                if (inputKeys.size > 0) {
                    throw new ValueError(`Unmatched keys found: ${Array.from(inputKeys).join(', ')}`);
                }
                // Include matched keys with appropriate case
                for (const [inputKey, expectedKey] of matchedKeys.entries()) {
                    const useKey = similarityFunction || similarityThreshold >= 0.9 ? inputKey : expectedKey;
                    result[useKey] = dictInput[inputKey];
                }
                // Check for missing expected keys
                const missingKeys = expectedKeys.filter(key => {
                    return !Array.from(matchedKeys.values()).includes(key);
                });
                if (missingKeys.length > 0) {
                    throw new ValueError(`Missing required keys: ${missingKeys.join(', ')}`);
                }
                break;

            default:
                throw new ValueError(`Invalid handleUnmatched mode: ${handleUnmatched}`);
        }

        return result;
    } catch (error) {
        if (suppress && !(error instanceof TypeError)) {
            const result: Record<string, unknown> = {};
            if (handleUnmatched === 'fill' || handleUnmatched === 'force') {
                for (const key of Object.keys(mapping)) {
                    result[key] = getFillValue(key, fillMapping, fillValue);
                }
            }
            return result;
        }
        throw error;
    }
}
