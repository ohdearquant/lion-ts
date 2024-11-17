/**
 * Calculate the cosine similarity between two strings
 */
export declare function cosineSimilarity(s1: string, s2: string): number;
/**
 * Calculate the Hamming similarity between two strings
 */
export declare function hammingSimilarity(s1: string, s2: string): number;
/**
 * Calculate the Jaro distance between two strings
 */
export declare function jaroDistance(s: string, t: string): number;
/**
 * Calculate the Jaro-Winkler similarity between two strings
 */
export declare function jaroWinklerSimilarity(s: string, t: string, scaling?: number): number;
/**
 * Calculate the Levenshtein (edit) distance between two strings
 */
export declare function levenshteinDistance(a: string, b: string): number;
/**
 * Calculate the Levenshtein similarity between two strings
 */
export declare function levenshteinSimilarity(s1: string, s2: string): number;
/**
 * Calculate similarity using sequence matcher algorithm
 */
export declare function sequenceMatcherSimilarity(s1: string, s2: string): number;
