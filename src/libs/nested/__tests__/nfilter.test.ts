import { nfilter } from '../nfilter';

describe('nfilter', () => {
  describe('basic functionality', () => {
    test('should filter nested dictionary', () => {
      const data = { a: 1, b: { c: 2, d: 3 }, e: 4 };
      const result = nfilter(data, (x: any): boolean => 
        typeof x === 'number' && x % 2 === 0
      );
      expect(result).toEqual({ b: { c: 2 }, e: 4 });
    });

    test('should filter nested list', () => {
      const data = [1, [2, 3], 4];
      const result = nfilter(data, (x: any): boolean => 
        typeof x === 'number' && x % 2 === 0
      );
      expect(result).toEqual([2, 4]);
    });

    test('should handle empty structures', () => {
      expect(nfilter([], (x: any): boolean => true)).toEqual([]);
      expect(nfilter({}, (x: any): boolean => true)).toEqual({});
    });
  });

  describe('error handling', () => {
    test('should throw error for invalid input', () => {
      expect(() => nfilter(null as any, (x: any): boolean => true))
        .toThrow('The nested_structure must be either a dict or a list.');
      expect(() => nfilter(undefined as any, (x: any): boolean => true))
        .toThrow('The nested_structure must be either a dict or a list.');
      expect(() => nfilter(42 as any, (x: any): boolean => true))
        .toThrow('The nested_structure must be either a dict or a list.');
    });
  });

  describe('complex cases', () => {
    test('should handle deeply nested structures', () => {
      const data = {
        a: { b: { c: 1, d: 2 } },
        e: { f: { g: 3, h: 4 } }
      };
      const result = nfilter(data, (x: any): boolean => 
        typeof x === 'number' && x % 2 === 0
      );
      expect(result).toEqual({
        a: { b: { d: 2 } },
        e: { f: { h: 4 } }
      });
    });

    test('should handle mixed types', () => {
      const data = {
        a: 1,
        b: 'string',
        c: { d: 2, e: 'another' },
        f: [3, 'third', 4]
      };
      const result = nfilter(data, (x: any): boolean => 
        typeof x === 'number' && x % 2 === 0
      );
      expect(result).toEqual({
        c: { d: 2 },
        f: [4]
      });
    });

    test('should handle arrays of objects', () => {
      const data = [
        { a: 1, b: 2 },
        { c: 3, d: 4 },
        { e: 5, f: 6 }
      ];
      const result = nfilter(data, (x: any): boolean => 
        typeof x === 'number' && x % 2 === 0
      );
      expect(result).toEqual([
        { b: 2 },
        { d: 4 },
        { f: 6 }
      ]);
    });
  });
});
