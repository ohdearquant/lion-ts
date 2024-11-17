# Function Call Utilities

This module provides a collection of utility functions for handling function calls in TypeScript, with support for asynchronous operations, retries, batching, and more.

## Core Utilities

### ucall (Universal Call)
```typescript
async function ucall<T>(func: Callable<T>, ...args: any[]): Promise<T>
```
Executes a function asynchronously. Handles both synchronous and asynchronous functions uniformly.

### rcall (Retry Call)
```typescript
async function rcall<T>(func: Callable<T>, ...args: any[]): Promise<T>
```
Executes a function with retry logic. Supports configurable retry attempts, delays, and error handling.

### tcall (Timed Call)
```typescript
async function tcall<T>(func: Callable<T>, ...args: any[]): Promise<T | [T, number]>
```
Executes a function with timing information. Can return both the result and execution duration.

### lcall (List Call)
```typescript
function lcall<T, U>(input: T[], func: (arg: T) => U, options?: ListCallOptions): U[]
```
Applies a function to each element of a list synchronously. Supports flattening, filtering null values, and unique results.

### alcall (Async List Call)
```typescript
async function alcall<T, U>(input: T[], func: (arg: T) => Promise<U>, options?: AsyncListOptions): Promise<U[]>
```
Applies a function to each element of a list asynchronously. Supports concurrent execution and retries.

### mcall (Multiple Call)
```typescript
async function mcall<T, U>(input: T[], funcs: Array<(arg: T) => U>, options?: MultipleCallOptions): Promise<U[]>
```
Applies multiple functions to inputs, either by exploding functions across all inputs or matching functions to inputs.

### pcall (Parallel Call)
```typescript
async function pcall<T>(funcs: Array<() => T>, options?: ParallelOptions): Promise<T[]>
```
Executes multiple functions in parallel with concurrency control.

### bcall (Batch Call)
```typescript
async function* bcall<T, U>(input: T[], func: (arg: T) => U, options: BatchOptions): AsyncGenerator<U[]>
```
Processes inputs in batches, yielding results as they complete. Supports batch size control.

## Decorators

### CallDecorator
A collection of method decorators for enhancing function behavior:

```typescript
@CallDecorator.retry(options)
// Adds retry logic to a method

@CallDecorator.throttle(period)
// Limits method execution frequency

@CallDecorator.maxConcurrent(limit)
// Controls concurrent method executions

@CallDecorator.compose(...functions)
// Composes multiple functions in sequence

@CallDecorator.map(function)
// Maps a function over method results
```

## Utility Types

### Throttle
```typescript
class Throttle {
    constructor(period: number)
    apply<T>(func: () => T): () => T
}
```
Provides throttling functionality for rate-limiting function calls.

## Common Options

### RetryOptions
- `numRetries`: Number of retry attempts
- `initialDelay`: Delay before first attempt
- `retryDelay`: Delay between retries
- `backoffFactor`: Factor to increase delay after each retry
- `retryDefault`: Default value if all retries fail
- `retryTimeout`: Timeout for each attempt
- `retryTiming`: Return timing information
- `verboseRetry`: Log retry attempts
- `errorMsg`: Custom error message

### AsyncListOptions
- All RetryOptions plus:
- `maxConcurrent`: Maximum concurrent executions
- `throttlePeriod`: Minimum time between executions
- `flatten`: Flatten nested results
- `dropna`: Remove null values
- `unique`: Keep only unique values

### BatchOptions
- All AsyncListOptions plus:
- `batchSize`: Number of items per batch

## Examples

### Basic Usage
```typescript
// Retry with backoff
const result = await rcall(fetchData, { 
    numRetries: 3,
    backoffFactor: 2 
});

// Process list in batches
for await (const batch of bcall(items, processItem, { 
    batchSize: 10,
    maxConcurrent: 2 
})) {
    console.log(batch);
}

// Parallel execution with timing
const results = await pcall(tasks, { 
    retryTiming: true,
    maxConcurrent: 3 
});
```

### Using Decorators
```typescript
class API {
    @CallDecorator.retry({ numRetries: 3 })
    @CallDecorator.throttle(1000)
    async fetchData() {
        // Implementation
    }
}
```

## Type Safety

All functions are fully typed and support generic type parameters for input and output types:

```typescript
interface User {
    id: number;
    name: string;
}

const users = await alcall<number, User>(
    ids,
    async (id) => fetchUser(id),
    { dropna: true }
);
```

## Performance Considerations

- Use `maxConcurrent` to prevent overwhelming resources
- Use `throttlePeriod` for rate-limited APIs
- Use `bcall` for memory-efficient processing of large datasets
- Use `pcall` for CPU-bound tasks
- Use `alcall` for I/O-bound tasks

## Best Practices

1. Always specify explicit types for better type safety
2. Use appropriate retry settings for production code
3. Consider using decorators for consistent behavior across methods
4. Use batching for large datasets
5. Configure timeouts for external service calls
6. Use throttling for rate-limited resources
7. Monitor timing information in performance-critical code
