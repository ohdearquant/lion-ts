import { alcall } from '../alcall';

interface MockFuncOptions {
    x: number;
    add?: number;
}

// Mock Functions
async function mockFunc(options: MockFuncOptions): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return options.x + (options.add || 0);
}

async function mockFuncWithError(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (x === 3) {
        throw new Error("mock error");
    }
    return x;
}

describe('Async List Call Function', () => {
    test('basic functionality', async () => {
        const inputs = [1, 2, 3].map(x => ({ x, add: 1 }));
        const results = await alcall(inputs, mockFunc);
        expect(results).toEqual([2, 3, 4]);
    });

    test('handles retries', async () => {
        const inputs = [1, 2, 3];
        const results = await alcall(inputs, mockFuncWithError, {
            numRetries: 1,
            retryDefault: 0
        });
        expect(results).toEqual([1, 2, 0]);
    });

    test('handles timeout', async () => {
        const inputs = [1, 2, 3].map(x => ({ x }));
        await expect(alcall(inputs, mockFunc, {
            retryTimeout: 0.05,
            retryDefault: -1
        })).resolves.toEqual([-1, -1, -1]);
    });

    test('handles max concurrent', async () => {
        const inputs = [1, 2, 3].map(x => ({ x }));
        const results = await alcall(inputs, mockFunc, {
            maxConcurrent: 1
        });
        expect(results).toEqual([1, 2, 3]);
    });

    test('handles throttle period', async () => {
        const inputs = [1, 2, 3].map(x => ({ x }));
        const results = await alcall(inputs, mockFunc, {
            throttlePeriod: 0.2
        });
        expect(results).toEqual([1, 2, 3]);
    });

    test('handles timing', async () => {
        const inputs = [1, 2, 3].map(x => ({ x }));
        const results = await alcall(inputs, mockFunc, { retryTiming: true });
        expect(results).toHaveLength(3);
        (results as Array<[number, number]>).forEach(result => {
            expect(Array.isArray(result)).toBe(true);
            expect(typeof result[0]).toBe('number');
            expect(typeof result[1]).toBe('number');
        });
    });

    test('handles dropna', async () => {
        async function funcWithNull(x: number): Promise<number | null> {
            return x === 2 ? null : x;
        }

        const inputs = [1, 2, 3];
        const results = await alcall(inputs, funcWithNull, { dropna: true });
        expect(results).toEqual([1, 3]);
    });

    test('handles backoff factor', async () => {
        const inputs = [1, 2, 3];
        const start = performance.now();
        await alcall(inputs, mockFuncWithError, {
            numRetries: 2,
            retryDelay: 0.1,
            backoffFactor: 2,
            retryDefault: 0
        });
        const duration = (performance.now() - start) / 1000;
        // Initial delay (0.1) + Second delay (0.2) = 0.3s minimum
        expect(duration).toBeGreaterThanOrEqual(0.3);
    });

    test('preserves type safety', async () => {
        const inputs = [1, 2, 3].map(x => ({ x }));
        const results = await alcall<MockFuncOptions, number>(inputs, mockFunc);
        expect(Array.isArray(results)).toBe(true);
        expect(results.every(x => typeof x === 'number')).toBe(true);
    });

    test('handles timing results with proper types', async () => {
        const inputs = [1, 2, 3].map(x => ({ x }));
        const results = await alcall<MockFuncOptions, number>(inputs, mockFunc, {
            retryTiming: true
        });
        expect(Array.isArray(results)).toBe(true);
        (results as Array<[number, number]>).forEach(([value, duration]) => {
            expect(typeof value).toBe('number');
            expect(typeof duration).toBe('number');
        });
    });
});
