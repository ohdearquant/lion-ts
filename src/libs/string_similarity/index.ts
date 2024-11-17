import {
  cosineSimilarity,
  hammingSimilarity,
  jaroWinklerSimilarity,
  levenshteinSimilarity,
  sequenceMatcherSimilarity
} from './algorithms';

import type {
  SimilarityAlgorithm,
  SimilarityFunction,
  SimilarityOptions,
  SimilarityResult,
  MatchResult
} from './types';

/**
 * Map of available similarity algorithms
 */
export const SIMILARITY_ALGO_MAP: Record<SimilarityAlgorithm, SimilarityFunction> = {
  jaro_winkler: jaroWinklerSimilarity,
  levenshtein: levenshteinSimilarity,
  sequence_matcher: sequenceMatcherSimilarity,
  hamming: hammingSimilarity,
  cosine: cosineSimilarity,
};

/**
 * Find similar strings using specified similarity algorithm
 */
export function stringSimilarity(
  word: string,
  correctWords: string[],
  options: SimilarityOptions = {}
): SimilarityResult {
  const {
    algorithm = 'jaro_winkler',
    threshold = 0.0,
    caseSensitive = false,
    returnMostSimilar = false
  } = options;

  // Validate inputs
  if (!correctWords.length) {
    throw new Error('correctWords must not be empty');
  }

  if (threshold < 0.0 || threshold > 1.0) {
    throw new Error('threshold must be between 0.0 and 1.0');
  }

  // Convert inputs to strings
  const compareWord = String(word);
  const originalWords = correctWords.map(String);

  // Handle case sensitivity
  const processedCompareWord = caseSensitive ? compareWord : compareWord.toLowerCase();
  const processedWords = caseSensitive 
    ? [...originalWords]
    : originalWords.map(w => w.toLowerCase());

  // Get scoring function
  let scoreFunc: SimilarityFunction;
  if (typeof algorithm === 'string') {
    scoreFunc = SIMILARITY_ALGO_MAP[algorithm];
    if (!scoreFunc) {
      throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  } else if (typeof algorithm === 'function') {
    scoreFunc = algorithm;
  } else {
    throw new Error(
      'algorithm must be a string specifying a built-in algorithm or a callable'
    );
  }

  // Calculate similarities
  const results: MatchResult[] = [];
  for (let idx = 0; idx < processedWords.length; idx++) {
    const origWord = originalWords[idx];
    const compWord = processedWords[idx];

    // Skip different length strings for hamming similarity
    if (algorithm === 'hamming' && compWord.length !== processedCompareWord.length) {
      continue;
    }

    const score = scoreFunc(processedCompareWord, compWord);
    if (score >= threshold) {
      results.push({ word: origWord, score, index: idx });
    }
  }

  // Return null if no matches
  if (!results.length) {
    return null;
  }

  // Sort by score (descending) and index (ascending) for stable ordering
  results.sort((a, b) => 
    b.score === a.score ? a.index - b.index : b.score - a.score
  );

  // Return results
  if (returnMostSimilar) {
    return results[0].word;
  }

  // Filter exact matches for case sensitive comparisons
  if (caseSensitive) {
    const maxScore = results[0].score;
    return results
      .filter(r => r.score === maxScore)
      .map(r => r.word);
  }

  return results.map(r => r.word);
}

// Export types
export type {
  SimilarityAlgorithm,
  SimilarityFunction,
  SimilarityOptions,
  SimilarityResult,
  MatchResult
};

// Export algorithms
export {
  cosineSimilarity,
  hammingSimilarity,
  jaroWinklerSimilarity,
  levenshteinSimilarity,
  sequenceMatcherSimilarity
};
