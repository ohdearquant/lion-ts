import { deepUpdate, deepUpdateAll, type AnyObject } from '../deep_update';

describe('deepUpdate', () => {
  test('should merge basic objects', () => {
    const original: AnyObject = { a: 1, b: { c: 2 } };
    const update = { b: { d: 3 } };
    expect(deepUpdate(original, update)).toEqual({ a: 1, b: { c: 2, d: 3 } });
  });

  test('should handle null/undefined updates', () => {
    const original: AnyObject = { a: 1, b: { c: 2 } };
    expect(deepUpdate(original, null as any)).toBe(original);
    expect(deepUpdate(original, undefined as any)).toBe(original);
  });

  test('should handle null/undefined original', () => {
    const update: AnyObject = { a: 1, b: { c: 2 } };
    expect(deepUpdate(null as any, update)).toEqual(update);
    expect(deepUpdate(undefined as any, update)).toEqual(update);
  });

  test('should skip null/undefined values in update', () => {
    const original: AnyObject = { a: 1, b: { c: 2 } };
    const update = { a: null, b: { d: undefined } };
    expect(deepUpdate(original, update)).toEqual({ a: 1, b: { c: 2 } });
  });

  test('should handle nested objects', () => {
    const original: AnyObject = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    };
    const update = {
      b: {
        d: {
          f: 4,
        },
        g: 5,
      },
    };
    expect(deepUpdate(original, update)).toEqual({
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
          f: 4,
        },
        g: 5,
      },
    });
  });

  test('should overwrite non-object values', () => {
    const original: AnyObject = { a: 1, b: { c: 2 } };
    const update = { a: { d: 3 }, b: 4 };
    expect(deepUpdate(original, update)).toEqual({ a: { d: 3 }, b: 4 });
  });

  test('should handle empty objects', () => {
    const original: AnyObject = {};
    const update = { a: 1 };
    expect(deepUpdate(original, update)).toEqual({ a: 1 });
    expect(deepUpdate(update, {})).toEqual({ a: 1 });
  });

  test('should not modify original object', () => {
    const original: AnyObject = { a: 1, b: { c: 2 } };
    const update = { b: { d: 3 } };
    const result = deepUpdate(original, update);
    expect(original).toEqual({ a: 1, b: { c: 2 } });
    expect(result).not.toBe(original);
  });

  test('should handle arrays as non-mergeable values', () => {
    const original: AnyObject = { a: [1, 2], b: { c: [3, 4] } };
    const update = { a: [5], b: { c: [6] } };
    expect(deepUpdate(original, update)).toEqual({ a: [5], b: { c: [6] } });
  });

  test('should handle class instances as non-mergeable values', () => {
    class TestClass {
      constructor(public value: number) {}
    }
    const original: AnyObject = { a: new TestClass(1) };
    const update = { a: new TestClass(2) };
    expect(deepUpdate(original, update).a.value).toBe(2);
  });
});

describe('deepUpdateAll', () => {
  test('should merge multiple objects', () => {
    const obj1: AnyObject = { a: 1, b: { c: 2 } };
    const obj2 = { b: { d: 3 } };
    const obj3 = { b: { e: 4 } };
    expect(deepUpdateAll(obj1, obj2, obj3)).toEqual({
      a: 1,
      b: { c: 2, d: 3, e: 4 },
    });
  });

  test('should handle empty source arrays', () => {
    const target: AnyObject = { a: 1 };
    expect(deepUpdateAll(target)).toEqual({ a: 1 });
  });

  test('should handle null/undefined sources', () => {
    const target: AnyObject = { a: 1 };
    expect(deepUpdateAll(target, null as any, undefined as any, { b: 2 })).toEqual({
      a: 1,
      b: 2,
    });
  });

  test('should apply updates in order', () => {
    const target: AnyObject = { a: 1, b: { c: 2 } };
    const update1 = { b: { c: 3, d: 4 } };
    const update2 = { b: { c: 5 } };
    expect(deepUpdateAll(target, update1, update2)).toEqual({
      a: 1,
      b: { c: 5, d: 4 },
    });
  });

  test('should not modify source objects', () => {
    const target: AnyObject = { a: 1, b: { c: 2 } };
    const update1 = { b: { d: 3 } };
    const update2 = { b: { e: 4 } };
    const result = deepUpdateAll(target, update1, update2);
    expect(target).toEqual({ a: 1, b: { c: 2 } });
    expect(update1).toEqual({ b: { d: 3 } });
    expect(update2).toEqual({ b: { e: 4 } });
    expect(result).not.toBe(target);
  });
});
