# Nested Data Structure Utilities

A comprehensive TypeScript library for working with nested data structures like objects and arrays. This library provides utilities for manipulating, querying, and transforming deeply nested data structures.

## Core Functions

### Deep Update Operations

#### `deepUpdate(original, update)`
Recursively merge two dictionaries, updating values instead of overwriting.
```typescript
const original = { a: 1, b: { c: 2 } };
const update = { b: { d: 3 } };
deepUpdate(original, update);
// Result: { a: 1, b: { c: 2, d: 3 } }
```

#### `deepUpdateAll(target, ...sources)`
Deep update multiple objects sequentially.
```typescript
const obj1 = { a: 1, b: { c: 2 } };
const obj2 = { b: { d: 3 } };
const obj3 = { b: { e: 4 } };
deepUpdateAll(obj1, obj2, obj3);
// Result: { a: 1, b: { c: 2, d: 3, e: 4 } }
```

### Flattening & Unflattening

#### `flatten(input, options)`
Flatten a nested structure into a single-level dictionary.
```typescript
const nested = { a: { b: [1, 2] } };
flatten(nested);
// Result: { 'a|b|0': 1, 'a|b|1': 2 }
```

#### `unflatten(flatDict, options)`
Convert a flattened dictionary back into a nested structure.
```typescript
const flat = { 'a|b|0': 1, 'a|b|1': 2 };
unflatten(flat);
// Result: { a: { b: [1, 2] } }
```

### Type Checking

#### `isHomogenous(iterables, typeCheck)`
Check if all elements in a list or all values in a dict are of same type.
```typescript
isHomogenous([1, 2, 3], Number); // true
isHomogenous(['a', 'b'], String); // true
isHomogenous([1, '2'], Number); // false
```

#### `isSameDtype(input, options)`
Check if all elements have the same data type.
```typescript
isSameDtype([1, 2, 3]); // true
isSameDtype([1, '2', 3]); // false
```

#### `isStructureHomogenous(structure, options)`
Check if a nested structure is homogeneous (no mix of arrays and objects).
```typescript
isStructureHomogenous({ a: { b: 1 }, c: { d: 2 } }); // true
isStructureHomogenous({ a: { b: 1 }, c: [1, 2] }); // false
```

### Navigation & Manipulation

#### `nget(nested, indices, defaultValue)`
Get a value from a nested structure using a list of indices.
```typescript
const data = { a: { b: [1, 2] } };
nget(data, ['a', 'b', 1]); // 2
nget(data, ['a', 'c'], 'default'); // 'default'
```

#### `nset(nested, indices, value)`
Set a value within a nested structure at the specified path.
```typescript
const data = { a: { b: [1, 2] } };
nset(data, ['a', 'b', 1], 3);
// Result: { a: { b: [1, 3] } }
```

#### `ninsert(data, indices, value)`
Insert a value into a nested structure at a specified path.
```typescript
const data = { a: [] };
ninsert(data, ['a', 0], 'value');
// Result: { a: ['value'] }
```

#### `npop(input, indices, defaultValue)`
Remove and return a value from a nested structure at the specified path.
```typescript
const data = { a: { b: [1, 2] } };
npop(data, ['a', 'b', 1]); // 2
// Result: { a: { b: [1] } }
```

### Filtering & Merging

#### `nfilter(nested, condition)`
Filter elements in a nested structure based on a condition.
```typescript
const data = { a: 1, b: { c: 2, d: 3 }, e: [4, 5, 6] };
nfilter(data, x => typeof x === 'number' && x > 2);
// Result: { b: { d: 3 }, e: [4, 5, 6] }
```

#### `nmerge(structures, options)`
Merge multiple dictionaries, lists, or sequences into a unified structure.
```typescript
nmerge([{ a: 1 }, { b: 2 }]); // { a: 1, b: 2 }
nmerge([{ a: 1 }, { a: 2 }], { overwrite: true }); // { a: 2 }
nmerge([[1, 3], [2, 4]], { sortList: true }); // [1, 2, 3, 4]
```

### List Operations

#### `toFlatList(input, options)`
Convert any input into a flattened list.
```typescript
toFlatList([1, [2, 3], [[4]]]); // [1, 2, 3, 4]
toFlatList([1, null, [2, undefined]], { dropna: true }); // [1, 2]
toFlatList([1, [2, 1], [2]], { unique: true }); // [1, 2]
```

## Common Options

Many functions accept common options:

- `sep`: Separator for joining keys (default: '|')
- `maxDepth`: Maximum depth to process
- `dropna`: Remove null and undefined values
- `unique`: Remove duplicate values
- `overwrite`: Whether to overwrite existing values
- `suppress`: Suppress errors and return default values

## Error Handling

All functions include robust error handling and will throw appropriate errors for invalid inputs or operations. Use the `suppress` option to handle errors gracefully by returning default values instead of throwing errors.

## Type Safety

The library is written in TypeScript and provides strong type safety. Most functions include type guards and proper TypeScript type definitions to ensure type safety at compile time.
