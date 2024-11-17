import { tcall } from '../tcall';

// Mock Functions
async function asyncFunc(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return x * 2;
}

function syncFunc(x: number): number {
    return x * 2;
}

async function asyncFuncWithError(x: number): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error("mock error");
}

function syncFuncWithError(x: number): number {
    throw new Error("mock error");
}

describe('Timed Call Function', () => {
    test('handles async function', async () => {
        const result = await tcall(asyncFunc, 5);
        expect(result).toBe(10);
    });

    test('handles sync function', async () => {
        const result = await tcall(syncFunc, 5);
        expect(result).toBe(10);
    });

    test('handles timing', async () => {
        const result = await tcall(asyncFunc, 5, { retryTiming: true });
        expect(result[0]).toBe(10);
        expect(result[1]).toBeGreaterThan(0);
    });

    test('handles timeout', async () => {
        await expect(tcall(asyncFunc, 5, { retryTimeout: 0.05 }))
            .rejects.toThrow('Timeout');
    });

    test('handles error suppression', async () => {
        const result = await tcall(asyncFuncWithError, 5, {
            suppressErr: true,
            retryDefault: -1
        });
        expect(result).toBe(-1);
    });

    test('handles initial delay', async () => {
        const start = performance.now();
        const result = await tcall(asyncFunc, 5, { initialDelay: 0.1 });
        const duration = (performance.now() - start) / 1000;
        expect(duration).toBeGreaterThanOrEqual(0.1);
        expect(result).toBe(10);
    });

    test('handles custom error message', async () => {
        await expect(tcall(asyncFuncWithError, 5, {
            errorMsg: 'Custom error: '
        })).rejects.toThrow('Custom error: ');
    });

    test('handles timing with error suppression', async () => {
        const result = await tcall(asyncFuncWithError, 5, {
            suppressErr: true,
            retryDefault: -1,
            retryTiming: true
        });
        expect(result[0]).toBe(-1);
        expect(result[1]).toBeGreaterThan(0);
    });
});
