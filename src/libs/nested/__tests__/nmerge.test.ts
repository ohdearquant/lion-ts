import { nmerge } from '../nmerge';

describe('nmerge', () => {
  describe('dictionary merging', () => {
    test('should merge basic dictionaries', () => {
      const dict1 = { a: 1, b: 2 };
      const dict2 = { c: 3, d: 4 };
      expect(nmerge([dict1, dict2])).toEqual({ a: 1, b: 2, c: 3, d: 4 });
    });

    test('should handle overlapping keys without overwrite', () => {
      const dict1 = { a: 1, b: 2 };
      const dict2 = { b: 3, c: 4 };
      expect(nmerge([dict1, dict2])).toEqual({ a: 1, b: [2, 3], c: 4 });
    });

    test('should handle overlapping keys with overwrite', () => {
      const dict1 = { a: 1, b: 2 };
      const dict2 = { b: 3, c: 4 };
      expect(nmerge([dict1, dict2], { overwrite: true }))
        .toEqual({ a: 1, b: 3, c: 4 });
    });

    test('should handle dictSequence option', () => {
      const dict1 = { a: 1, b: 2 };
      const dict2 = { a: 3, b: 4 };
      expect(nmerge([dict1, dict2], { dictSequence: true }))
        .toEqual({ a: 1, a1: 3, b: 2, b1: 4 });
    });

    test('should merge nested dictionaries', () => {
      const dict1 = { a: { b: 1 } };
      const dict2 = { a: { c: 2 } };
      expect(nmerge([dict1, dict2])).toEqual({ a: { b: 1, c: 2 } });
    });

    test('should handle arrays in dictionaries', () => {
      const dict1 = { a: [1, 2] };
      const dict2 = { a: [3, 4] };
      expect(nmerge([dict1, dict2])).toEqual({ a: [[1, 2], [3, 4]] });
    });
  });

  describe('array merging', () => {
    test('should merge arrays', () => {
      const arr1 = [1, 2];
      const arr2 = [3, 4];
      expect(nmerge([arr1, arr2])).toEqual([1, 2, 3, 4]);
    });

    test('should handle sortList option', () => {
      const arr1 = [3, 1];
      const arr2 = [4, 2];
      expect(nmerge([arr1, arr2], { sortList: true }))
        .toEqual([1, 2, 3, 4]);
    });

    test('should handle customSort option', () => {
      const arr1 = [3, 1];
      const arr2 = [4, 2];
      const customSort = (a: unknown, b: unknown) => 
        Number(b) - Number(a); // Descending order
      expect(nmerge([arr1, arr2], { sortList: true, customSort }))
        .toEqual([4, 3, 2, 1]);
    });

    test('should merge nested arrays', () => {
      const arr1 = [[1, 2], [3, 4]];
      const arr2 = [[5, 6], [7, 8]];
      expect(nmerge([arr1, arr2])).toEqual([[1, 2], [3, 4], [5, 6], [7, 8]]);
    });
  });

  describe('error handling', () => {
    test('should throw error for non-array input', () => {
      expect(() => nmerge(null as any)).toThrow('Input must be an array');
      expect(() => nmerge(undefined as any)).toThrow('Input must be an array');
      expect(() => nmerge({} as any)).toThrow('Input must be an array');
    });

    test('should throw error for mixed types', () => {
      expect(() => nmerge([{}, []])).toThrow(/same type/);
      expect(() => nmerge([[1, 2], { a: 3 }])).toThrow(/same type/);
    });

    test('should handle empty input', () => {
      expect(nmerge([])).toEqual({});
      expect(nmerge([{}, {}])).toEqual({});
      expect(nmerge([[], []])).toEqual([]);
    });
  });

  describe('complex scenarios', () => {
    test('should handle deep nested structures', () => {
      const dict1 = {
        a: { b: { c: 1 } },
        d: { e: [1, 2] }
      };
      const dict2 = {
        a: { b: { d: 2 } },
        d: { e: [3, 4] }
      };
      expect(nmerge([dict1, dict2])).toEqual({
        a: { b: { c: 1, d: 2 } },
        d: { e: [[1, 2], [3, 4]] }
      });
    });

    test('should handle mixed value types', () => {
      const dict1 = { a: 1, b: 'string', c: true };
      const dict2 = { a: 2, b: 'text', c: false };
      expect(nmerge([dict1, dict2])).toEqual({
        a: [1, 2],
        b: ['string', 'text'],
        c: [true, false]
      });
    });

    test('should handle null and undefined values', () => {
      const dict1 = { a: null, b: undefined };
      const dict2 = { a: 1, b: 2 };
      expect(nmerge([dict1, dict2])).toEqual({
        a: [null, 1],
        b: [undefined, 2]
      });
    });
  });
});
