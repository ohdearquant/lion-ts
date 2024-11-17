/**
 * Generate a unique hash string of specified length
 * @param length Length of hash string to generate
 * @returns Random hash string
 */
export function uniqueHash(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += chars[values[i] % chars.length];
  }
  return result;
}

/**
 * Deep copy an object
 * @param obj Object to copy
 * @param deep Whether to perform deep copy
 * @returns Copied object
 */
export function copy<T>(obj: T, deep = false): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return deep 
      ? obj.map(item => copy(item, true)) as unknown as T
      : [...obj] as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj) as unknown as T;
  }

  if (obj instanceof Map) {
    const copied = new Map();
    for (const [key, value] of obj.entries()) {
      copied.set(
        deep ? copy(key, true) : key,
        deep ? copy(value, true) : value
      );
    }
    return copied as unknown as T;
  }

  if (obj instanceof Set) {
    const copied = new Set();
    for (const value of obj) {
      copied.add(deep ? copy(value, true) : value);
    }
    return copied as unknown as T;
  }

  const result = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = deep ? copy(obj[key], true) : obj[key];
    }
  }
  return result;
}

/**
 * Get current timestamp in milliseconds
 */
export function time(): number {
  return Date.now();
}
