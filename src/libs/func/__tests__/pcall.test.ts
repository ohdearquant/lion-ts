import { pcall } from '../pcall';

// Mock and Helper Functions
async function asyncFunc(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return 2;
}

function syncFunc(): number {
    return 2;
}

async function asyncFuncWithError(): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error("mock error");
}

function syncFuncWithError(): number {
    throw new Error("mock error");
}

describe('Parallel Call Function', () => {
    test('basic functionality', async () => {
        const funcs = Array(5).fill(asyncFunc);
        const result = await pcall<any, number>(funcs);
        expect(result).toEqual([2, 2, 2, 2, 2]);
    });

    test('handles timing', async () => {
        const funcs = Array(5).fill(asyncFunc);
        const result = await pcall<any, number>(funcs, { retryTiming: true });
        const typedResult = result as Array<[number, number]>;
        typedResult.forEach(([res, duration]) => {
            expect(duration).toBeGreaterThan(0);
            expect(res).toBe(2);
        });
    });

    test('handles retries', async () => {
        const funcs = Array(5).fill(asyncFuncWithError);
        const result = await pcall<any, number>(funcs, {
            numRetries: 1,
            retryDefault: 0
        });
        expect(result).toEqual([0, 0, 0, 0, 0]);
    });

    test('handles max concurrent', async () => {
        const funcs = Array(5).fill(asyncFunc);
        const result = await pcall<any, number>(funcs, {
            maxConcurrent: 1
        });
        expect(result).toEqual([2, 2, 2, 2, 2]);
    });

    test('handles throttle period', async () => {
        const funcs = Array(5).fill(asyncFunc);
        const result = await pcall<any, number>(funcs, {
            throttlePeriod: 0.2
        });
        expect(result).toEqual([2, 2, 2, 2, 2]);
    });

    test('handles initial delay', async () => {
        const funcs = Array(3).fill(asyncFunc);
        const start = performance.now();
        const result = await pcall<any, number>(funcs, {
            initialDelay: 0.5
        });
        const duration = (performance.now() - start) / 1000;
        expect(duration).toBeGreaterThanOrEqual(0.5);
        expect(result).toEqual([2, 2, 2]);
    });

    test('handles sync functions', async () => {
        const funcs = Array(5).fill(syncFunc);
        const result = await pcall<any, number>(funcs);
        expect(result).toEqual([2, 2, 2, 2, 2]);
    });

    // Additional TypeScript-specific tests
    test('preserves type safety', async () => {
        const funcs = Array(3).fill(asyncFunc);
        const result = await pcall<any, number>(funcs);
        const typedResult = result as number[];
        expect(typedResult.every(x => typeof x === 'number')).toBe(true);
    });

    test('handles timing results with proper types', async () => {
        const funcs = Array(3).fill(asyncFunc);
        const result = await pcall<any, number>(funcs, { retryTiming: true });
        const typedResult = result as Array<[number, number]>;
        typedResult.forEach(([value, duration]) => {
            expect(typeof value).toBe('number');
            expect(typeof duration).toBe('number');
        });
    });

    test('handles functions with arguments', async () => {
        async function asyncFuncWithArg(x: number): Promise<number> {
            await new Promise(resolve => setTimeout(resolve, 100));
            return x * 2;
        }
        const funcs = Array(3).fill(asyncFuncWithArg);
        const result = await pcall<number, number>(funcs, { arg: 5 });
        expect(result).toEqual([10, 10, 10]);
    });
});
