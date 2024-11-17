"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceMatcherSimilarity = exports.levenshteinSimilarity = exports.jaroWinklerSimilarity = exports.hammingSimilarity = exports.cosineSimilarity = exports.stringSimilarity = exports.SIMILARITY_ALGO_MAP = void 0;
const algorithms_1 = require("./algorithms");
Object.defineProperty(exports, "cosineSimilarity", { enumerable: true, get: function () { return algorithms_1.cosineSimilarity; } });
Object.defineProperty(exports, "hammingSimilarity", { enumerable: true, get: function () { return algorithms_1.hammingSimilarity; } });
Object.defineProperty(exports, "jaroWinklerSimilarity", { enumerable: true, get: function () { return algorithms_1.jaroWinklerSimilarity; } });
Object.defineProperty(exports, "levenshteinSimilarity", { enumerable: true, get: function () { return algorithms_1.levenshteinSimilarity; } });
Object.defineProperty(exports, "sequenceMatcherSimilarity", { enumerable: true, get: function () { return algorithms_1.sequenceMatcherSimilarity; } });
/**
 * Map of available similarity algorithms
 */
exports.SIMILARITY_ALGO_MAP = {
    jaro_winkler: algorithms_1.jaroWinklerSimilarity,
    levenshtein: algorithms_1.levenshteinSimilarity,
    sequence_matcher: algorithms_1.sequenceMatcherSimilarity,
    hamming: algorithms_1.hammingSimilarity,
    cosine: algorithms_1.cosineSimilarity,
};
/**
 * Find similar strings using specified similarity algorithm
 */
function stringSimilarity(word, correctWords, options = {}) {
    const { algorithm = 'jaro_winkler', threshold = 0.0, caseSensitive = false, returnMostSimilar = false } = options;
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
    let scoreFunc;
    if (typeof algorithm === 'string') {
        scoreFunc = exports.SIMILARITY_ALGO_MAP[algorithm];
        if (!scoreFunc) {
            throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
    }
    else if (typeof algorithm === 'function') {
        scoreFunc = algorithm;
    }
    else {
        throw new Error('algorithm must be a string specifying a built-in algorithm or a callable');
    }
    // Calculate similarities
    const results = [];
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
    results.sort((a, b) => b.score === a.score ? a.index - b.index : b.score - a.score);
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
exports.stringSimilarity = stringSimilarity;
