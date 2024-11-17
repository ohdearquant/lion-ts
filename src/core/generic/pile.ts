import * as asyncio from 'asyncio';
import * as threading from 'threading';
import { AsyncIterator, Callable, Iterator, Sequence } from 'collections';
import { wraps } from 'functools';
import { Path } from 'path';
import { Any, ClassVar, Field, FieldInfo, FieldModel, ItemExistsError, ItemNotFoundError, Observable, TypeVar, UNDEFINED } from 'lion/core/typing';
import { isSameDtype, toList } from 'lion/libs/parse';
import { copy, time } from 'lion/libs/utils';
import { Adapter, AdapterRegistry } from 'lion/protocols/adapters/adapter';
import { PileAdapterRegistry } from 'lion/protocols/registries/_pile_registry';
import { Element } from './element';
import { Progression } from './progression';
import { toListType, validateOrder } from './utils';

const T = TypeVar('T', Element);
const D = TypeVar('D');

function synchronized(func: Callable) {
  return wraps(func)(function (this: Pile, ...args: any[]) {
    this.lock.acquire();
    try {
      return func.apply(this, args);
    } finally {
      this.lock.release();
    }
  });
}

function asyncSynchronized(func: Callable) {
  return wraps(func)(async function (this: Pile, ...args: any[]) {
    await this.asyncLock.acquire();
    try {
      return await func.apply(this, args);
    } finally {
      this.asyncLock.release();
    }
  });
}

export class Pile extends Element {
  pile_: Record<string, T> = Field({ defaultFactory: () => ({}) });
  itemType: Set<typeof T> | null = Field({
    default: null,
    description: 'Set of allowed types for items in the pile.',
    exclude: true,
  });
  progress: Progression = Field({
    defaultFactory: () => new Progression(),
    description: 'Progression specifying the order of items in the pile.',
    exclude: true,
  });
  strictType: boolean = Field({
    default: false,
    description: 'Specify if enforce a strict type check',
    frozen: true,
  });

  static _adapterRegistry: ClassVar<AdapterRegistry> = PileAdapterRegistry;

  static __pydantic_extra__(): Record<string, FieldInfo> {
    return {
      _lock: Field({ defaultFactory: () => new threading.Lock() }),
      _async: Field({ defaultFactory: () => new asyncio.Lock() }),
    };
  }

  static __pydantic_private__(): Record<string, FieldInfo> {
    return this.__pydantic_extra__();
  }

  constructor(
    items: Any = null,
    itemType: Set<typeof T> | null = null,
    order: Any = null,
    strictType: boolean = false,
    ...kwargs: any[]
  ) {
    const _config: Record<string, any> = {};
    if ('ln_id' in kwargs) {
      _config['ln_id'] = kwargs['ln_id'];
    }
    if ('created' in kwargs) {
      _config['created'] = kwargs['created'];
    }

    super({ strictType, ..._config });
    this.itemType = this._validateItemType(itemType);
    this.pile_ = this._validatePile(items || kwargs['pile_'] || {});
    this.progress = this._validateOrder(order);
  }

  static fromDict(data: Record<string, any>): Pile {
    const items = data['pile_'].map((i: any) => Element.fromDict(i));
    return new this({ items, ...data });
  }

  __setitem__(key: Any, item: Any): void {
    this._setitem(key, item);
  }

  @synchronized
  pop(key: Any, default_: D = UNDEFINED): T | Pile | D {
    return this._pop(key, default_);
  }

  remove(item: T): void {
    this._remove(item);
  }

  include(item: Any): void {
    this._include(item);
  }

  exclude(item: Any): void {
    this._exclude(item);
  }

  @synchronized
  clear(): void {
    this._clear();
  }

  update(other: Any): void {
    this._update(other);
  }

  @synchronized
  insert(index: number, item: T): void {
    this._insert(index, item);
  }

  @synchronized
  append(item: T): void {
    this.update(item);
  }

  @synchronized
  get(key: Any, default_: D = UNDEFINED): T | Pile | D {
    return this._get(key, default_);
  }

