import { unflatten } from '../unflatten';

describe('unflatten', () => {
  describe('basic functionality', () => {
    test('should unflatten simple dictionary', () => {
      const data = {
        'a': 1,
        'b|c': 2,
        'b|d': 3
      };
      const result = unflatten(data);
      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 3
        }
      });
    });

    test('should unflatten simple array', () => {
      const data = {
        '0': 1,
        '1': 2,
        '2': 3
      };
      const result = unflatten(data);
      expect(result).toEqual([1, 2, 3]);
    });

    test('should handle empty input', () => {
      expect(unflatten({})).toEqual({});
    });
  });

  describe('options', () => {
    test('should use custom separator', () => {
      const data = {
        'a': 1,
        'b.c': 2,
        'b.d': 3
      };
      const result = unflatten(data, { sep: '.' });
      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 3
        }
      });
    });

    test('should handle inplace modification', () => {
      const data = {
        'a': 1,
        'b|c': 2,
        'b|d': 3
      };
      const result = unflatten(data, { inplace: true });
      expect(result).toBe(data);
      expect(result).toEqual({
        a: 1,
        b: {
          c: 2,
          d: 3
        }
      });
    });
  });

  describe('complex cases', () => {
    test('should handle mixed arrays and objects', () => {
      const data = {
        'a': 1,
        'b|0': 2,
        'b|1': 3,
        'c|d|0': 4,
        'c|d|1': 5
      };
      const result = unflatten(data);
      expect(result).toEqual({
        a: 1,
        b: [2, 3],
        c: {
          d: [4, 5]
        }
      });
    });

    test('should handle deeply nested structures', () => {
      const data: Record<string, number> = {};
      for (let i = 0; i < 5; i++) {
        data[`level${i}|sublevel`] = i;
      }
      const result = unflatten(data);
      for (let i = 0; i < 5; i++) {
        expect((result as any)[`level${i}`].sublevel).toBe(i);
      }
    });

    test('should handle array indices', () => {
      const data = {
        'arr|0|name': 'first',
        'arr|1|name': 'second',
        'arr|2|name': 'third'
      };
      const result = unflatten(data);
      expect(result).toEqual({
        arr: [
          { name: 'first' },
          { name: 'second' },
          { name: 'third' }
        ]
      });
    });
  });

  describe('error handling', () => {
    test('should throw error for invalid input', () => {
      expect(() => unflatten(null as any)).toThrow('Input must be a dictionary');
      expect(() => unflatten(undefined as any)).toThrow('Input must be a dictionary');
      expect(() => unflatten(42 as any)).toThrow('Input must be a dictionary');
    });

    test('should throw error for empty separator', () => {
      expect(() => unflatten({}, { sep: '' })).toThrow('Separator cannot be empty');
    });
  });
});
