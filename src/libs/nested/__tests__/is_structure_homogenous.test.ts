import { isStructureHomogenous } from '../is_structure_homogenous';

describe('isStructureHomogenous', () => {
  describe('array structures', () => {
    test('should return true for homogeneous array structures', () => {
      expect(isStructureHomogenous([[1, 2], [3, 4]])).toBe(true);
      expect(isStructureHomogenous([[], [], []])).toBe(true);
      expect(isStructureHomogenous([[1], [], [2, 3]])).toBe(true);
      expect(isStructureHomogenous([[[1]], [[2]], [[]]])).toBe(true);
    });

    test('should return false for mixed array structures', () => {
      expect(isStructureHomogenous([[1, 2], { a: 3 }])).toBe(false);
      expect(isStructureHomogenous([[1], [{ a: 2 }]])).toBe(false);
      expect(isStructureHomogenous([[[1]], [2]])).toBe(true); // Non-container items don't affect homogeneity
    });

    test('should handle arrays with primitive values', () => {
      expect(isStructureHomogenous([1, 2, 3])).toBe(true);
      expect(isStructureHomogenous(['a', 'b', 'c'])).toBe(true);
      expect(isStructureHomogenous([true, false])).toBe(true);
      expect(isStructureHomogenous([1, 'a', true])).toBe(true); // Different primitives don't affect homogeneity
    });
  });

  describe('object structures', () => {
    test('should return true for homogeneous object structures', () => {
      expect(isStructureHomogenous({ a: { b: 1 }, c: { d: 2 } })).toBe(true);
      expect(isStructureHomogenous({ a: {}, b: {} })).toBe(true);
      expect(isStructureHomogenous({ a: { b: { c: 1 } }, d: { e: {} } })).toBe(true);
    });

    test('should return false for mixed object structures', () => {
      expect(isStructureHomogenous({ a: { b: 1 }, c: [1, 2] })).toBe(false);
      expect(isStructureHomogenous({ a: {}, b: [] })).toBe(false);
      expect(isStructureHomogenous({ a: { b: [] }, c: { d: {} } })).toBe(false);
    });

    test('should handle objects with primitive values', () => {
      expect(isStructureHomogenous({ a: 1, b: 2 })).toBe(true);
      expect(isStructureHomogenous({ a: 'x', b: 'y' })).toBe(true);
      expect(isStructureHomogenous({ a: true, b: 1, c: 'x' })).toBe(true); // Different primitives don't affect homogeneity
    });
  });

  describe('returnStructureType option', () => {
    test('should return correct type for array structures', () => {
      expect(isStructureHomogenous([[1, 2], [3, 4]], { returnStructureType: true }))
        .toEqual([true, Array]);
      expect(isStructureHomogenous([1, 2, 3], { returnStructureType: true }))
        .toEqual([true, null]); // primitive values
      expect(isStructureHomogenous([[1], { a: 2 }], { returnStructureType: true }))
        .toEqual([false, null]); // mixed structure
    });

    test('should return correct type for object structures', () => {
      expect(isStructureHomogenous({ a: { b: 1 }, c: { d: 2 } }, { returnStructureType: true }))
        .toEqual([true, Object]);
      expect(isStructureHomogenous({ a: 1, b: 2 }, { returnStructureType: true }))
        .toEqual([true, null]); // primitive values
      expect(isStructureHomogenous({ a: {}, b: [] }, { returnStructureType: true }))
        .toEqual([false, null]); // mixed structure
    });
  });

  describe('edge cases', () => {
    test('should handle empty structures', () => {
      expect(isStructureHomogenous([])).toBe(true);
      expect(isStructureHomogenous({})).toBe(true);
      expect(isStructureHomogenous([], { returnStructureType: true }))
        .toEqual([true, null]);
      expect(isStructureHomogenous({}, { returnStructureType: true }))
        .toEqual([true, null]);
    });

    test('should handle null and undefined', () => {
      expect(isStructureHomogenous(null)).toBe(true);
      expect(isStructureHomogenous(undefined)).toBe(true);
      expect(isStructureHomogenous([null, undefined])).toBe(true);
      expect(isStructureHomogenous({ a: null, b: undefined })).toBe(true);
    });

    test('should handle deeply nested structures', () => {
      const deepArray = [[[[1]]], [[[2]]]];
      const deepObject = { a: { b: { c: { d: { e: 1 } } } } };
      const mixedDeep = { a: { b: { c: { d: [1] } } } };

      expect(isStructureHomogenous(deepArray)).toBe(true);
      expect(isStructureHomogenous(deepObject)).toBe(true);
      expect(isStructureHomogenous(mixedDeep)).toBe(false);
    });

    test('should handle complex mixed structures', () => {
      const complex1 = {
        a: { b: { c: 1 } },
        d: { e: { f: [1] } } // Mixed: object contains array
      };
      const complex2 = [
        [{ a: 1 }], // Mixed: array contains object
        [[2]]
      ];
      const complex3 = {
        a: { b: [1], c: { d: 2 } }, // Mixed: siblings have different types
        e: { f: { g: 3 } }
      };

      expect(isStructureHomogenous(complex1)).toBe(false);
      expect(isStructureHomogenous(complex2)).toBe(false);
      expect(isStructureHomogenous(complex3)).toBe(false);
    });
  });
});