  keys(): Sequence<string> {
    return this.progress;
  }

  values(): Sequence<T> {
    return this.progress.map((key: string) => this.pile_[key]);
  }

  items(): Sequence<[string, T]> {
    return this.progress.map((key: string) => [key, this.pile_[key]]);
  }

  isEmpty(): boolean {
    return this.progress.length === 0;
  }

  size(): number {
    return this.progress.length;
  }

  __iter__(): Iterator<T> {
    const currentOrder = [...this.progress];
    return currentOrder.map((key: string) => this.pile_[key])[Symbol.iterator]();
  }

  __next__(): T {
    return this.__iter__().next().value;
  }

  __getitem__(key: Any): Any {
    return this._getitem(key);
  }

  __contains__(item: Any): boolean {
    return item in this.progress;
  }

  __len__(): number {
    return this.pile_.length;
  }

  __bool__(): boolean {
    return !this.isEmpty();
  }

  __list__(): T[] {
    return this.values();
  }

  __ior__(other: Pile): Pile {
    if (!(other instanceof Pile)) {
      throw new TypeError(`Invalid type for Pile operation. Expected Pile, got ${typeof other}`);
    }
    this.include(other.values());
    return this;
  }

  __or__(other: Pile): Pile {
    if (!(other instanceof Pile)) {
      throw new TypeError(`Invalid type for Pile operation. Expected Pile, got ${typeof other}`);
    }
    const result = new this.constructor({
      items: this.values(),
      itemType: this.itemType,
      order: this.progress,
    });
    result.include(other.values());
    return result;
  }

  __ixor__(other: Pile): Pile {
    if (!(other instanceof Pile)) {
      throw new TypeError(`Invalid type for Pile operation. Expected Pile, got ${typeof other}`);
    }
    const toExclude = other.values().filter((i: T) => i in this);
    this.exclude(toExclude);
    this.include(other.values().filter((i: T) => !(i in toExclude)));
    return this;
  }

  __xor__(other: Pile): Pile {
    if (!(other instanceof Pile)) {
      throw new TypeError(`Invalid type for Pile operation. Expected Pile, got ${typeof other}`);
    }
    const toExclude = other.values().filter((i: T) => i in this);
    const values = this.values().filter((i: T) => !(i in toExclude)).concat(
      other.values().filter((i: T) => !(i in toExclude))
    );
    return new this.constructor({ items: values, itemType: this.itemType });
  }

  __iand__(other: Pile): Pile {
    if (!(other instanceof Pile)) {
      throw new TypeError(`Invalid type for Pile operation. Expected Pile, got ${typeof other}`);
    }
    const toExclude = this.values().filter((i: T) => !(i in other));
    this.exclude(toExclude);
    return this;
  }

  __and__(other: Pile): Pile {
    if (!(other instanceof Pile)) {
      throw new TypeError(`Invalid type for Pile operation. Expected Pile, got ${typeof other}`);
    }
    const values = this.values().filter((i: T) => i in other);
    return new this.constructor({ items: values, itemType: this.itemType });
  }

  __str__(): string {
    return `Pile(${this.size()})`;
  }

  __repr__(): string {
    const length = this.size();
    if (length === 0) {
      return 'Pile()';
    } else if (length === 1) {
      return `Pile(${this.values()[0].toRepr()})`;
    } else {
      return `Pile(${length})`;
    }
  }

  __getstate__(): Record<string, any> {
    const state = { ...this };
    state['_lock'] = null;
    state['_async_lock'] = null;
    return state;
  }

  __setstate__(state: Record<string, any>): void {
    Object.assign(this, state);
    this._lock = new threading.Lock();
    this._async_lock = new asyncio.Lock();
  }

  get lock(): threading.Lock {
    if (!this._lock) {
      this._lock = new threading.Lock();
    }
    return this._lock;
  }

  get asyncLock(): asyncio.Lock {
    if (!this._async_lock) {
      this._async_lock = new asyncio.Lock();
    }
    return this._async_lock;
  }

