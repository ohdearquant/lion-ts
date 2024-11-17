import { stringSimilarity, SIMILARITY_ALGO_MAP } from '../index';

// Custom similarity function for testing
function customSimilarity(s1: string, s2: string): number {
  return s1 === s2 ? 1.0 : 0.0;
}

describe('String Similarity Main Function', () => {
  // Basic functionality tests
  describe('basic functionality', () => {
    test.each([
      // Levenshtein similarity
      ['hello', ['hello', 'world'], 'levenshtein', 'hello'],
      ['hellp', ['help', 'hello'], 'levenshtein', 'help'],
      // Jaro-Winkler similarity
      ['martha', ['marhta', 'market'], 'jaro_winkler', 'marhta'],
      // Cosine similarity
      ['python', ['pytohn', 'perl'], 'cosine', 'pytohn'],
      // Hamming similarity
      ['hello', ['hellp', 'help'], 'hamming', 'hellp'], // Only equal length
      // Sequence matcher
      ['hello', ['helo', 'hell'], 'sequence_matcher', 'helo'],
    ])('finds most similar string using %s algorithm', (word, words, algorithm, expected) => {
      const result = stringSimilarity(word, words, {
        algorithm: algorithm as any,
        returnMostSimilar: true
      });
      expect(result).toBe(expected);
    });
  });

  // Test threshold filtering
  describe('threshold filtering', () => {
    test.each([
      ['hello', ['hello', 'help', 'world'], 0.8, ['hello', 'help']],
      ['hello', ['hello', 'help', 'world'], 0.9, ['hello']],
      ['hello', ['world', 'bye'], 0.8, null],
    ])('filters results based on threshold %f', (word, words, threshold, expected) => {
      const result = stringSimilarity(word, words, { threshold });
      expect(result).toEqual(expected);
    });
  });

  // Test case sensitivity
  describe('case sensitivity', () => {
    test.each([
      ['HELLO', ['hello', 'HELLO'], false, ['hello', 'HELLO']],
      ['HELLO', ['hello', 'HELLO'], true, ['HELLO']],
      ['Python', ['python', 'PYTHON'], false, ['python', 'PYTHON']],
    ])('handles case sensitivity appropriately', (word, words, caseSensitive, expected) => {
      const result = stringSimilarity(word, words, { caseSensitive });
      expect(result).toEqual(expected);
    });
  });

  // Test return_most_similar
  describe('most similar result', () => {
    test.each([
      ['hello', ['hello', 'help', 'world'], 'hello'],
      ['hellp', ['help', 'hello', 'world'], 'help'],
    ])('returns most similar match', (word, words, expected) => {
      const result = stringSimilarity(word, words, { returnMostSimilar: true });
      expect(result).toBe(expected);
    });
  });

  // Test custom similarity function
  it('works with custom similarity function', () => {
    const result = stringSimilarity('hello', ['world', 'hello'], {
      algorithm: customSimilarity
    });
    expect(result).toEqual(['hello']);
  });

  // Test error cases
  describe('error handling', () => {
    it('throws error for empty word list', () => {
      expect(() => stringSimilarity('hello', []))
        .toThrow('correctWords must not be empty');
    });

    it('throws error for invalid threshold', () => {
      expect(() => stringSimilarity('hello', ['world'], { threshold: 2.0 }))
        .toThrow('threshold must be between 0.0 and 1.0');
    });

    it('throws error for unsupported algorithm', () => {
      expect(() => stringSimilarity('hello', ['world'], { algorithm: 'invalid' as any }))
        .toThrow('Unsupported algorithm: invalid');
    });

    it('throws error for invalid algorithm type', () => {
      expect(() => stringSimilarity('hello', ['world'], { algorithm: 123 as any }))
        .toThrow('algorithm must be a string specifying a built-in algorithm or a callable');
    });
  });

  // Test edge cases
  describe('edge cases', () => {
    it('handles empty strings', () => {
      const result = stringSimilarity('', ['', 'a'], { returnMostSimilar: true });
      expect(result).toBe('');
    });

    it('handles single characters', () => {
      const result = stringSimilarity('a', ['a', 'b'], { returnMostSimilar: true });
      expect(result).toBe('a');
    });

    it('handles unicode characters', () => {
      const result = stringSimilarity('hello世界', ['hello世界', 'hello'], { returnMostSimilar: true });
      expect(result).toBe('hello世界');
    });

    it('handles numbers', () => {
      const result = stringSimilarity('123', ['123', '456'], { returnMostSimilar: true });
      expect(result).toBe('123');
    });

    it('handles special characters', () => {
      const result = stringSimilarity('!@#', ['!@#', 'abc'], { returnMostSimilar: true });
      expect(result).toBe('!@#');
    });
  });

  // Test threshold behavior with different algorithms
  describe('threshold behavior', () => {
    const algorithms = ['levenshtein', 'jaro_winkler', 'cosine'] as const;

    algorithms.forEach(algo => {
      describe(`using ${algo} algorithm`, () => {
        it('includes exact matches with threshold', () => {
          const result = stringSimilarity('hello', ['hello', 'help'], {
            algorithm: algo,
            threshold: 0.5
          });
          expect(result).toBeTruthy();
          expect(result).toContain('hello');
        });

        it('filters matches with high threshold', () => {
          const result = stringSimilarity('hello', ['help', 'world'], {
            algorithm: algo,
            threshold: 0.9
          });
          expect(result).toBeNull();
        });
      });
    });
  });

  // Test non-string input handling
  it('handles non-string input', () => {
    const algorithms = ['levenshtein', 'jaro_winkler', 'cosine'] as const;

    algorithms.forEach(algo => {
      const result = stringSimilarity(123 as any, [123 as any, 456 as any], { algorithm: algo });
      expect(Array.isArray(result)).toBe(true);
      if (result) {
        expect(typeof result[0]).toBe('string');
      }
    });
  });
});
