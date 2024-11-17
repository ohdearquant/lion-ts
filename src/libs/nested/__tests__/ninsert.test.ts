import { ninsert } from '../ninsert';

describe('ninsert', () => {
  describe('basic functionality', () => {
    test('should insert value in nested object', () => {
      const data: Record<string, any> = { a: { b: {} } };
      ninsert(data, ['a', 'b', 'c'], 1);
      expect(data.a.b.c).toBe(1);
    });

    test('should insert value in nested array', () => {
      const data: any[] = [1, [2]];
      ninsert(data, [1, 1], 3);
      expect(data[1][1]).toBe(3);
    });

    test('should insert value in mixed structure', () => {
      const data: Record<string, any> = { a: [{}] };
      ninsert(data, ['a', 0, 'b'], 1);
      expect(data.a[0].b).toBe(1);
    });
  });

  describe('path creation', () => {
    test('should create missing object path', () => {
      const data: Record<string, any> = {};
      ninsert(data, ['a', 'b', 'c'], 1);
      expect(data.a.b.c).toBe(1);
    });

    test('should create missing array path', () => {
      const data: any[] = [];
      ninsert(data, [0, 0, 0], 1);
      expect(data[0][0][0]).toBe(1);
    });

    test('should create mixed path', () => {
      const data: Record<string, any> = {};
      ninsert(data, ['a', 0, 'b'], 1);
      expect(data.a[0].b).toBe(1);
    });
  });

  describe('error handling', () => {
    test('should throw error for empty indices', () => {
      const data: Record<string, any> = {};
      expect(() => ninsert(data, [], 1)).toThrow('Indices list cannot be empty');
    });

    test('should throw error for null indices', () => {
      const data: Record<string, any> = {};
      expect(() => ninsert(data, null as any, 1)).toThrow('Indices list cannot be empty');
    });

    test('should throw error for undefined indices', () => {
      const data: Record<string, any> = {};
      expect(() => ninsert(data, undefined as any, 1)).toThrow('Indices list cannot be empty');
    });

    test('should throw error for numeric index on non-array', () => {
      const data: Record<string, any> = {};
      expect(() => ninsert(data, [0], 1)).toThrow('Cannot use numeric index on non-array');
    });

    test('should throw error for string index on array', () => {
      const data: any[] = [];
      expect(() => ninsert(data, ['a'], 1)).toThrow('Cannot use string key on non-object');
    });
  });

  describe('special cases', () => {
    test('should handle deep path creation', () => {
      const data: Record<string, any> = {};
      ninsert(data, ['level999'], 999);
      expect(data['level999']).toBe(999);
    });

    test('should handle numeric string indices for objects', () => {
      const data: Record<string, any> = {};
      ninsert(data, ['0'], 'value');
      expect(data['0']).toBe('value');
    });

    test('should handle numeric indices for arrays', () => {
      const data: any[] = [];
      ninsert(data, [1], 'value');
      expect(data[1]).toBe('value');
    });
  });

  describe('edge cases', () => {
    test('should handle empty object', () => {
      const data: Record<string, any> = {};
      ninsert(data, ['a'], 1);
      expect(data.a).toBe(1);
    });

    test('should handle empty array', () => {
      const data: any[] = [];
      ninsert(data, [0], 1);
      expect(data[0]).toBe(1);
    });

    test('should handle deeply nested path', () => {
      const data: Record<string, any> = {};
      ninsert(data, ['a', 'b', 'c', 'd', 'e'], 1);
      expect(data.a.b.c.d.e).toBe(1);
    });

    test('should handle array of objects', () => {
      const data: any[] = [{}, {}];
      ninsert(data, [1, 'a'], 2);
      expect(data[1].a).toBe(2);
    });
  });
});