  @asyncSynchronized
  async asetitem(key: Any, item: Any): Promise<void> {
    this._setitem(key, item);
  }

  @asyncSynchronized
  async apop(key: Any, default_: Any = UNDEFINED): Promise<T | Pile | Any> {
    return this._pop(key, default_);
  }

  @asyncSynchronized
  async aremove(item: Any): Promise<void> {
    this._remove(item);
  }

  @asyncSynchronized
  async ainclude(item: Any): Promise<void> {
    this._include(item);
    if (!(item in this)) {
      throw new TypeError(`Item ${item} is not of allowed types`);
    }
  }

  @asyncSynchronized
  async aexclude(item: Any): Promise<void> {
    this._exclude(item);
  }

  @asyncSynchronized
  async aclear(): Promise<void> {
    this._clear();
  }

  @asyncSynchronized
  async aupdate(other: Any): Promise<void> {
    this._update(other);
  }

  @asyncSynchronized
  async aget(key: Any, default_: Any = UNDEFINED): Promise<T | Pile | Any> {
    return this._get(key, default_);
  }

  async __aiter__(): AsyncIterator<T> {
    const currentOrder = [...this.progress];
    for (const key of currentOrder) {
      yield this.pile_[key];
      await asyncio.sleep(0);
    }
  }

  async __anext__(): Promise<T> {
    const iter = this.__aiter__();
    const { value, done } = await iter.next();
    if (done) {
      throw new Error('End of pile');
    }
    return value;
  }

  _getitem(key: Any): Any {
    if (key === null) {
      throw new Error('getitem key not provided.');
    }

    if (typeof key === 'number' || key instanceof Array) {
      try {
        const resultIds = this.progress[key];
        const result = Array.isArray(resultIds) ? resultIds.map((id: string) => this.pile_[id]) : [this.pile_[resultIds]];
        return result.length === 1 ? result[0] : result;
      } catch (e) {
        throw new ItemNotFoundError(`index ${key}. Error: ${e}`);
      }
    } else if (typeof key === 'string') {
      try {
        return this.pile_[key];
      } catch (e) {
        throw new ItemNotFoundError(`key ${key}. Error: ${e}`);
      }
    } else {
      const keys = toListType(key);
      const result = [];
      try {
        for (const k of keys) {
          const resultId = ID.get_id(k);
          result.push(this.pile_[resultId]);
        }
        if (result.length === 0) {
          throw new ItemNotFoundError(`key ${key} item not found`);
        }
        return result.length === 1 ? result[0] : result;
      } catch (e) {
        throw new ItemNotFoundError(`Key ${key}. Error:${e}`);
      }
    }
  }

  _setitem(key: Any, item: Any): void {
    const itemDict = this._validatePile(item);
    const itemOrder = Object.keys(itemDict).filter((i: string) => !(i in this.progress));
    if (typeof key === 'number' || key instanceof Array) {
      try {
        const deleteOrder = Array.isArray(this.progress[key]) ? this.progress[key] : [this.progress[key]];
        this.progress[key] = itemOrder;
        deleteOrder.forEach((i: string) => delete this.pile_[i]);
        Object.assign(this.pile_, itemDict);
      } catch (e) {
        throw new Error(`Failed to set pile. Error: ${e}`);
      }
    } else {
      const keys = toListType(key);
      if (keys.length !== itemOrder.length) {
        throw new Error(`Invalid key ${key}. Key and item does not match.`);
      }
      keys.forEach((k: string) => {
        const id = ID.get_id(k);
        if (!(id in itemOrder)) {
          throw new Error(`Invalid key ${id}. Key and item does not match.`);
        }
      });
      this.progress.push(...keys);
      Object.assign(this.pile_, itemDict);
    }
  }

