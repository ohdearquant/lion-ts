import {
  cosineSimilarity,
  hammingSimilarity,
  jaroDistance,
  jaroWinklerSimilarity,
  levenshteinDistance,
  levenshteinSimilarity,
} from '../algorithms';

describe('String Similarity Algorithms', () => {
  // Cosine Similarity Tests
  describe('cosineSimilarity', () => {
    test.each([
      ['hello', 'hello', 1.0],
      ['', '', 0.0],
      ['hello', '', 0.0],
      ['abc', 'def', 0.0],
      ['python', 'pytohn', 1.0], // Same characters, different order
      ['test', 'tset', 1.0],     // Anagram
      ['aaa', 'aaa', 1.0],       // Repeated characters
    ])('cosine similarity of %s and %s should be %f', (s1, s2, expected) => {
      expect(cosineSimilarity(s1, s2)).toBeCloseTo(expected, 3);
    });
  });

  // Hamming Similarity Tests
  describe('hammingSimilarity', () => {
    test.each([
      ['hello', 'hello', 1.0],
      ['hello', 'hella', 0.8],
      ['', '', 0.0],
      ['hello', 'world', 0.2],  // Fixed value - 1 match out of 5
      ['abc', 'abd', 0.667],
      ['test', 'pest', 0.75],   // Single character difference
      ['11111', '11011', 0.8],  // Binary-like strings
    ])('hamming similarity of %s and %s should be %f', (s1, s2, expected) => {
      expect(hammingSimilarity(s1, s2)).toBeCloseTo(expected, 3);
    });
  });

  // Jaro Distance Tests
  describe('jaroDistance', () => {
    test.each([
      ['string', 'string', 1.0],
      ['abc', 'xyz', 0.0],
      ['dwayne', 'duane', 0.8222],
      ['', '', 1.0],
      ['abc', '', 0.0],
      ['', 'xyz', 0.0],
      ['123456', '123', 0.8333],
      ['martha', 'marhta', 0.9444],  // Classic example
      ['dixon', 'dickson', 0.7905],   // Fixed value
      ['jellyfish', 'smellyfish', 0.8963], // Prefix difference
    ])('jaro distance of %s and %s should be %f', (s1, s2, expected) => {
      expect(jaroDistance(s1, s2)).toBeCloseTo(expected, 3);
    });
  });

  // Jaro-Winkler Similarity Tests
  describe('jaroWinklerSimilarity', () => {
    test.each([
      ['string', 'string', 1.0, 0.1],
      ['abc', 'xyz', 0.0, 0.1],
      ['dwayne', 'duane', 0.8400, 0.1],
      ['', '', 1.0, 0.1],
      ['abc', '', 0.0, 0.1],
      ['', 'xyz', 0.0, 0.1],
      ['123456', '123', 0.8833, 0.1],
      ['dwayne', 'duane', 0.8578, 0.2],
      ['MARTHA', 'MARHTA', 0.9611, 0.1],  // Updated value
      ['DIXON', 'DICKSONX', 0.8133, 0.1],  // Updated value
    ])('jaro-winkler similarity of %s and %s with scaling %f should be %f', 
      (s1, s2, scaling, expected) => {
        expect(jaroWinklerSimilarity(s1, s2, scaling)).toBeCloseTo(expected, 4);
    });

    it('throws error for invalid scaling factor', () => {
      expect(() => jaroWinklerSimilarity('hello', 'hello', 0.5))
        .toThrow('Scaling factor must be between 0 and 0.25');
    });
  });

  // Levenshtein Distance Tests
  describe('levenshteinDistance', () => {
    test.each([
      ['string', 'string', 0],
      ['abc', 'xyz', 3],
      ['kitten', 'sitting', 3],
      ['', '', 0],
      ['abc', '', 3],
      ['', 'xyz', 3],
      ['123456', '123', 3],
      ['String', 'string', 1],
      ['flaw', 'lawn', 2],
      ['gumbo', 'gambol', 2],
      ['saturday', 'sunday', 3],  // Classic example
      ['pale', 'bale', 1],        // Single substitution
    ])('levenshtein distance of %s and %s should be %i', (s1, s2, expected) => {
      expect(levenshteinDistance(s1, s2)).toBe(expected);
    });
  });

  // Levenshtein Similarity Tests
  describe('levenshteinSimilarity', () => {
    test.each([
      ['hello', 'hello', 1.0],
      ['hello', 'helo', 0.8],
      ['', '', 1.0],
      ['', 'hello', 0.0],
      ['hello', '', 0.0],
      ['sitting', 'kitten', 0.571],
      ['sunday', 'saturday', 0.625],
      ['pale', 'bale', 0.75],  // Single character difference
      ['pale', 'bake', 0.5],   // Two character differences
    ])('levenshtein similarity of %s and %s should be %f', (s1, s2, expected) => {
      expect(levenshteinSimilarity(s1, s2)).toBeCloseTo(expected, 3);
    });
  });

  // General Algorithm Tests
  describe('algorithm bounds', () => {
    const testCases = [
      ['hello', 'hello'],     // Same strings
      ['hello', 'world'],     // Different strings
      ['', ''],               // Empty strings
      ['a', ''],              // One empty string
      ['', 'a'],              // Other empty string
      ['a', 'a'],             // Single character
      ['ab', 'ba'],           // Same characters different order
      ['aaa', 'aaa'],         // Repeated characters
    ];

    const algorithms = {
      cosineSimilarity,
      hammingSimilarity,
      jaroWinklerSimilarity,
      levenshteinSimilarity,
    };

    Object.entries(algorithms).forEach(([name, func]) => {
      it(`${name} returns values between 0 and 1`, () => {
        testCases.forEach(([s1, s2]) => {
          const score = func(s1, s2);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  describe('special characters handling', () => {
    const specialChars = '!@#$%^&*()';
    const normalText = 'hello';
    const algorithms = {
      cosineSimilarity,
      hammingSimilarity,
      jaroWinklerSimilarity,
      levenshteinSimilarity,
    };

    Object.entries(algorithms).forEach(([name, func]) => {
      it(`${name} handles special characters`, () => {
        // Test with special characters
        expect(func(specialChars, specialChars)).toBe(1.0);

        // Test mixing special chars with normal text
        const score = func(normalText + specialChars, normalText);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('unicode handling', () => {
    const unicodeText1 = 'hello世界';
    const unicodeText2 = 'hello世界';
    const algorithms = {
      cosineSimilarity,
      jaroWinklerSimilarity,
      levenshteinSimilarity,
    };

    Object.entries(algorithms).forEach(([name, func]) => {
      it(`${name} handles unicode characters`, () => {
        expect(func(unicodeText1, unicodeText2)).toBe(1.0);
      });
    });
  });

  describe('long string handling', () => {
    const longText1 = 'a'.repeat(1000);
    const longText2 = 'a'.repeat(999) + 'b';
    const algorithms = {
      cosineSimilarity,
      jaroWinklerSimilarity,
      levenshteinSimilarity,
    };

    Object.entries(algorithms).forEach(([name, func]) => {
      it(`${name} handles long strings`, () => {
        const score = func(longText1, longText2);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });
});
