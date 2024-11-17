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

import { Field, ModelConfig } from './base';
import { BaseAutoModel } from './auto';
import { UNDEFINED } from '../types/undefined';
import { Dict } from '../types/base';
import { copy } from '../libs/utils';
import { flatten, nget, ninsert, npop, nset, toList } from '../libs/parse';

type IndiceType = string | (string | number)[];

const noteConfig = {
  arbitraryTypesAllowed: true,
  useEnumValues: true,
  populateByName: true,
};

/**
 * A container for managing nested dictionary data structures
 */
@ModelConfig(noteConfig)
export class Note extends BaseAutoModel {
  @Field({
    description: 'The nested content of the note',
    defaultFactory: () => ({}),
  })
  content: Dict = {};

  constructor(data: Dict = {}) {
    super({});
    this.content = data;
  }

  /**
   * Clean dump excluding undefined values
   */
  cleanDump(): Dict {
    const out = copy(this.content);
    for (const [key, value] of Object.entries(this.content)) {
      if (value === UNDEFINED) {
        delete out[key];
      }
    }
    return out;
  }

  /**
   * Remove and return an item from the nested structure
   */
  pop(indices: IndiceType, defaultValue: any = UNDEFINED): any {
    const indicesList = toList(indices, { flatten: true, dropna: true });
    return npop(this.content, indicesList, defaultValue);
  }

  /**
   * Insert a value into the nested structure at the specified indices
   */
  insert(indices: IndiceType, value: any): void {
    const indicesList = toList(indices, { flatten: true, dropna: true });
    ninsert(this.content, indicesList, value);
  }

  /**
   * Set a value in the nested structure at the specified indices
   */
  set(indices: IndiceType, value: any): void {
    const indicesList = toList(indices, { flatten: true, dropna: true });
    if (this.get(indices) === undefined) {
      this.insert(indices, value);
    } else {
      nset(this.content, indicesList, value);
    }
  }

  /**
   * Get a value from the nested structure at the specified indices
   */
  get(indices: IndiceType, defaultValue: any = UNDEFINED): any {
    const indicesList = toList(indices, { flatten: true, dropna: true });
    return nget(this.content, indicesList, defaultValue);
  }

  /**
   * Get the keys of the Note
   */
  keys(flat = false, options: Dict = {}): string[] {
    if (flat) {
      options.coerceKeys = options.coerceKeys ?? false;
      options.coerceSequence = options.coerceSequence ?? 'list';
      return Object.keys(flatten(this.content, options));
    }
    return Object.keys(this.content);
  }

  /**
   * Get the values of the Note
   */
  values(flat = false, options: Dict = {}): any[] {
    if (flat) {
      options.coerceKeys = options.coerceKeys ?? false;
      options.coerceSequence = options.coerceSequence ?? 'list';
      return Object.values(flatten(this.content, options));
    }
    return Object.values(this.content);
  }

  /**
   * Get the entries of the Note
   */
  entries(flat = false, options: Dict = {}): [string, any][] {
    if (flat) {
      options.coerceKeys = options.coerceKeys ?? false;
      options.coerceSequence = options.coerceSequence ?? 'list';
      return Object.entries(flatten(this.content, options));
    }
    return Object.entries(this.content);
  }

  /**
   * Convert to dictionary
   */
  toDict(): Dict {
    return this.content;
  }

  /**
   * Clear the content
   */
  clear(): void {
    this.content = {};
  }

  /**
   * Update content at specified indices
   */
  update(indices: IndiceType, value: any): void {
    let existing: any = undefined;
    if (!indices) {
      existing = this.content;
    } else {
      existing = this.get(indices);
    }

    if (existing === undefined) {
      if (!Array.isArray(value) && typeof value !== 'object') {
        value = [value];
      }
      this.set(indices, value);
      return;
    }

    if (Array.isArray(existing)) {
      if (Array.isArray(value)) {
        existing.push(...value);
      } else {
        existing.push(value);
      }
    } else if (typeof existing === 'object') {
      if (value instanceof Note) {
        value = value.content;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(existing, value);
      } else {
        throw new Error('Cannot update a dictionary with a non-dictionary value.');
      }
    }
  }

  /**
   * Create from dictionary
   */
  static fromDict(data: Dict): Note {
    return new Note(data);
  }

  /**
   * Check if indices exist in content
   */
  has(indices: IndiceType): boolean {
    return this.get(indices) !== undefined;
  }

  /**
   * Get content length
   */
  get length(): number {
    return Object.keys(this.content).length;
  }

  /**
   * Get iterator of content keys
   */
  [Symbol.iterator](): Iterator<string> {
    return Object.keys(this.content)[Symbol.iterator]();
  }
}