  _get(key: Any, default_: D = UNDEFINED): T | Pile | D {
    if (typeof key === 'number' || key instanceof Array) {
      try {
        return this[key];
      } catch (e) {
        if (default_ === UNDEFINED) {
          throw new ItemNotFoundError(`Item not found. Error: ${e}`);
        }
        return default_;
      }
    } else {
      const check = Array.isArray(key) && key.every((i: any) => typeof i === 'number');
      try {
        if (!check) {
          key = validateOrder(key);
        }
        const result = key.map((k: any) => this[k]);
        if (result.length === 0) {
          throw new ItemNotFoundError(`key ${key} item not found`);
        }
        return result.length === 1 ? result[0] : result;
      } catch (e) {
        if (default_ === UNDEFINED) {
          throw new ItemNotFoundError(`Item not found. Error: ${e}`);
        }
        return default_;
      }
    }
  }

  _pop(key: Any, default_: D = UNDEFINED): T | Pile | D {
    if (typeof key === 'number' || key instanceof Array) {
      try {
        const pops = Array.isArray(this.progress[key]) ? this.progress[key] : [this.progress[key]];
        const result = pops.map((i: string) => {
          this.progress.remove(i);
          return this.pile_.pop(i);
        });
        return result.length > 1 ? new this.constructor({ items: result, itemType: this.itemType }) : result[0];
      } catch (e) {
        if (default_ === UNDEFINED) {
          throw new ItemNotFoundError(`Item not found. Error: ${e}`);
        }
        return default_;
      }
    } else {
      try {
        const keys = validateOrder(key);
        const result = keys.map((k: string) => {
          this.progress.remove(k);
          return this.pile_.pop(k);
        });
        if (result.length === 0) {
          throw new ItemNotFoundError(`key ${key} item not found`);
        }
        return result.length === 1 ? result[0] : result;
      } catch (e) {
        if (default_ === UNDEFINED) {
          throw new ItemNotFoundError(`Item not found. Error: ${e}`);
        }
        return default_;
      }
    }
  }

  _remove(item: Any): void {
    if (typeof item === 'number' || item instanceof Array) {
      throw new TypeError('Invalid item type for remove, should be ID or Item(s)');
    }
    if (item in this) {
      this.pop(item);
      return;
    }
    throw new ItemNotFoundError(`${item}`);
  }

  _include(item: Any): void {
    const itemDict = this._validatePile(item);
    const itemOrder = Object.keys(itemDict).filter((i: string) => !(i in this.progress));
    this.progress.push(...itemOrder);
    Object.assign(this.pile_, itemDict);
  }

  _exclude(item: Any): void {
    const items = toListType(item);
    const excludeList = items.filter((i: any) => i in this);
    if (excludeList.length) {
      this.pop(excludeList);
    }
  }

  _clear(): void {
    this.pile_ = {};
    this.progress.clear();
  }

  _update(other: Any): void {
    const others = this._validatePile(other);
    Object.keys(others).forEach((i: string) => {
      if (i in this.pile_) {
        this.pile_[i] = others[i];
      } else {
        this.include(others[i]);
      }
    });
  }

  _validateItemType(value: Any): Set<typeof T> | null {
    if (value === null) {
      return null;
    }
    const values = toListType(value);
    values.forEach((i: any) => {
      if (!(i.prototype instanceof Observable)) {
        throw new TypeError(`Item type must be a subclass of T. Expected ${T}, got ${typeof i}`);
      }
    });
    if (values.length !== new Set(values).size) {
      throw new Error('Detected duplicated item types in itemType.');
    }
    return values.length > 0 ? new Set(values) : null;
  }

  _validatePile(value: Any): Record<string, T> {
    if (!value) {
      return {};
    }
    const values = toListType(value);
    const result: Record<string, T> = {};
    values.forEach((i: any) => {
      if (this.itemType) {
        if (this.strictType) {
          if (!this.itemType.has(i.constructor)) {
            throw new TypeError(`Invalid item type in pile. Expected ${[...this.itemType].join(', ')}`);
          }
        } else {
          if (![...this.itemType].some((t: any) => i instanceof t)) {
            throw new TypeError(`Invalid item type in pile. Expected ${[...this.itemType].join(', ')} or the subclasses`);
          }
        }
      } else {
        if (!(i instanceof Observable)) {
          throw new Error(`Invalid pile item ${i}`);
        }
      }
      result[i.ln_id] = i;
    });
    return result;
  }

