import { rcall } from '../rcall';

// Mock Functions
async function asyncFunc(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return x * 2;
}

async function asyncFuncWithError(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error("mock error");
}

describe('Retry Call Function', () => {
    test('handles successful call', async () => {
        const result = await rcall(asyncFunc, 5);
        expect(result).toBe(10);
    });

    test('handles retries', async () => {
        const result = await rcall(asyncFuncWithError, 5, {
            numRetries: 1,
            retryDefault: 0
        });
        expect(result).toBe(0);
    });

    test('handles timing', async () => {
        const result = await rcall(asyncFunc, 5, { retryTiming: true });
        expect(Array.isArray(result)).toBe(true);
        if (Array.isArray(result)) {
            expect(result[0]).toBe(10);
            expect(result[1]).toBeGreaterThan(0);
        }
    });

    test('handles timeout', async () => {
        await expect(rcall(asyncFunc, 5, { retryTimeout: 0.05 }))
            .rejects.toThrow('Timeout');
    });

    test('handles verbose retry', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        await rcall(asyncFuncWithError, 5, {
            numRetries: 1,
            retryDefault: 0
        });
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('mock error')
        );
        consoleSpy.mockRestore();
    });

    test('handles initial delay', async () => {
        const start = performance.now();
        const result = await rcall(asyncFunc, 5, { initialDelay: 0.1 });
        const duration = (performance.now() - start) / 1000;
        expect(duration).toBeGreaterThanOrEqual(0.1);
        expect(result).toBe(10);
    });

    test('handles backoff factor', async () => {
        const start = performance.now();
        await rcall(asyncFuncWithError, 5, {
            numRetries: 2,
            retryDelay: 0.1,
            backoffFactor: 2,
            retryDefault: 0
        });
        const duration = (performance.now() - start) / 1000;
        // Initial delay (0.1) + Second delay (0.2) = 0.3s minimum
        expect(duration).toBeGreaterThanOrEqual(0.3);
    });

    test('handles timing with retries', async () => {
        const result = await rcall(asyncFuncWithError, 5, {
            numRetries: 1,
            retryDefault: 0,
            retryTiming: true
        });
        expect(Array.isArray(result)).toBe(true);
        if (Array.isArray(result)) {
            expect(result[0]).toBe(0);
            expect(result[1]).toBeGreaterThan(0);
        }
    });
});
