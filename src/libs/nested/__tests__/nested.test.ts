import { nget } from '../nget';
import { nset } from '../nset';
import { ninsert } from '../ninsert';
import { npop } from '../npop';
import { nfilter } from '../nfilter';

describe('nested operations integration', () => {
  describe('combined operations', () => {
    test('should handle sequence of operations', () => {
      const data = { a: { b: [1, 2, { c: 3 }] } };

      // Get nested value
      expect(nget(data, ['a', 'b', 2, 'c'])).toBe(3);

      // Set nested value
      nset(data, ['a', 'b', 2, 'c'], 4);
      expect(nget(data, ['a', 'b', 2, 'c'])).toBe(4);

      // Insert new value
      ninsert(data, ['a', 'b', 2, 'd'], 5);
      expect(nget(data, ['a', 'b', 2, 'd'])).toBe(5);

      // Pop value
      const popped = npop(data, ['a', 'b', 2, 'c']);
      expect(popped).toBe(4);
      expect(() => nget(data, ['a', 'b', 2, 'c'])).toThrow();

      // Filter remaining structure
      const filtered = nfilter(data, (x) => typeof x === 'number' && x > 2);
      expect(filtered).toEqual({ a: { b: [{ d: 5 }] } });
    });

    test('should handle deep nesting with mixed operations', () => {
      const data: Record<string, any> = {};

      // Build deep structure
      for (let i = 0; i < 5; i++) {
        nset(data, [`level${i}`, 'value'], i);
        nset(data, [`level${i}`, 'array'], []);
      }

      // Insert into arrays
      for (let i = 0; i < 5; i++) {
        ninsert(data, [`level${i}`, 'array', 0], { num: i });
      }

      // Verify structure
      for (let i = 0; i < 5; i++) {
        expect(nget(data, [`level${i}`, 'value'])).toBe(i);
        expect(nget(data, [`level${i}`, 'array', 0])).toEqual({ num: i });
      }

      // Pop some values
      for (let i = 0; i < 5; i += 2) {
        npop(data, [`level${i}`, 'array', 0]);
      }

      // Filter structure
      const filtered = nfilter(data, (x) => {
        if (typeof x === 'object' && x !== null) {
          return 'num' in x && x.num % 2 === 1;
        }
        return typeof x === 'number' && x % 2 === 1;
      });

      expect(filtered).toEqual({
        level1: { value: 1, array: [{ num: 1 }] },
        level3: { value: 3, array: [{ num: 3 }] },
      });
    });
  });

  describe('error handling', () => {
    test('should maintain data integrity on error', () => {
      const data = { a: { b: [1, 2, 3] } };
      const original = JSON.parse(JSON.stringify(data));

      // Try invalid operations
      expect(() => nget(data, ['a', 'x'])).toThrow();
      expect(() => nset(data, ['a', 'b', 'x'], 4)).toThrow();
      expect(() => ninsert(data, ['a', 'b', 'x'], 4)).toThrow();
      expect(() => npop(data, ['a', 'x'])).toThrow();

      // Data should remain unchanged
      expect(data).toEqual(original);
    });

    test('should handle circular references', () => {
      const data: Record<string, any> = { a: { b: {} } };
      data.a.b.c = data.a;

      // Get should work with circular refs
      expect(nget(data, ['a', 'b', 'c', 'b', 'c', 'b'])).toBeDefined();

      // Set should work with circular refs
      nset(data, ['a', 'b', 'c', 'value'], 42);
      expect(data.a.b.c.value).toBe(42);

      // Insert should work with circular refs
      ninsert(data, ['a', 'b', 'c', 'array', 0], 'item');
      expect(data.a.b.c.array[0]).toBe('item');

      // Pop should work with circular refs
      const popped = npop(data, ['a', 'b', 'c', 'value']);
      expect(popped).toBe(42);

      // Filter should work with circular refs
      const filtered = nfilter(data, (x) => typeof x === 'string');
      expect(filtered.a.b.c.array[0]).toBe('item');
    });
  });

  describe('type handling', () => {
    test('should handle different types consistently', () => {
      const data = {
        number: 42,
        string: 'test',
        boolean: true,
        array: [1, 'two', false],
        object: { a: 1, b: 'two' },
        null: null,
      };

      // Get different types
      expect(nget(data, ['number'])).toBe(42);
      expect(nget(data, ['string'])).toBe('test');
      expect(nget(data, ['boolean'])).toBe(true);
      expect(nget(data, ['array', 1])).toBe('two');
      expect(nget(data, ['object', 'b'])).toBe('two');
      expect(nget(data, ['null'])).toBe(null);

      // Set different types
      nset(data, ['number'], 43);
      nset(data, ['string'], 'changed');
      nset(data, ['boolean'], false);
      nset(data, ['array', 1], 2);
      nset(data, ['object', 'b'], 'changed');
      nset(data, ['null'], undefined);

      // Filter by type
      const numberFilter = nfilter(data, (x) => typeof x === 'number');
      expect(Object.keys(numberFilter)).toEqual(['number', 'array', 'object']);

      const stringFilter = nfilter(data, (x) => typeof x === 'string');
      expect(Object.keys(stringFilter)).toEqual(['string', 'object']);
    });
  });
});
