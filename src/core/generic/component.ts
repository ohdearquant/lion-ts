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

import { getClass } from '../_class_registry';
import { UNDEFINED, Any, FieldInfo, FieldModel, Note, PydanticUndefined } from '../types';
import { copy, time } from '../../libs/utils';
import { Adapter, AdapterRegistry } from '../../protocols/adapters/adapter';
import { ComponentAdapterRegistry } from '../../protocols/registries/_component_registry';
import { Element } from './element';

const DEFAULT_SERIALIZATION_INCLUDE: Set<string> = new Set([
  'ln_id',
  'timestamp',
  'metadata',
  'content',
  'embedding',
]);

/**
 * Extended base class for components in the Lion framework.
 */
export class Component extends Element {
  /** Additional metadata for the component */
  metadata: Note;

  /** The main content of the Component */
  content: any;

  /** Embedding vector */
  embedding: number[];

  private static _adapterRegistry: AdapterRegistry = ComponentAdapterRegistry;

  constructor() {
    super();
    this.metadata = new Note();
    this.content = null;
    this.embedding = [];
  }

  /**
   * Serialize metadata Note recursively.
   */
  private _serializeMetadata(value: Note): Record<string, any> {
    return this._serializeNoteRecursive(value);
  }

  private _serializeNoteRecursive(note: Note): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(note)) {
      if (value instanceof Note) {
        result[key] = this._serializeNoteRecursive(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Add a new field to the component's extra fields.
   */
  addField(
    fieldName: string,
    value: any = UNDEFINED,
    annotation?: any,
    fieldObj?: FieldInfo,
    fieldModel?: FieldModel,
    ...kwargs: any[]
  ): void {
    if (fieldName in this.allFields) {
      throw new Error(`Field '${fieldName}' already exists`);
    }

    this.updateField(fieldName, value, annotation, fieldObj, fieldModel, ...kwargs);
  }

  /**
   * Update an existing field or create a new one if it doesn't exist.
   */
  updateField(
    fieldName: string,
    value: any = UNDEFINED,
    annotation?: any,
    fieldObj?: FieldInfo,
    fieldModel?: FieldModel,
    ...kwargs: any[]
  ): void {
    super.updateField(fieldName, value, annotation, fieldObj, fieldModel, ...kwargs);
    this._addLastUpdate(fieldName);
  }

  private _addLastUpdate(fieldName: string): void {
    const currentTime = time();
    this.metadata.set(['last_updated', fieldName], currentTime);
  }

  /**
   * Convert the component to a dictionary representation.
   */
  override toDict(...kwargs: any[]): Record<string, any> {
    const dict = this.modelDump(...kwargs);
    if (this.content instanceof Note) {
      dict['content'] = this._serializeNoteRecursive(this.content);
    }
    const extraFields = dict['extra_fields'] || {};
    delete dict['extra_fields'];
    const result = { ...dict, ...extraFields, lion_class: this.className() };
    for (const key of Object.keys(result)) {
      if (result[key] === UNDEFINED) {
        delete result[key];
      }
    }
    return result;
  }

  /**
   * Convert the component to a Note object.
   */
  toNote(...kwargs: any[]): Note {
    return new Note(this.toDict(...kwargs));
  }

  /**
   * Create a component instance from a dictionary.
   */
  static override fromDict(data: Record<string, any>, ...kwargs: any[]): Component {
    const inputData = copy(data);
    if ('lion_class' in inputData) {
      const cls = getClass(inputData['lion_class']);
      delete inputData['lion_class'];
      return cls.fromDict(inputData, ...kwargs);
    }
    const extraFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(inputData)) {
      if (!(key in this.modelFields)) {
        extraFields[key] = value;
        delete inputData[key];
      }
    }
    const obj = this.modelValidate(inputData, ...kwargs);
    for (const [key, value] of Object.entries(extraFields)) {
      obj.updateField(key, value);
    }

    const metadata = copy(data['metadata'] || {});
    const lastUpdated = metadata['last_updated'] || null;
    if (lastUpdated !== null) {
      obj.metadata.set(['last_updated'], lastUpdated);
    } else {
      obj.metadata.pop(['last_updated']);
    }
    return obj;
  }

  /**
   * Set attribute value with metadata update.
   */
  override setAttribute(fieldName: string, value: any): void {
    if (fieldName === 'metadata') {
      throw new Error('Cannot directly assign to metadata.');
    } else if (fieldName === 'extra_fields') {
      throw new Error('Cannot directly assign to extra_fields');
    }
    if (fieldName in this.extraFields) {
      Object.defineProperty(this, fieldName, { value });
    } else {
      super.setAttribute(fieldName, value);
    }

    this._addLastUpdate(fieldName);
  }

  /**
   * Get attribute value with default handling.
   */
  override getAttribute(fieldName: string): any {
    if (fieldName in this.extraFields) {
      const default_ = this.extraFields[fieldName].default;
      if (default_ !== PydanticUndefined) {
        return default_;
      }
      return UNDEFINED;
    }

    const clsName = this.constructor.name;
    throw new Error(`'${clsName}' object has no attribute '${fieldName}'`);
  }

  /**
   * Return a concise string representation of the component.
   */
  override toString(): string {
    let contentPreview = String(this.content).slice(0, 50);
    if (contentPreview.length === 50) {
      contentPreview += '...';
    }

    let outputStr = `${this.constructor.name}(ln_id=${this.ln_id.slice(0, 8)}..., timestamp=${String(this.createdDatetime).slice(0, -6)}, content='${contentPreview}', metadata_keys=${Object.keys(this.metadata)}, `;

    for (const [key, value] of Object.entries(this.modelDump())) {
      if (!DEFAULT_SERIALIZATION_INCLUDE.has(key)) {
        if (typeof value === 'object') {
          outputStr += `${key}=${Object.keys(value)}, `;
        } else if (typeof value === 'string') {
          let valuePreview = value.slice(0, 50);
          if (valuePreview.length === 50) {
            valuePreview += '...';
          }
          outputStr += `${key}=${valuePreview}, `;
        } else {
          outputStr += `${key}=${value}, `;
        }
      }
    }

    outputStr += `extra_fields_keys=${Object.keys(this.extraFields)})`;

    return outputStr;
  }

  /**
   * Return a detailed string representation of the component.
   */
  override toRepr(): string {
    const truncateDict = (d: Record<string, any>, maxItems = 5, maxStrLen = 50): Record<string, any> => {
      const items = Object.entries(d).slice(0, maxItems);
      const truncated: Record<string, any> = {};
      for (const [key, value] of items) {
        truncated[key] = typeof value === 'string' && value.length > maxStrLen ? value.slice(0, maxStrLen) + '...' : value;
      }
      if (Object.keys(d).length > maxItems) {
        truncated['...'] = `(${Object.keys(d).length - maxItems} more items)`;
      }
      return truncated;
    };

    let contentRepr = String(this.content);
    if (contentRepr.length > 100) {
      contentRepr = contentRepr.slice(0, 97) + '...';
    }

    const dict = this.modelDump();
    const extraFields = dict['extra_fields'] || {};
    delete dict['extra_fields'];

    let reprStr = `${this.className()}(ln_id=${this.ln_id}, timestamp=${String(this.createdDatetime).slice(0, -6)}, content=${contentRepr}, metadata=${truncateDict(this.metadata)}, `;

    for (const [key, value] of Object.entries(dict)) {
      if (!DEFAULT_SERIALIZATION_INCLUDE.has(key)) {
        if (typeof value === 'object') {
          reprStr += `${key}=${truncateDict(value)}, `;
        } else if (typeof value === 'string') {
          let valueRepr = value;
          if (value.length > 100) {
            valueRepr = value.slice(0, 97) + '...';
          }
          reprStr += `${key}=${valueRepr}, `;
        } else {
          reprStr += `${key}=${value}, `;
        }
      }
    }

    reprStr += `extra_fields=${truncateDict(extraFields)})`;
    return reprStr;
  }

  /**
   * Adapt this component to another type.
   */
  adaptTo(objKey: string, ...args: any[]): any {
    return Component._getAdapterRegistry().adaptTo(this, objKey, ...args);
  }

  /**
   * List available adapters.
   */
  static listAdapters(): string[] {
    return this._getAdapterRegistry().listAdapters();
  }

  /**
   * Register a new adapter.
   */
  static registerAdapter(adapter: typeof Adapter): void {
    this._getAdapterRegistry().register(adapter);
  }

  /**
   * Get the adapter registry.
   */
  private static _getAdapterRegistry(): AdapterRegistry {
    if (typeof this._adapterRegistry === 'function') {
      this._adapterRegistry = new this._adapterRegistry();
    }
    return this._adapterRegistry;
  }

  /**
   * Create a component from another type.
   */
  static adaptFrom(obj: any, objKey: string, ...args: any[]): Component {
    const dict = this._getAdapterRegistry().adaptFrom(this, obj, objKey, ...args);
    return this.fromDict(dict);
  }
}
