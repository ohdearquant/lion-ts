import { isCoroutineFunc } from './utils';

/**
 * Provide a throttling mechanism for function calls.
 * 
 * When used as a decorator or wrapper, it ensures that the function can only
 * be called once per specified period. Subsequent calls within this period
 * are delayed to enforce this constraint.
 */
export class Throttle {
    private period: number;
    private lastCalled: number;

    /**
     * Initialize a new instance of Throttle.
     * 
     * @param period The minimum time period (in seconds) between successive calls
     */
    constructor(period: number) {
        this.period = period;
        this.lastCalled = 0;
    }

    /**
     * Apply throttling to a function.
     * 
     * @param func The function to throttle
     * @returns The throttled function
     */
    apply<T, Args extends any[]>(
        func: (...args: Args) => T | Promise<T>
    ): (...args: Args) => Promise<T> {
        return async (...args: Args) => {
            const elapsed = performance.now() / 1000 - this.lastCalled;
            if (elapsed < this.period) {
                await new Promise(resolve => 
                    setTimeout(resolve, (this.period - elapsed) * 1000)
                );
            }
            this.lastCalled = performance.now() / 1000;
            
            if (isCoroutineFunc(func)) {
                return await (func as (...args: Args) => Promise<T>)(...args);
            } else {
                return Promise.resolve((func as (...args: Args) => T)(...args));
            }
        };
    }
}

/**
 * Throttle function execution to limit the rate of calls.
 * 
 * @param func The function to throttle
 * @param period The minimum time interval between consecutive calls
 * @returns The throttled function
 * 
 * @example
 * ```typescript
 * const throttledFn = throttle(async (x: number) => x * 2, 1);
 * await throttledFn(5);  // Returns 10 immediately
 * await throttledFn(6);  // Waits 1 second, then returns 12
 * ```
 */
export function throttle<T, Args extends any[]>(
    func: (...args: Args) => T | Promise<T>,
    period: number
): (...args: Args) => Promise<T> {
    const throttleInstance = new Throttle(period);
    return throttleInstance.apply(func);
}

/**
 * Create a throttle decorator with the specified period.
 * 
 * @param period The minimum time interval between consecutive calls
 * @returns A decorator function
 * 
 * @example
 * ```typescript
 * class Example {
 *     @Throttle.create(1)
 *     async process(x: number) {
 *         return x * 2;
 *     }
 * }
 * ```
 */
export namespace Throttle {
    export function create(period: number) {
        return function (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) {
            const originalMethod = descriptor.value;
            const throttleInstance = new Throttle(period);
            
            descriptor.value = throttleInstance.apply(originalMethod);
            return descriptor;
        };
    }
}
