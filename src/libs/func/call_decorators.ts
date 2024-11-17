import { ucall } from './ucall';
import { isCoroutineFunc, forceAsync } from './utils';
import { Throttle } from './throttle';

type TimedResult<T> = [T, number];

interface RetryOptions<T> {
    numRetries?: number;
    initialDelay?: number;
    retryDelay?: number;
    backoffFactor?: number;
    retryDefault?: T;
    retryTimeout?: number | null;
    retryTiming?: boolean;
    verboseRetry?: boolean;
    errorMsg?: string | null;
}

type MethodDecorator<T> = (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T>;

/**
 * A collection of decorators to enhance function calls.
 */
export class CallDecorator {
    /**
     * Decorator to automatically retry a function call on failure.
     * 
     * @param options Retry configuration options
     */
    static retry<T>(
        options: RetryOptions<T> & { retryTiming: true }
    ): MethodDecorator<(...args: any[]) => Promise<TimedResult<T>>>;
    static retry<T>(
        options?: RetryOptions<T>
    ): MethodDecorator<(...args: any[]) => Promise<T>>;
    static retry<T>(options: RetryOptions<T> = {}) {
        return function(
            target: any,
            propertyKey: string,
            descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T | TimedResult<T>>>
        ) {
            const originalMethod = descriptor.value!;
            
            descriptor.value = async function(...args: any[]) {
                let attempts = 0;
                let currentDelay = options.retryDelay ?? 0;
                const maxAttempts = (options.numRetries ?? 0) + 1;
                const initialDelay = options.initialDelay ?? 0;

                if (initialDelay > 0) {
                    await new Promise(resolve => setTimeout(resolve, initialDelay * 1000));
                }

                while (true) {
                    try {
                        if (options.retryTiming) {
                            const startTime = performance.now();
                            const result = await Promise.race([
                                originalMethod.apply(this, args),
                                options.retryTimeout ? new Promise<never>((_, reject) => 
                                    setTimeout(() => reject(new Error('Timeout')), options.retryTimeout! * 1000)
                                ) : Promise.resolve(null)
                            ]) as T;
                            const endTime = performance.now();
                            return [result, (endTime - startTime) / 1000] as TimedResult<T>;
                        }

                        return await Promise.race([
                            originalMethod.apply(this, args),
                            options.retryTimeout ? new Promise<never>((_, reject) => 
                                setTimeout(() => reject(new Error('Timeout')), options.retryTimeout! * 1000)
                            ) : Promise.resolve(null)
                        ]) as T;
                    } catch (e) {
                        const error = e as Error;
                        attempts++;

                        if (attempts < maxAttempts) {
                            if (options.verboseRetry ?? true) {
                                console.log(
                                    `Attempt ${attempts}/${maxAttempts} failed: ${error}, retrying...`
                                );
                            }
                            await new Promise(resolve => 
                                setTimeout(resolve, currentDelay * 1000)
                            );
                            currentDelay *= options.backoffFactor ?? 1;
                        } else {
                            if (options.retryDefault !== undefined) {
                                return options.retryDefault;
                            }
                            throw error;
                        }
                    }
                }
            };

            return descriptor;
        };
    }

    /**
     * Decorator to limit the execution frequency of a function.
     * 
     * @param period Minimum time in seconds between function calls
     */
    static throttle(period: number): MethodDecorator<(...args: any[]) => Promise<any>> {
        return function(
            target: any,
            propertyKey: string,
            descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
        ) {
            const originalMethod = descriptor.value!;
            const throttleInstance = new Throttle(period);

            descriptor.value = async function(...args: any[]) {
                return throttleInstance.apply(originalMethod.bind(this))(...args);
            };

            return descriptor;
        };
    }

    /**
     * Decorator to limit the maximum number of concurrent executions.
     * 
     * @param limit Maximum number of concurrent executions
     */
    static maxConcurrent(limit: number): MethodDecorator<(...args: any[]) => Promise<any>> {
        return function(
            target: any,
            propertyKey: string,
            descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>
        ) {
            const originalMethod = descriptor.value!;
            const semaphore = {
                queue: [] as Array<() => void>,
                count: 0,
                async acquire() {
                    if (this.count >= limit) {
                        await new Promise<void>(resolve => this.queue.push(resolve));
                    }
                    this.count++;
                },
                release() {
                    this.count--;
                    const next = this.queue.shift();
                    if (next) next();
                }
            };

            descriptor.value = async function(...args: any[]) {
                await semaphore.acquire();
                try {
                    return await originalMethod.apply(this, args);
                } finally {
                    semaphore.release();
                }
            };

            return descriptor;
        };
    }

    /**
     * Decorator to compose multiple functions, applying in sequence.
     * 
     * @param functions Functions to apply in sequence
     */
    static compose<T>(...functions: Array<(value: any) => any>): MethodDecorator<(...args: any[]) => Promise<T>> {
        return function(
            target: any,
            propertyKey: string,
            descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>
        ) {
            const originalMethod = descriptor.value!;
            
            descriptor.value = async function(...args: any[]) {
                let value = await originalMethod.apply(this, args);
                for (const func of functions) {
                    try {
                        value = await ucall(func, value);
                    } catch (e) {
                        throw new Error(`Error in function ${func.name}: ${e}`);
                    }
                }
                return value;
            };

            return descriptor;
        };
    }

    /**
     * Decorator to map a function over async function results.
     * 
     * @param func Mapping function to apply to each element
     */
    static map<T>(func: (value: any) => T): MethodDecorator<(...args: any[]) => Promise<T[]>> {
        return function(
            target: any,
            propertyKey: string,
            descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T[]>>
        ) {
            const originalMethod = descriptor.value!;
            
            descriptor.value = async function(...args: any[]) {
                const values = await originalMethod.apply(this, args);
                return values.map(func);
            };

            return descriptor;
        };
    }
}
