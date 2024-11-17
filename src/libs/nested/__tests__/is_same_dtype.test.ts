import { isSameDtype } from '../is_same_dtype';

describe('isSameDtype', () => {
  describe('array checks', () => {
    test('should return true for arrays with same type', () => {
      expect(isSameDtype([1, 2, 3])).toBe(true);
      expect(isSameDtype(['a', 'b', 'c'])).toBe(true);
      expect(isSameDtype([true, false, true])).toBe(true);
      expect(isSameDtype([[], [], []])).toBe(true);
      expect(isSameDtype([{}, {}, {}])).toBe(true);
    });

    test('should return false for arrays with mixed types', () => {
      expect(isSameDtype([1, '2', 3])).toBe(false);
      expect(isSameDtype(['1', 2, '3'])).toBe(false);
      expect(isSameDtype([true, 1, false])).toBe(false);
    });

    test('should handle empty arrays', () => {
      expect(isSameDtype([])).toBe(true);
      expect(isSameDtype([], { returnDtype: true })).toEqual([true, null]);
    });

    test('should handle arrays with null/undefined', () => {
      expect(isSameDtype([1, null, 3])).toBe(false);
      expect(isSameDtype([1, undefined, 3])).toBe(false);
    });
  });

  describe('object checks', () => {
    test('should return true for objects with same value types', () => {
      expect(isSameDtype({ a: 1, b: 2, c: 3 })).toBe(true);
      expect(isSameDtype({ a: 'x', b: 'y', c: 'z' })).toBe(true);
      expect(isSameDtype({ a: true, b: false })).toBe(true);
      expect(isSameDtype({ a: [], b: [] })).toBe(true);
      expect(isSameDtype({ a: {}, b: {} })).toBe(true);
    });

    test('should return false for objects with mixed value types', () => {
      expect(isSameDtype({ a: 1, b: '2', c: 3 })).toBe(false);
      expect(isSameDtype({ a: 'x', b: 1, c: 'z' })).toBe(false);
      expect(isSameDtype({ a: true, b: 1 })).toBe(false);
    });

    test('should handle empty objects', () => {
      expect(isSameDtype({})).toBe(true);
      expect(isSameDtype({}, { returnDtype: true })).toEqual([true, null]);
    });

    test('should handle objects with null/undefined values', () => {
      expect(isSameDtype({ a: 1, b: null, c: 3 })).toBe(false);
      expect(isSameDtype({ a: 1, b: undefined, c: 3 })).toBe(false);
    });
  });

  describe('dtype option', () => {
    test('should check against specified type for arrays', () => {
      expect(isSameDtype([1, 2, 3], { dtype: Number })).toBe(true);
      expect(isSameDtype([1, '2', 3], { dtype: Number })).toBe(false);
      expect(isSameDtype(['1', '2', '3'], { dtype: String })).toBe(true);
      expect(isSameDtype([true, false], { dtype: Boolean })).toBe(true);
    });

    test('should check against specified type for objects', () => {
      expect(isSameDtype({ a: 1, b: 2 }, { dtype: Number })).toBe(true);
      expect(isSameDtype({ a: '1', b: '2' }, { dtype: String })).toBe(true);
      expect(isSameDtype({ a: true, b: 1 }, { dtype: Boolean })).toBe(false);
    });
  });

  describe('returnDtype option', () => {
    test('should return type information for arrays', () => {
      expect(isSameDtype([1, 2, 3], { returnDtype: true })).toEqual([true, Number]);
      expect(isSameDtype(['a', 'b'], { returnDtype: true })).toEqual([true, String]);
      expect(isSameDtype([true, false], { returnDtype: true })).toEqual([true, Boolean]);
      expect(isSameDtype([1, '2'], { returnDtype: true })).toEqual([false, Number]);
    });

    test('should return type information for objects', () => {
      expect(isSameDtype({ a: 1, b: 2 }, { returnDtype: true })).toEqual([true, Number]);
      expect(isSameDtype({ a: 'x', b: 'y' }, { returnDtype: true })).toEqual([true, String]);
      expect(isSameDtype({ a: true, b: 1 }, { returnDtype: true })).toEqual([false, Boolean]);
    });
  });

  describe('class instance checks', () => {
    class TestClass {
      constructor(public value: any) {}
    }

    test('should handle class instances in arrays', () => {
      const instances = [new TestClass(1), new TestClass(2)];
      expect(isSameDtype(instances)).toBe(true);
      expect(isSameDtype(instances, { dtype: TestClass })).toBe(true);
      expect(isSameDtype([...instances, {}])).toBe(false);
    });

    test('should handle class instances in objects', () => {
      const obj = {
        a: new TestClass(1),
        b: new TestClass(2)
      };
      expect(isSameDtype(obj)).toBe(true);
      expect(isSameDtype(obj, { dtype: TestClass })).toBe(true);
      expect(isSameDtype({ ...obj, c: {} })).toBe(false);
    });

    test('should return correct type information for class instances', () => {
      const instances = [new TestClass(1), new TestClass(2)];
      expect(isSameDtype(instances, { returnDtype: true })).toEqual([true, TestClass]);
    });
  });
});
