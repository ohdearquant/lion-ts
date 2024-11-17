/**
 * Custom error class for validation errors
 */
export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueError';
  }
}

/**
 * Custom error class for type errors
 */
export class TypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TypeError';
  }
}

/**
 * Custom error class for attribute errors
 */
export class AttributeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AttributeError';
  }
}
