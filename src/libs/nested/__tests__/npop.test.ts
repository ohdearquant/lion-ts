import { npop } from '../npop';
import { UNDEFINED } from '../../../types/undefined';
import { NestedContainer } from '../get_target_container';

describe('npop', () => {
  describe('various scenarios', () => {
    test.each([
      [{ a: { b: { c: 3 } } }, ['a', 'b', 'c'], 3, { a: { b: {} } }],
      [{ a: { b: [1, 2, 3] } }, ['a', 'b', 2], 3, { a: { b: [1, 2] } }],
      [{ a: [1, { b: 2 }] }, ['a', 1, 'b'], 2, { a: [1, {}] }],
      [{ a: 1, b: 2 }, ['b'], 2, { a: 1 }],
      [[1, [2, [3, 4]], 5], [1, 1, 0], 3, [1, [2, [4]], 5]],
      [
        { 'key with spaces': { nested: 'value' } },
        ['key with spaces', 'nested'],
        'value',
        { 'key with spaces': {} },
      ],
      [{ 0: 'zero', 1: 'one' }, ['1'], 'one', { 0: 'zero' }],
      [{ a: { b: null } }, ['a', 'b'], null, { a: {} }],
      [{ '': { nested: 'value' } }, ['', 'nested'], 'value', { '': {} }],
      [{ true: 'true', false: 'false' }, ['true'], 'true', { false: 'false' }],
      [{ a: { b: { c: { d: 1 } } } }, ['a', 'b', 'c', 'd'], 1, { a: { b: { c: {} } } }],
    ])('should pop value correctly', (data, indices, expectedResult, expectedData) => {
      expect(npop(data, indices)).toBe(expectedResult);
      expect(data).toEqual(expectedData);
    });
  });

  describe('error cases', () => {
    test.each([
      [{}, ['a']],
      [[], [0]],
      [{ a: { b: 2 } }, ['a', 'c']],
      [[1, 2, 3], [3]],
      [{ a: [1, 2] }, ['a', 2]],
      [{ a: { b: 1 } }, ['a', 'b', 'c']],
    ])('should throw KeyError for invalid path', (data, indices) => {
      expect(() => npop(data, indices)).toThrow('Invalid npop');
    });

    test.each([
      [[1, 2, 3], ['a']],
      [{ a: 1 }, [0]],
      [{ a: [1, 2, 3] }, ['a', 'b']],
    ])('should throw TypeError for invalid index type', (data, indices) => {
      expect(() => npop(data, indices)).toThrow('Invalid npop');
    });

    test('should throw error for empty indices', () => {
      const data = { a: 1 };
      expect(() => npop(data, [])).toThrow('Indices list cannot be empty');
    });

    test('should throw error for null data', () => {
      expect(() => npop(null as any as NestedContainer, ['a'])).toThrow('Invalid npop');
    });

    test('should throw error for non-subscriptable data', () => {
      expect(() => npop(42 as any as NestedContainer, [0])).toThrow('Invalid npop');
    });
  });

  describe('special cases', () => {
    test('should handle zero index', () => {
      const data = [1, 2, 3];
      expect(npop(data, [0])).toBe(1);
      expect(data).toEqual([2, 3]);
    });

    test('should throw error for string index on array', () => {
      const data = [1, 2, 3];
      expect(() => npop(data, ['0'])).toThrow('Invalid npop');
    });

    test('should handle string index for object', () => {
      const data = { '0': 'value' };
      expect(npop(data, ['0'])).toBe('value');
      expect(data).toEqual({});
    });
  });

  describe('long paths', () => {
    test.each([
      [{ a: 1, b: 2, c: 3 }, ['c'], 3, { a: 1, b: 2 }],
      [[1, 2, [3, 4, [5, 6]]], [2, 2, 1], 6, [1, 2, [3, 4, [5]]]],
      [
        { a: [{ b: { c: [1, 2, 3] } }] },
        ['a', 0, 'b', 'c', 2],
        3,
        { a: [{ b: { c: [1, 2] } }] },
      ],
    ])('should handle long nested paths', (data, indices, expectedResult, expectedData) => {
      expect(npop(data, indices)).toBe(expectedResult);
      expect(data).toEqual(expectedData);
    });
  });

  test('should handle all TypeScript basic types', () => {
    const data = {
      int: 1,
      float: 2.0,
      str: 'string',
      list: [1, 2, 3],
      tuple: [4, 5, 6],
      dict: { key: 'value' },
      bool: true,
      null: null,
      undefined: undefined,
    };
    const keys = Object.keys(data);
    for (const key of keys) {
      const value = data[key as keyof typeof data];
      expect(npop(data, [key])).toBe(value);
    }
    expect(data).toEqual({});
  });

  test('should handle circular references', () => {
    const data: Record<string, any> = { a: 1 };
    data['b'] = data;
    expect(npop(data, ['a'])).toBe(1);
    expect(Object.keys(data).length).toBe(1);
    expect('b' in data).toBe(true);
    expect(data['b']).toBe(data);
  });
});
