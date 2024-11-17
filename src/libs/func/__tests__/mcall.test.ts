import { mcall } from '../mcall';

// Mock Functions
async function asyncFunc(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return x * 2;
}

async function asyncFuncWithError(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (x === 3) throw new Error("mock error");
    return x * 2;
}

describe('Multiple Call Function', () => {
    test('handles single function', async () => {
        const inputs = [1, 2, 3, 4, 5];
        const result = await mcall(inputs, asyncFunc);
        expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    test('handles multiple functions with explode', async () => {
        const inputs = [1, 2, 3];
        const funcs = [asyncFunc, asyncFunc];
        const result = await mcall(inputs, funcs, { explode: true });
        expect(result).toEqual([[2, 4, 6], [2, 4, 6]]);
    });

    test('handles multiple functions without explode', async () => {
        const inputs = [1, 2];
        const funcs = [asyncFunc, asyncFunc];
        const result = await mcall(inputs, funcs);
        expect(result).toEqual([2, 4]);
    });

    test('handles retries', async () => {
        const inputs = [1, 2, 3];
        const result = await mcall(inputs, asyncFuncWithError, {
            numRetries: 1,
            retryDefault: 0
        });
        expect(result).toEqual([2, 4, 0]);
    });

    test('handles max concurrent', async () => {
        const inputs = [1, 2, 3];
        const result = await mcall(inputs, asyncFunc, { maxConcurrent: 1 });
        expect(result).toEqual([2, 4, 6]);
    });

    test('handles throttle period', async () => {
        const inputs = [1, 2, 3];
        const result = await mcall(inputs, asyncFunc, { throttlePeriod: 0.1 });
        expect(result).toEqual([2, 4, 6]);
    });

    test('handles initial delay', async () => {
        const inputs = [1, 2, 3];
        const start = performance.now();
        const result = await mcall(inputs, asyncFunc, { initialDelay: 0.1 });
        const duration = (performance.now() - start) / 1000;
        expect(duration).toBeGreaterThanOrEqual(0.1);
        expect(result).toEqual([2, 4, 6]);
    });

    test('throws error on length mismatch', async () => {
        const inputs = [1, 2, 3];
        const funcs = [asyncFunc, asyncFunc];
        await expect(mcall(inputs, funcs)).rejects.toThrow(
            "Inputs and functions must be the same length for map calling."
        );
    });
});
