import { flatten } from '../flatten';
import { NestedContainer } from '../get_target_container';

describe('flatten', () => {
  describe('basic flattening', () => {
    test.each([
      [
        { a: 1, b: { c: 2, d: { e: 3 } } },
        { a: 1, 'b|c': 2, 'b|d|e': 3 },
        '|',
        undefined,
        false,
      ],
      [
        { a: 1, b: [1, 2, { c: 3 }] },
        { a: 1, 'b|0': 1, 'b|1': 2, 'b|2|c': 3 },
        '|',
        undefined,
        false,
      ],
      [
        { a: [1, { b: 2 }], c: { d: [3, { e: 4 }] } },
        { 'a|0': 1, 'a|1|b': 2, 'c|d|0': 3, 'c|d|1|e': 4 },
        '|',
        undefined,
        false,
      ],
      [{}, {}, '|', undefined, false],
      [[], {}, '|', undefined, false],
      [
        { a: 1, b: 2, c: 3 },
        { a: 1, b: 2, c: 3 },
        '|',
        undefined,
        false,
      ],
      [
        { a: 1, b: { c: 2, d: { e: 3 } } },
        { a: 1, 'b|c': 2, 'b|d': { e: 3 } },
        '|',
        2,
        false,
      ],
      [
        { a: 1, b: { c: 2, d: [3, { e: 4 }] } },
        { a: 1, 'b|c': 2, 'b|d': [3, { e: 4 }] },
        '|',
        undefined,
        true,
      ],
      [
        { a: 1, b: { c: 2, d: { e: 3 } } },
        { a: 1, 'b/c': 2, 'b/d/e': 3 },
        '/',
        undefined,
        false,
      ],
      [
        { a: { b: { c: { d: 1 } } } },
        { 'a|b|c|d': 1 },
        '|',
        undefined,
        false,
      ],
      [
        { a: [1, [2, [3]]] },
        { 'a|0': 1, 'a|1|0': 2, 'a|1|1|0': 3 },
        '|',
        undefined,
        false,
      ],
      [
        { a: 1, b: [2, 3] },
        { a: 1, 'b|0': 2, 'b|1': 3 },
        '|',
        undefined,
        false,
      ],
      [
        { a: new Set([1, 2, 3]) },
        { a: new Set([1, 2, 3]) },
        '|',
        undefined,
        false,
      ],
    ])('should flatten nested structure correctly', (input, expected, sep, maxDepth, dictOnly) => {
      expect(flatten(input, { sep, maxDepth, dictOnly })).toEqual(expected);
    });
  });

  test('should flatten in place', () => {
    const data = { a: 1, b: { c: 2, d: { e: 3 } } };
    const expected = { a: 1, 'b|c': 2, 'b|d|e': 3 };
    flatten(data, { inplace: true });
    expect(data).toEqual(expected);
  });

  test('should throw error for invalid in place', () => {
    const data = [1, 2, 3];
    expect(() => flatten(data, { inplace: true })).toThrow(
      "Object must be a dictionary when 'inplace' is True"
    );
  });

  test('should throw error for null data', () => {
    expect(() => flatten(null as any as NestedContainer)).toThrow(
      'Cannot flatten null objects'
    );
  });

  test('should throw error for non-string keys', () => {
    const data = { 1: 'a', 2: 'b' } as any;
    expect(() => flatten(data)).toThrow(
      'Unsupported key type: number. Only string keys are acceptable'
    );
  });

  describe('flattened keys', () => {
    test.each([
      [
        { a: 1, b: { c: 2, d: { e: 3 } } },
        ['a', 'b|c', 'b|d|e'],
        '|',
        undefined,
        false,
      ],
      [
        { a: 1, b: [1, 2, { c: 3 }] },
        ['a', 'b|0', 'b|1', 'b|2|c'],
        '|',
        undefined,
        false,
      ],
      [{}, [], '|', undefined, false],
      [[], [], '|', undefined, false],
      [
        { a: 1, b: { c: 2, d: { e: 3 } } },
        ['a', 'b|c', 'b|d'],
        '|',
        2,
        false,
      ],
      [
        { a: 1, b: { c: 2, d: [3, { e: 4 }] } },
        ['a', 'b|c', 'b|d'],
        '|',
        undefined,
        true,
      ],
    ])('should get flattened keys correctly', (input, expected, sep, maxDepth, dictOnly) => {
      const flattened = flatten(input, { sep, maxDepth, dictOnly });
      expect(Object.keys(flattened).sort()).toEqual(expected.sort());
    });
  });
});
