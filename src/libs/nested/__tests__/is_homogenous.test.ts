import { isHomogenous } from '../is_homogenous';

describe('isHomogenous', () => {
  describe('array checks', () => {
    test('should return true for homogeneous arrays', () => {
      expect(isHomogenous([1, 2, 3], Number)).toBe(true);
      expect(isHomogenous(['a', 'b', 'c'], String)).toBe(true);
      expect(isHomogenous([true, false, true], Boolean)).toBe(true);
      expect(isHomogenous([[], [], []], Array)).toBe(true);
      expect(isHomogenous([{}, {}, {}], Object)).toBe(true);
    });

    test('should return false for heterogeneous arrays', () => {
      expect(isHomogenous([1, 'a', true], Number)).toBe(false);
      expect(isHomogenous([1, '2', 3], Number)).toBe(false);
      expect(isHomogenous(['1', 2, '3'], String)).toBe(false);
    });

    test('should handle empty arrays', () => {
      expect(isHomogenous([], Number)).toBe(true);
      expect(isHomogenous([], String)).toBe(true);
      expect(isHomogenous([], Boolean)).toBe(true);
    });

    test('should support multiple type checks', () => {
      expect(isHomogenous([1, '2', true], [Number, String, Boolean])).toBe(true);
      expect(isHomogenous([1, '2', {}], [Number, String, Boolean])).toBe(false);
    });
  });

  describe('object checks', () => {
    test('should return true for homogeneous object values', () => {
      expect(isHomogenous({ a: 1, b: 2, c: 3 }, Number)).toBe(true);
      expect(isHomogenous({ a: 'x', b: 'y', c: 'z' }, String)).toBe(true);
      expect(isHomogenous({ a: true, b: false }, Boolean)).toBe(true);
      expect(isHomogenous({ a: [], b: [] }, Array)).toBe(true);
      expect(isHomogenous({ a: {}, b: {} }, Object)).toBe(true);
    });

    test('should return false for heterogeneous object values', () => {
      expect(isHomogenous({ a: 1, b: 'two', c: true }, Number)).toBe(false);
      expect(isHomogenous({ a: '1', b: 2, c: '3' }, String)).toBe(false);
      expect(isHomogenous({ a: true, b: 1 }, Boolean)).toBe(false);
    });

    test('should handle empty objects', () => {
      expect(isHomogenous({}, Number)).toBe(true);
      expect(isHomogenous({}, String)).toBe(true);
      expect(isHomogenous({}, Boolean)).toBe(true);
    });

    test('should support multiple type checks', () => {
      expect(isHomogenous({ a: 1, b: '2', c: true }, [Number, String, Boolean])).toBe(true);
      expect(isHomogenous({ a: 1, b: '2', c: {} }, [Number, String, Boolean])).toBe(false);
    });
  });

  describe('single value checks', () => {
    test('should handle primitive values', () => {
      expect(isHomogenous(1, Number)).toBe(true);
      expect(isHomogenous('test', String)).toBe(true);
      expect(isHomogenous(true, Boolean)).toBe(true);
      expect(isHomogenous(1, String)).toBe(false);
      expect(isHomogenous('test', Number)).toBe(false);
      expect(isHomogenous(true, String)).toBe(false);
    });

    test('should handle objects and arrays', () => {
      expect(isHomogenous([], Array)).toBe(true);
      expect(isHomogenous({}, Object)).toBe(true);
      expect(isHomogenous([], Object)).toBe(false);
      expect(isHomogenous({}, Array)).toBe(false);
    });

    test('should handle null and undefined', () => {
      expect(isHomogenous(null, Object)).toBe(false);
      expect(isHomogenous(undefined, Object)).toBe(false);
    });

    test('should support multiple type checks', () => {
      expect(isHomogenous(1, [Number, String])).toBe(true);
      expect(isHomogenous('test', [Number, String])).toBe(true);
      expect(isHomogenous(true, [Number, String])).toBe(false);
    });
  });

  describe('class instance checks', () => {
    class TestClass {
      constructor(public value: any) {}
    }

    test('should handle class instances', () => {
      const instances = [new TestClass(1), new TestClass(2)];
      expect(isHomogenous(instances, TestClass)).toBe(true);
      expect(isHomogenous(instances, Object)).toBe(true);
      expect(isHomogenous(instances, Array)).toBe(false);
    });

    test('should handle mixed class instances', () => {
      const mixed = [new TestClass(1), { value: 2 }];
      expect(isHomogenous(mixed, TestClass)).toBe(false);
      expect(isHomogenous(mixed, Object)).toBe(true);
    });

    test('should handle single class instance', () => {
      const instance = new TestClass(1);
      expect(isHomogenous(instance, TestClass)).toBe(true);
      expect(isHomogenous(instance, Object)).toBe(true);
      expect(isHomogenous(instance, Array)).toBe(false);
    });
  });
});
