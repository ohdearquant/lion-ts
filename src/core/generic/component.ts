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

import { fieldSerializer } from 'pydantic';
import { getClass } from 'lion/core/_class_registry';
import {
  UNDEFINED,
  Any,
  ClassVar,
  Field,
  FieldInfo,
  FieldModel,
  Note,
  OperableModel,
  PydanticUndefined,
  TypeVar,
} from 'lion/core/typing';
import { copy, time } from 'lion/libs/utils';
import { Adapter, AdapterRegistry } from 'lion/protocols/adapters/adapter';
import { ComponentAdapterRegistry } from 'lion/protocols/registries/_component_registry';
import { Element } from './element';

const FIELD_NAME = TypeVar('FIELD_NAME', String);

const DEFAULT_SERIALIZATION_INCLUDE: Set<string> = new Set([
  'ln_id',
  'timestamp',
  'metadata',
  'content',
  'embedding',
]);

export class Component extends Element implements OperableModel {
  metadata: Note = Field({
    defaultFactory: () => new Note(),
    description: 'Additional metadata for the component',
  });

  content: Any = Field({
    default: null,
    description: 'The main content of the Component',
  });

  embedding: number[] = Field({ defaultFactory: () => [] });

  static _adapterRegistry: ClassVar<AdapterRegistry> = ComponentAdapterRegistry;

  @fieldSerializer('metadata')
  _serializeMetadata(value: Note): Record<string, any> {
    return this._serializeNoteRecursive(value);
  }

  _serializeNoteRecursive(note: Note): Record<string, any> {
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

  addField(
    fieldName: FIELD_NAME,
    value: Any = UNDEFINED,
    annotation: any = UNDEFINED,
    fieldObj: FieldInfo = UNDEFINED,
    fieldModel: FieldModel = UNDEFINED,
    ...kwargs: any[]
  ): void {
    if (fieldName in this.allFields) {
      throw new Error(`Field '${fieldName}' already exists`);
    }

    this.updateField(fieldName, value, annotation, fieldObj, fieldModel, ...kwargs);
  }

  updateField(
    fieldName: FIELD_NAME,
    value: Any = UNDEFINED,
    annotation: any = UNDEFINED,
    fieldObj: FieldInfo = UNDEFINED,
    fieldModel: FieldModel = UNDEFINED,
    ...kwargs: any[]
  ): void {
    super.updateField(fieldName, value, annotation, fieldObj, fieldModel, ...kwargs);
    this._addLastUpdate(fieldName);
  }

  _addLastUpdate(fieldName: FIELD_NAME): void {
    const currentTime = time();
    this.metadata.set(['last_updated', fieldName], currentTime);
  }

  toDict(...kwargs: any[]): Record<string, any> {
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

  toNote(...kwargs: any[]): Note {
    return new Note(this.toDict(...kwargs));
  }

  static fromDict(data: Record<string, any>, ...kwargs: any[]): Component {
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
      obj.metadata.pop(['last_updated'], null);
    }
    return obj;
  }

  __setattr__(fieldName: string, value: any): void {
    if (fieldName === 'metadata') {
      throw new Error('Cannot directly assign to metadata.');
    } else if (fieldName === 'extra_fields') {
      throw new Error('Cannot directly assign to extra_fields');
    }
    if (fieldName in this.extraFields) {
      Object.defineProperty(this, fieldName, { value });
    } else {
      super.__setattr__(fieldName, value);
    }

    this._addLastUpdate(fieldName);
  }

  __getattr__(fieldName: string): any {
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

  toString(): string {
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

  toRepr(): string {
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

  static adaptFrom(obj: any, objKey: string, ...args: any[]): Component {
    const dict = this._getAdapterRegistry().adaptFrom(this, obj, objKey, ...args);
    return this.fromDict(dict);
  }
}
