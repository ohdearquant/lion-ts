import { ucall } from '../ucall';

// Mock and Helper Functions
async function asyncFunc(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return x + 1;
}

function syncFunc(x: number): number {
    return x + 1;
}

async function asyncFuncWithError(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (x === 3) {
        throw new Error("mock error");
    }
    return x + 1;
}

function syncFuncWithError(x: number): number {
    if (x === 3) {
        throw new Error("mock error");
    }
    return x + 1;
}

async function mockHandler(e: Error): Promise<string> {
    return `handled: ${e.message}`;
}

type Options = { add: number };

async function asyncFuncWithKwargs(options: { x: number } & Options): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return options.x + options.add;
}

describe('Universal Call Function', () => {
    test('handles async functions', async () => {
        const result = await ucall(asyncFunc, 1);
        expect(result).toBe(2);
    });

    test('handles sync functions', async () => {
        const result = await ucall(syncFunc, 1);
        expect(result).toBe(2);
    });

    test('handles async functions with errors', async () => {
        await expect(ucall(asyncFuncWithError, 3)).rejects.toThrow('mock error');
    });

    test('handles sync functions with errors', async () => {
        await expect(ucall(syncFuncWithError, 3)).rejects.toThrow('mock error');
    });

    test('handles error mapping', async () => {
        const errorMap = { Error: mockHandler };
        const result = await ucall(asyncFuncWithError, 3, { errorMap });
        expect(result).toBe('handled: mock error');
    });

    test('handles functions with additional arguments', async () => {
        const result = await ucall(asyncFuncWithKwargs, { x: 1, add: 2 });
        expect(result).toBe(3);
    });

    test('handles async generators', async () => {
        async function* asyncGenerator(): AsyncGenerator<number> {
            for (let i = 0; i < 3; i++) {
                yield i;
            }
        }
        const result = await ucall(asyncGenerator, null);
        expect(result[Symbol.asyncIterator]).toBeDefined();
    });

    test('handles class methods', async () => {
        class TestClass {
            async asyncMethod(x: number): Promise<number> {
                await new Promise(resolve => setTimeout(resolve, 100));
                return x * 2;
            }
        }
        const obj = new TestClass();
        const result = await ucall(obj.asyncMethod.bind(obj), 5);
        expect(result).toBe(10);
    });

    test('handles lambda functions', async () => {
        const result = await ucall((x: number) => x * 3, 4);
        expect(result).toBe(12);
    });

    test('handles recursive functions', async () => {
        async function asyncFactorial(n: number): Promise<number> {
            if (n === 0) {
                return 1;
            }
            return n * await ucall(asyncFactorial, n - 1);
        }
        const result = await ucall(asyncFactorial, 5);
        expect(result).toBe(120);
    });

    test('performance', async () => {
        async function slowFunction(): Promise<string> {
            await new Promise(resolve => setTimeout(resolve, 500));
            return "Done";
        }
        const start = performance.now();
        await ucall(slowFunction, null);
        const duration = (performance.now() - start) / 1000;
        expect(duration).toBeGreaterThanOrEqual(0.5);
        expect(duration).toBeLessThan(0.6);
    });

    // Additional TypeScript-specific tests
    test('preserves type safety', async () => {
        const result = await ucall<number, number>(asyncFunc, 1);
        expect(typeof result).toBe('number');
    });

    test('handles async/await syntax', async () => {
        const result = await ucall(async (x: number) => {
            const intermediate = await Promise.resolve(x * 2);
            return intermediate + 1;
        }, 2);
        expect(result).toBe(5);
    });

    test('handles Promise rejection', async () => {
        await expect(ucall(async () => {
            throw new Error('async error');
        }, null)).rejects.toThrow('async error');
    });
});
