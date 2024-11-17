import { bcall } from '../bcall';

// Mock and Helper Functions
async function asyncFunc(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return x * 2;
}

function syncFunc(x: number): number {
    return x * 2;
}

async function asyncFuncWithError(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (x === 3) {
        throw new Error("mock error");
    }
    return x * 2;
}

function syncFuncWithError(x: number): number {
    if (x === 3) {
        throw new Error("mock error");
    }
    return x * 2;
}

describe('Batch Call Function', () => {
    test('basic functionality', async () => {
        const inputs = [1, 2, 3, 4, 5];
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(inputs, asyncFunc, { batchSize: 2 })) {
            batches.push([...batch] as number[]);
        }
        expect(batches).toEqual([[2, 4], [6, 8], [10]]);
    });

    test('handles retries', async () => {
        const inputs = [1, 2, 3, 4, 5];
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(inputs, asyncFuncWithError, {
            batchSize: 2,
            numRetries: 1,
            retryDefault: 0
        })) {
            batches.push([...batch] as number[]);
        }
        expect(batches).toEqual([[2, 4], [0, 8], [10]]);
    });

    test('handles timeout', async () => {
        const slowFunc = async (x: number): Promise<number> => {
            await new Promise(resolve => setTimeout(resolve, 200)); // Deliberately slow
            return x * 2;
        };

        const inputs = [1, 2, 3];
        await expect(async () => {
            const generator = bcall<number, number>(inputs, slowFunc, {
                batchSize: 2,
                retryTimeout: 0.1, // 100ms timeout
                retryDefault: undefined // Force throw on timeout
            });
            await generator.next(); // This should timeout
        }).rejects.toThrow('Timeout');
    });

    test('handles max concurrent', async () => {
        const inputs = [1, 2, 3, 4, 5];
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(inputs, asyncFunc, {
            batchSize: 2,
            maxConcurrent: 1
        })) {
            batches.push([...batch] as number[]);
        }
        expect(batches).toEqual([[2, 4], [6, 8], [10]]);
    });

    test('handles throttle period', async () => {
        const inputs = [1, 2, 3, 4, 5];
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(inputs, asyncFunc, {
            batchSize: 2,
            throttlePeriod: 0.2
        })) {
            batches.push([...batch] as number[]);
        }
        expect(batches).toEqual([[2, 4], [6, 8], [10]]);
    });

    test('handles initial delay', async () => {
        const inputs = [1, 2, 3];
        const start = performance.now();
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(inputs, asyncFunc, {
            batchSize: 2,
            initialDelay: 0.5
        })) {
            batches.push([...batch] as number[]);
        }
        const duration = (performance.now() - start) / 1000;
        expect(duration).toBeGreaterThanOrEqual(0.5);
        expect(batches).toEqual([[2, 4], [6]]);
    });

    test('handles additional arguments', async () => {
        interface KwargsInput {
            x: number;
            add: number;
        }
        async function asyncFuncWithKwargs(input: KwargsInput): Promise<number> {
            await new Promise(resolve => setTimeout(resolve, 100));
            return input.x + input.add;
        }

        const inputs = [1, 2, 3, 4, 5].map(x => ({ x, add: 10 }));
        const batches: Array<number[]> = [];
        for await (const batch of bcall<KwargsInput, number>(inputs, asyncFuncWithKwargs, {
            batchSize: 2
        })) {
            batches.push([...batch] as number[]);
        }
        expect(batches).toEqual([[11, 12], [13, 14], [15]]);
    });

    // Additional TypeScript-specific tests
    test('preserves type safety', async () => {
        const inputs = [1, 2, 3];
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(inputs, asyncFunc, {
            batchSize: 2
        })) {
            const typedBatch = [...batch] as number[];
            expect(typedBatch.every(x => typeof x === 'number')).toBe(true);
            batches.push(typedBatch);
        }
    });

    test('handles empty input', async () => {
        const inputs: number[] = [];
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(inputs, asyncFunc, { batchSize: 2 })) {
            batches.push([...batch] as number[]);
        }
        expect(batches).toEqual([]);
    });

    test('handles single input', async () => {
        const input = 5;
        const batches: Array<number[]> = [];
        for await (const batch of bcall<number, number>(input, asyncFunc, { batchSize: 2 })) {
            batches.push([...batch] as number[]);
        }
        expect(batches).toEqual([[10]]);
    });
});
