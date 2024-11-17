import { nget } from '../nget';

describe('nget', () => {
  describe('basic functionality', () => {
    test('should get value from nested object', () => {
      const data = { a: { b: { c: 1 } } };
      expect(nget(data, ['a', 'b', 'c'])).toBe(1);
    });

    test('should get value from nested array', () => {
      const data = [1, [2, [3]]];
      expect(nget(data, [1, 1, 0])).toBe(3);
    });

    test('should get value from mixed structure', () => {
      const data = { a: [{ b: 1 }] };
      expect(nget(data, ['a', 0, 'b'])).toBe(1);
    });
  });

  describe('default values', () => {
    test('should return default value if path not found', () => {
      const data = { a: 1 };
      expect(nget(data, ['b'], 'default')).toBe('default');
    });

    test('should return default value for invalid array index', () => {
      const data = [1, 2, 3];
      expect(nget(data, [5], 'default')).toBe('default');
    });

    test('should return default value for invalid nested path', () => {
      const data = { a: { b: 1 } };
      expect(nget(data, ['a', 'c', 'd'], 'default')).toBe('default');
    });
  });

  describe('error cases', () => {
    test('should handle empty indices', () => {
      const data = { a: 1 };
      const result = nget(data, []);
      expect(result).toEqual(data);
    });

    test('should throw error for null data', () => {
      expect(() => nget(null as any, ['a'])).toThrow('Target not found');
    });

    test('should throw error for undefined data', () => {
      expect(() => nget(undefined as any, ['a'])).toThrow('Target not found');
    });

    test('should throw error for non-object/non-array', () => {
      expect(() => nget(42 as any, ['a'])).toThrow('Target not found');
    });
  });

  describe('special cases', () => {
    test('should throw error for string index on array', () => {
      const data = [1, 2, 3];
      expect(() => nget(data, ['0'])).toThrow('Target not found');
    });

    test('should handle string index for object', () => {
      const data = { '0': 'value' };
      expect(nget(data, ['0'])).toBe('value');
    });

    test('should handle numeric index for array', () => {
      const data = [1, 2, 3];
      expect(nget(data, [1])).toBe(2);
    });

    test('should handle numeric string index for array', () => {
      const data = [1, 2, 3];
      expect(() => nget(data, ['1'])).toThrow('Target not found');
    });
  });

  describe('edge cases', () => {
    test('should handle empty object', () => {
      const data = {};
      expect(nget(data, ['a'], 'default')).toBe('default');
    });

    test('should handle empty array', () => {
      const data: any[] = [];
      expect(nget(data, [0], 'default')).toBe('default');
    });

    test('should handle deeply nested path', () => {
      const data = { a: { b: { c: { d: { e: 1 } } } } };
      expect(nget(data, ['a', 'b', 'c', 'd', 'e'])).toBe(1);
    });

    test('should handle array of objects', () => {
      const data = [{ a: 1 }, { a: 2 }];
      expect(nget(data, [1, 'a'])).toBe(2);
    });
  });
});
