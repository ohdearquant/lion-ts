"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequenceMatcherSimilarity = exports.levenshteinSimilarity = exports.levenshteinDistance = exports.jaroWinklerSimilarity = exports.jaroDistance = exports.hammingSimilarity = exports.cosineSimilarity = void 0;
/**
 * Calculate the cosine similarity between two strings
 */
function cosineSimilarity(s1, s2) {
    if (!s1 || !s2) {
        return 0.0;
    }
    const set1 = new Set(s1);
    const set2 = new Set(s2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    if (!set1.size || !set2.size) {
        return 0.0;
    }
    return intersection.size / Math.sqrt(set1.size * set2.size);
}
exports.cosineSimilarity = cosineSimilarity;
/**
 * Calculate the Hamming similarity between two strings
 */
function hammingSimilarity(s1, s2) {
    if (!s1 || !s2 || s1.length !== s2.length) {
        return 0.0;
    }
    const matches = s1.split('').reduce((acc, char, i) => acc + (char === s2[i] ? 1 : 0), 0);
    return matches / s1.length;
}
exports.hammingSimilarity = hammingSimilarity;
/**
 * Calculate the Jaro distance between two strings
 */
function jaroDistance(s, t) {
    const sLen = s.length;
    const tLen = t.length;
    if (sLen === 0 && tLen === 0) {
        return 1.0;
    }
    else if (sLen === 0 || tLen === 0) {
        return 0.0;
    }
    const matchDistance = Math.max(0, Math.floor(Math.max(sLen, tLen) / 2) - 1);
    const sMatches = new Array(sLen).fill(false);
    const tMatches = new Array(tLen).fill(false);
    let matches = 0;
    let transpositions = 0;
    // Find matches
    for (let i = 0; i < sLen; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, tLen);
        for (let j = start; j < end; j++) {
            if (tMatches[j] || s[i] !== t[j]) {
                continue;
            }
            sMatches[i] = tMatches[j] = true;
            matches++;
            break;
        }
    }
    if (matches === 0) {
        return 0.0;
    }
    // Count transpositions
    let k = 0;
    for (let i = 0; i < sLen; i++) {
        if (!sMatches[i]) {
            continue;
        }
        while (!tMatches[k]) {
            k++;
        }
        if (s[i] !== t[k]) {
            transpositions++;
        }
        k++;
    }
    transpositions = Math.floor(transpositions / 2);
    return (matches / sLen +
        matches / tLen +
        (matches - transpositions) / matches) / 3.0;
}
exports.jaroDistance = jaroDistance;
/**
 * Calculate the Jaro-Winkler similarity between two strings
 */
function jaroWinklerSimilarity(s, t, scaling = 0.1) {
    if (scaling < 0 || scaling > 0.25) {
        throw new Error('Scaling factor must be between 0 and 0.25');
    }
    const jaroSim = jaroDistance(s, t);
    // Find length of common prefix (up to 4 chars)
    let prefixLen = 0;
    for (let i = 0; i < Math.min(4, s.length, t.length); i++) {
        if (s[i] !== t[i]) {
            break;
        }
        prefixLen++;
    }
    return jaroSim + (prefixLen * scaling * (1 - jaroSim));
}
exports.jaroWinklerSimilarity = jaroWinklerSimilarity;
/**
 * Calculate the Levenshtein (edit) distance between two strings
 */
function levenshteinDistance(a, b) {
    if (!a)
        return b.length;
    if (!b)
        return a.length;
    const m = a.length;
    const n = b.length;
    const d = Array(m + 1).fill(null)
        .map(() => Array(n + 1).fill(0));
    // Initialize first row and column
    for (let i = 0; i <= m; i++)
        d[i][0] = i;
    for (let j = 0; j <= n; j++)
        d[0][j] = j;
    // Fill in the rest of the matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, // deletion
            d[i][j - 1] + 1, // insertion
            d[i - 1][j - 1] + cost // substitution
            );
        }
    }
    return d[m][n];
}
exports.levenshteinDistance = levenshteinDistance;
/**
 * Calculate the Levenshtein similarity between two strings
 */
function levenshteinSimilarity(s1, s2) {
    if (!s1 && !s2)
        return 1.0;
    if (!s1 || !s2)
        return 0.0;
    const distance = levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - (distance / maxLen);
}
exports.levenshteinSimilarity = levenshteinSimilarity;
/**
 * Calculate similarity using sequence matcher algorithm
 */
function sequenceMatcherSimilarity(s1, s2) {
    if (!s1 || !s2)
        return 0.0;
    const sequences = longestCommonSubsequence(s1, s2);
    const matchLength = sequences.length;
    return (2.0 * matchLength) / (s1.length + s2.length);
}
exports.sequenceMatcherSimilarity = sequenceMatcherSimilarity;
/**
 * Helper function to find longest common subsequence
 */
function longestCommonSubsequence(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    const dp = Array(m + 1).fill(null)
        .map(() => Array(n + 1).fill(0));
    // Build LCS matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            }
            else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    // Reconstruct the LCS
    let lcs = '';
    let i = m, j = n;
    while (i > 0 && j > 0) {
        if (s1[i - 1] === s2[j - 1]) {
            lcs = s1[i - 1] + lcs;
            i--;
            j--;
        }
        else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        }
        else {
            j--;
        }
    }
    return lcs;
}
