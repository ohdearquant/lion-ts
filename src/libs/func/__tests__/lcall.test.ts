import { lcall } from '../lcall';

describe('List Call Function', () => {
    test('basic functionality', () => {
        const inputs = [1, 2, 3];
        const results = lcall(inputs, x => x * 2);
        expect(results).toEqual([2, 4, 6]);
    });

    test('handles array input', () => {
        const inputs = [[1, 2], [3, 4]];
        const results = lcall(inputs, arr => (arr as number[]).reduce((a, b) => a + b), {
            flatten: true
        });
        expect(results).toEqual([3, 7]);
    });

    test('handles unique option', () => {
        const inputs = [1, 2, 2, 3];
        const results = lcall(inputs, x => x, {
            unique: true,
            flatten: true
        });
        expect(results).toEqual([1, 2, 3]);
    });

    test('handles dropna option', () => {
        const inputs = [1, 2, 3];
        const results = lcall(inputs, x => x === 2 ? null : x, {
            dropna: true
        });
        expect(results).toEqual([1, 3]);
    });

    test('handles array of functions validation', () => {
        const inputs = [1, 2, 3];
        const funcs = [
            (x: number) => x * 2
        ];
        const results = lcall(inputs, funcs);
        expect(results).toEqual([2, 4, 6]);
    });

    test('throws error with multiple functions', () => {
        const inputs = [1, 2, 3];
        const funcs = [
            (x: number) => x * 2,
            (x: number) => x + 1
        ];
        expect(() => lcall(inputs, funcs)).toThrow(
            "There must be one and only one function for list calling."
        );
    });

    // Additional TypeScript-specific tests
    test('preserves type safety', () => {
        const inputs = [1, 2, 3];
        const results = lcall<number, string>(inputs, x => x.toString());
        expect(results.every(x => typeof x === 'string')).toBe(true);
    });

    test('handles complex types', () => {
        interface Person {
            name: string;
            age: number;
        }
        const inputs: Person[] = [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 }
        ];
        const results = lcall<Person, string>(inputs, p => p.name);
        expect(results).toEqual(['Alice', 'Bob']);
    });

    test('handles nested arrays with flatten', () => {
        const inputs = [[1, 2], [3, 4], [5, 6]];
        const results = lcall(inputs, arr => arr, {
            flatten: true
        });
        expect(results).toEqual([1, 2, 3, 4, 5, 6]);
    });

    test('combines multiple options', () => {
        const inputs = [[1, 2, 2], [3, 3, 4], [null, 5, 5]];
        const results = lcall(inputs, arr => arr, {
            flatten: true,
            unique: true,
            dropna: true
        });
        expect(results).toEqual([1, 2, 3, 4, 5]);
    });

    test('handles empty input', () => {
        const inputs: number[] = [];
        const results = lcall(inputs, x => x * 2);
        expect(results).toEqual([]);
    });

    test('handles single input', () => {
        const input = 5;
        const results = lcall(input, x => x * 2);
        expect(results).toEqual([10]);
    });
});