  _validateOrder(value: Any): Progression {
    if (!value) {
      return new this.progress.constructor({ order: Object.keys(this.pile_) });
    }
    const order = value instanceof Progression ? [...value] : toListType(value);
    const orderSet = new Set(order);
    if (orderSet.size !== order.length) {
      throw new Error('There are duplicate elements in the order');
    }
    if (orderSet.size !== Object.keys(this.pile_).length) {
      throw new Error('The length of the order does not match the length of the pile');
    }
    orderSet.forEach((i: any) => {
      if (!(ID.get_id(i) in this.pile_)) {
        throw new Error(`The order does not match the pile. ${i} not found`);
      }
    });
    return new this.progress.constructor({ order });
  }

  _insert(index: number, item: Any): void {
    const itemDict = this._validatePile(item);
    const itemOrder = Object.keys(itemDict).filter((i: string) => !(i in this.progress));
    this.progress.splice(index, 0, ...itemOrder);
    Object.assign(this.pile_, itemDict);
  }

  @fieldSerializer('pile_')
  _serializePile(value: Record<string, T>): any[] {
    return Object.values(value).map((i: T) => i.toDict());
  }

  static asyncPileIterator(pile: Pile): AsyncIterator<T> {
    let index = 0;
    return {
      async next(): Promise<IteratorResult<T>> {
        if (index >= pile.size()) {
          return { done: true, value: undefined };
        }
        const item = pile[pile.progress[index]];
        index += 1;
        await asyncio.sleep(0);
        return { done: false, value: item };
      },
    };
  }

  async __aenter__(): Promise<this> {
    await this.asyncLock.acquire();
    return this;
  }

  async __aexit__(excType: any, excVal: any, excTb: any): Promise<void> {
    this.asyncLock.release();
  }

  isHomogenous(): boolean {
    return this.pile_.length < 2 || isSameDtype(Object.values(this.pile_));
  }

  adaptTo(objKey: string, ...args: any[]): any {
    return this._getAdapterRegistry().adaptTo(this, objKey, ...args);
  }

  static listAdapters(): string[] {
    return this._getAdapterRegistry().listAdapters();
  }

  static registerAdapter(adapter: typeof Adapter): void {
    this._getAdapterRegistry().register(adapter);
  }

  static _getAdapterRegistry(): AdapterRegistry {
    if (typeof this._adapterRegistry === 'function') {
      this._adapterRegistry = new this._adapterRegistry();
    }
    return this._adapterRegistry;
  }

  static adaptFrom(obj: any, objKey: string, ...args: any[]): Pile {
    const dict = this._getAdapterRegistry().adaptFrom(this, obj, objKey, ...args);
    return new this({ pile_: Array.isArray(dict) ? dict : { pile_: dict } });
  }

  toDf(columns: string[] | null = null, ...args: any[]): any {
    return this.adaptTo('pd_dataframe', { columns, ...args });
  }

  toCsv(fp: string | Path, ...args: any[]): void {
    this.adaptTo('.csv', { fp, ...args });
  }

  toExcel(fp: string | Path, ...args: any[]): void {
    this.adaptTo('.xlsx', { fp, ...args });
  }
}

export function pile(
  items: Any = null,
  itemType: typeof T | Set<typeof T> | null = null,
  order: string[] | null = null,
  strictType: boolean = false,
  df: any = null,
  fp: string | Path | null = null,
  ...kwargs: any[]
): Pile {
  if (df) {
    return Pile.adaptFrom(df, 'pd_dataframe', ...kwargs);
  }
  if (fp) {
    const path = new Path(fp);
    if (path.suffix === '.csv') {
      return Pile.adaptFrom(path, '.csv', ...kwargs);
    }
    if (path.suffix === '.xlsx') {
      return Pile.adaptFrom(path, '.xlsx', ...kwargs);
    }
    if (path.suffix === '.json') {
      return Pile.adaptFrom(path, '.json', ...kwargs);
    }
  }
  return new Pile({ items, itemType, order, strictType, ...kwargs });
}
