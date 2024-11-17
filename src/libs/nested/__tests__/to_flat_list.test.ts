import { toFlatList } from '../to_flat_list';

describe('toFlatList', () => {
  describe('basic flattening', () => {
    test('should flatten nested arrays', () => {
      expect(toFlatList([1, [2, 3], [[4]]])).toEqual([1, 2, 3, 4]);
      expect(toFlatList([[1, 2], [3, 4]])).toEqual([1, 2, 3, 4]);
      expect(toFlatList([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
    });

    test('should handle empty arrays', () => {
      expect(toFlatList([])).toEqual([]);
      expect(toFlatList([[], []])).toEqual([]);
      expect(toFlatList([1, [], 2])).toEqual([1, 2]);
    });

    test('should handle arrays with different types', () => {
      expect(toFlatList([1, 'a', true, [2, 'b']])).toEqual([1, 'a', true, 2, 'b']);
      expect(toFlatList([null, [undefined, [null]]])).toEqual([null, undefined, null]);
      expect(toFlatList([{}, [{}, [{}]]])).toEqual([{}, {}, {}]);
    });
  });

  describe('dropna option', () => {
    test('should remove null and undefined values when dropna is true', () => {
      expect(toFlatList([1, null, [2, undefined]], { dropna: true })).toEqual([1, 2]);
      expect(toFlatList([null, [undefined]], { dropna: true })).toEqual([]);
      expect(toFlatList([1, [null, [2, undefined], 3]], { dropna: true })).toEqual([1, 2, 3]);
    });

    test('should keep null and undefined values when dropna is false', () => {
      expect(toFlatList([1, null, [2, undefined]])).toEqual([1, null, 2, undefined]);
      expect(toFlatList([null, [undefined]])).toEqual([null, undefined]);
    });
  });

  describe('unique option', () => {
    test('should remove duplicate values when unique is true', () => {
      expect(toFlatList([1, [2, 1], [2]], { unique: true })).toEqual([1, 2]);
      expect(toFlatList(['a', ['b', 'a'], ['b']], { unique: true })).toEqual(['a', 'b']);
      expect(toFlatList([true, [false, true]], { unique: true })).toEqual([true, false]);
    });

    test('should keep duplicate values when unique is false', () => {
      expect(toFlatList([1, [2, 1], [2]])).toEqual([1, 2, 1, 2]);
      expect(toFlatList(['a', ['b', 'a'], ['b']])).toEqual(['a', 'b', 'a', 'b']);
    });

    test('should handle objects with unique option', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      // Objects with same content are different references
      expect(toFlatList([obj1, [obj2, { id: 1 }]], { unique: true }))
        .toEqual([obj1, obj2, { id: 1 }]);
      // Same object references are deduplicated
      expect(toFlatList([obj1, [obj2, obj1]], { unique: true }))
        .toEqual([obj1, obj2]);
    });
  });

  describe('combined options', () => {
    test('should handle both dropna and unique options', () => {
      expect(toFlatList([1, null, [2, undefined, 1]], { dropna: true, unique: true }))
        .toEqual([1, 2]);
      expect(toFlatList([null, [1, null, 1]], { dropna: true, unique: true }))
        .toEqual([1]);
    });
  });

  describe('non-array inputs', () => {
    test('should handle non-array iterables', () => {
      expect(toFlatList(new Set([1, 2, 3]))).toEqual([1, 2, 3]);
      expect(toFlatList(new Map([[1, 'a'], [2, 'b']]))).toEqual([[1, 'a'], [2, 'b']]);
    });

    test('should handle primitive inputs', () => {
      expect(toFlatList(1)).toEqual([1]);
      expect(toFlatList('abc')).toEqual(['abc']); // String is iterable but treated as primitive
      expect(toFlatList(true)).toEqual([true]);
    });

    test('should handle null and undefined inputs', () => {
      expect(toFlatList(null)).toEqual([]);
      expect(toFlatList(undefined)).toEqual([]);
    });

    test('should handle object inputs', () => {
      expect(toFlatList({ a: 1, b: 2 })).toEqual([{ a: 1, b: 2 }]);
      expect(toFlatList(new Date())).toEqual([expect.any(Date)]);
    });
  });

  describe('edge cases', () => {
    test('should handle deeply nested structures', () => {
      const deep = [1, [2, [3, [4, [5, [6]]]]]];
      expect(toFlatList(deep)).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('should handle circular references', () => {
      const circular: any[] = [1, [2, 3]];
      circular.push(circular);
      expect(() => toFlatList(circular)).not.toThrow();
    });

    test('should handle large arrays', () => {
      const large = Array(1000).fill(0).map((_, i) => [i]);
      expect(toFlatList(large)).toHaveLength(1000);
    });

    test('should handle mixed content', () => {
      const mixed = [
        1,
        'string',
        true,
        null,
        undefined,
        [2, ['nested']],
        { key: 'value' },
        new Date(),
        Symbol('sym'),
        /regex/,
        new Set([1, 2]),
        new Map([[1, 'a']])
      ];
      expect(() => toFlatList(mixed)).not.toThrow();
    });
  });
});
