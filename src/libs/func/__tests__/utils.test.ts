import { forceAsync, isCoroutineFunc, maxConcurrent } from '../utils';
import { throttle } from '../throttle';

// Mock and Helper Functions
function syncFunc(x: number): number {
    return x + 1;
}

async function asyncFunc(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return x + 1;
}

function syncFuncWithError(x: number): number {
    if (x === 3) {
        throw new Error("mock error");
    }
    return x + 1;
}

async function asyncFuncWithError(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (x === 3) {
        throw new Error("mock error");
    }
    return x + 1;
}

function mockHandler(e: Error): string {
    return `handled: ${e.message}`;
}

// Tests
describe('Utility Functions', () => {
    test('forceAsync converts sync function to async', async () => {
        const asyncSyncFunc = forceAsync(syncFunc);
        const result = await asyncSyncFunc(1);
        expect(result).toBe(2);
    });

    test('isCoroutineFunc correctly identifies async functions', () => {
        expect(isCoroutineFunc(asyncFunc)).toBe(true);
        expect(isCoroutineFunc(syncFunc)).toBe(false);
    });

    test('maxConcurrent limits concurrent executions', async () => {
        const asyncLimitedFunc = maxConcurrent(asyncFunc, 1);
        const results = await Promise.all([
            asyncLimitedFunc(1),
            asyncLimitedFunc(2)
        ]);
        expect(results).toEqual([2, 3]);
    });

    test('throttle limits execution frequency', async () => {
        const throttledFunc = throttle(asyncFunc, 0.5);
        const results = await Promise.all([
            throttledFunc(1),
            throttledFunc(2)
        ]);
        expect(results).toEqual([2, 3]);
    });

    test('forceAsync handles errors', async () => {
        const asyncSyncFuncWithError = forceAsync(syncFuncWithError);
        await expect(asyncSyncFuncWithError(3)).rejects.toThrow('mock error');
    });

    test('maxConcurrent handles errors', async () => {
        const asyncLimitedFuncWithError = maxConcurrent(asyncFuncWithError, 1);
        await expect(Promise.all([
            asyncLimitedFuncWithError(1),
            asyncLimitedFuncWithError(3)
        ])).rejects.toThrow('mock error');
    });

    test('throttle handles errors', async () => {
        const throttledFuncWithError = throttle(asyncFuncWithError, 0.5);
        await expect(Promise.all([
            throttledFuncWithError(1),
            throttledFuncWithError(3)
        ])).rejects.toThrow('mock error');
    });

    // Additional TypeScript-specific tests
    test('forceAsync preserves type safety', async () => {
        const asyncSyncFunc = forceAsync<number, [number]>(syncFunc);
        const result = await asyncSyncFunc(1);
        expect(typeof result).toBe('number');
    });

    test('maxConcurrent preserves type safety', async () => {
        const asyncLimitedFunc = maxConcurrent<number, [number]>(asyncFunc, 1);
        const result = await asyncLimitedFunc(1);
        expect(typeof result).toBe('number');
    });

    test('throttle preserves type safety', async () => {
        const throttledFunc = throttle<number, [number]>(asyncFunc, 0.5);
        const result = await throttledFunc(1);
        expect(typeof result).toBe('number');
    });
});
