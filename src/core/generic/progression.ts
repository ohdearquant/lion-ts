/**
 * Copyright 2024 HaiyangLi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { contextlib } from 'contextlib';
import { Field, ID, ItemNotFoundError, LnID, Ordering } from 'lion/core/typing';
import { toList } from 'lion/libs/parse';
import { Element } from './element';
import { toListType, validateOrder } from './utils';

export class Progression extends Element implements Ordering {
  name: string | null = Field({
    default: null,
    title: 'Name',
    description: 'The name of the progression.',
  });

  order: LnID[] = Field({
    defaultFactory: () => [],
    title: 'Order',
    description: 'The order of the progression.',
  });

  @Field.Validator('order', { mode: 'before' })
  static _validateOrder(value: ID.RefSeq): LnID[] {
    if (!value) {
      return [];
    }
    try {
      return validateOrder(value);
    } catch (e) {
      throw new Error(`Invalid order: ${e}`);
    }
  }

  __contains__(item: ID.RefSeq | ID.Ref): boolean {
    if (!item || !this.order.length) {
      return false;
    }

    item = Array.isArray(item) ? item : toListType(item);

    for (const i of item) {
      if (typeof i === 'string') {
        if (!this.order.includes(i)) {
          return false;
        }
      } else if (i instanceof Element) {
        if (!this.order.includes(i.ln_id)) {
          return false;
        }
      }
    }
    return true;
  }

  __list__(): LnID[] {
    return [...this.order];
  }

  __len__(): number {
    return this.order.length;
  }

  __getitem__(key: number | [number, number]): ID.IDSeq {
    if (typeof key !== 'number' && !Array.isArray(key)) {
      throw new TypeError(`indices must be integers or slices, not ${typeof key}`);
    }

    try {
      const a = this.order[key];
      if (!a) {
        throw new ItemNotFoundError(`index ${key} item not found`);
      }
      if (Array.isArray(key)) {
        return new Progression({ order: a });
      } else {
        return a;
      }
    } catch (e) {
      throw new ItemNotFoundError(`index ${key} item not found`);
    }
  }

  __setitem__(key: number | [number, number], value: ID.RefSeq): void {
    const a = validateOrder(value);
    this.order[key] = Array.isArray(key) ? a : a;
    this.order = toList(this.order, { flatten: true });
  }

  __delitem__(key: number | [number, number]): void {
    delete this.order[key];
  }

  __iter__(): Iterator<LnID> {
    return this.order[Symbol.iterator]();
  }

  __next__(): LnID {
    try {
      return this.order[Symbol.iterator]().next().value;
    } catch {
      throw new Error('No more items in the progression');
    }
  }

  size(): number {
    return this.__len__();
  }

  clear(): void {
    this.order.length = 0;
  }

  append(item: ID.RefSeq): void {
    const item_ = validateOrder(item);
    this.order.push(...item_);
  }

  pop(index: number = null): string {
    try {
      if (index === null) {
        return this.order.pop();
      }
      return this.order.splice(index, 1)[0];
    } catch (e) {
      throw new ItemNotFoundError('pop index out of range');
    }
  }

  include(item: ID.RefSeq): void {
    const item_ = validateOrder(item);
    for (const i of item_) {
      if (!this.order.includes(i)) {
        this.order.push(i);
      }
    }
  }

  exclude(item: number | ID.RefSeq): void {
    for (const i of validateOrder(item)) {
      while (this.order.includes(i)) {
        this.remove(i);
      }
    }
  }

  isEmpty(): boolean {
    return !this.order.length;
  }

  reverse(): Progression {
    return new Progression({ order: [...this.order].reverse(), name: this.name });
  }

  __reverse__(): Progression {
    return this.reverse();
  }

  __eq__(other: Progression): boolean {
    if (!(other instanceof Progression)) {
      return false;
    }
    return this.order === other.order && this.name === other.name;
  }

  index(item: any, start: number = 0, end: number = null): number {
    return end ? this.order.indexOf(ID.get_id(item), start, end) : this.order.indexOf(ID.get_id(item), start);
  }

  remove(item: ID.RefSeq): void {
    if (this.__contains__(item)) {
      const item_ = validateOrder(item);
      const l_ = [...this.order];

      for (const i of item_) {
        const index = l_.indexOf(i);
        if (index !== -1) {
          l_.splice(index, 1);
        }
      }
      this.order = l_;
    } else {
      throw new ItemNotFoundError(`${item}`);
    }
  }

  popleft(): string {
    try {
      return this.order.shift();
    } catch (e) {
      throw new ItemNotFoundError(e);
    }
  }

  extend(item: Progression): void {
    if (!(item instanceof Progression)) {
      throw new TypeError(`Invalid type for Progression operation. Expected Progression, got ${typeof item}`);
    }
    this.order.push(...item.order);
  }

  count(item: ID.Ref): number {
    if (!this.order.length || !this.__contains__(item)) {
      return 0;
    }
    return this.order.filter(i => i === ID.get_id(item)).length;
  }

  __bool__(): boolean {
    return !this.isEmpty();
  }

  __add__(other: ID.RefSeq): Progression {
    const other_ = validateOrder(other);
    const newOrder = [...this.order, ...other_];
    return new Progression({ order: newOrder });
  }

  __radd__(other: ID.RefSeq): Progression {
    return this.__add__(other);
  }

  __iadd__(other: ID.RefSeq): Progression {
    this.append(other);
    return this;
  }

  __isub__(other: ID.RefSeq): Progression {
    this.remove(other);
    return this;
  }

  __sub__(other: ID.RefSeq): Progression {
    const other_ = validateOrder(other);
    const newOrder = this.order.filter(i => !other_.includes(i));
    return new Progression({ order: newOrder });
  }

  __repr__(): string {
    return `Progression(${this.order})`;
  }

  __str__(): string {
    let a = String(this.order);
    if (a.length > 50) {
      a = a.slice(0, 50) + '...';
    }
    return `Progression(name=${this.name}, size=${this.__len__()}, items=${a})`;
  }

  insert(index: number, item: ID.RefSeq): void {
    const item_ = validateOrder(item);
    for (const i of item_.reverse()) {
      this.order.splice(index, 0, ID.get_id(i));
    }
  }

  __hash__(): number {
    return this.ln_id.hashCode();
  }
}

export function progression(order: ID.RefSeq = null, name: string = null): Progression {
  return new Progression({ order, name });
}
