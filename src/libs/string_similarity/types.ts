/**
 * Type for similarity algorithm functions
 */
export type SimilarityFunction = (s1: string, s2: string) => number;

/**
 * Available similarity algorithm types
 */
export type SimilarityAlgorithm = 
  | 'jaro_winkler'
  | 'levenshtein'
  | 'sequence_matcher'
  | 'hamming'
  | 'cosine';

/**
 * Result of a string match operation
 */
export interface MatchResult {
  word: string;
  score: number;
  index: number;
}

/**
 * Options for string similarity comparison
 */
export interface SimilarityOptions {
  algorithm?: SimilarityAlgorithm | SimilarityFunction;
  threshold?: number;
  caseSensitive?: boolean;
  returnMostSimilar?: boolean;
}

/**
 * Return type for string similarity function
 */
export type SimilarityResult = string | string[] | null;
