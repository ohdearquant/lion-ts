import { cosineSimilarity, hammingSimilarity, jaroWinklerSimilarity, levenshteinSimilarity, sequenceMatcherSimilarity } from './algorithms';
import type { SimilarityAlgorithm, SimilarityFunction, SimilarityOptions, SimilarityResult, MatchResult } from './types';
/**
 * Map of available similarity algorithms
 */
export declare const SIMILARITY_ALGO_MAP: Record<SimilarityAlgorithm, SimilarityFunction>;
/**
 * Find similar strings using specified similarity algorithm
 */
export declare function stringSimilarity(word: string, correctWords: string[], options?: SimilarityOptions): SimilarityResult;
export type { SimilarityAlgorithm, SimilarityFunction, SimilarityOptions, SimilarityResult, MatchResult };
export { cosineSimilarity, hammingSimilarity, jaroWinklerSimilarity, levenshteinSimilarity, sequenceMatcherSimilarity };
