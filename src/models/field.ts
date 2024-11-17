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

import { Field } from './base';
import { SchemaModel } from './schema';
import { UNDEFINED, type Undefined } from '../types/undefined';
import { Callable, Dict, FieldInfo } from '../types/base';

type MaybeUndefined<T> = T | Undefined;

/**
 * Model representing a field definition with validation and metadata
 */
export class FieldModel extends SchemaModel {
  @Field({
    description: 'Default value for the field',
  })
  default: any = UNDEFINED;

  @Field({
    description: 'Factory function to generate default value',
  })
  defaultFactory: MaybeUndefined<Callable> = UNDEFINED;

  @Field({
    description: 'Field title',
  })
  title: MaybeUndefined<string> = UNDEFINED;

  @Field({
    description: 'Field description',
  })
  description: MaybeUndefined<string> = UNDEFINED;

  @Field({
    description: 'Example values',
    defaultFactory: () => [],
  })
  examples: any[] = [];

  @Field({
    description: 'List of validator functions',
    defaultFactory: () => [],
  })
  validators: Callable[] = [];

  @Field({
    description: 'Whether to exclude from serialization',
  })
  exclude: MaybeUndefined<boolean> = UNDEFINED;

  @Field({
    description: 'Whether field is deprecated',
  })
  deprecated: MaybeUndefined<boolean> = UNDEFINED;

  @Field({
    description: 'Whether field is frozen (immutable)',
  })
  frozen: MaybeUndefined<boolean> = UNDEFINED;

  @Field({
    description: 'Alias name for the field',
  })
  alias: MaybeUndefined<string> = UNDEFINED;

  @Field({
    description: 'Priority when multiple aliases exist',
  })
  aliasPriority: MaybeUndefined<number> = UNDEFINED;

  @Field({
    description: 'Field name',
    required: true,
    exclude: true,
  })
  name!: string;

  @Field({
    description: 'Field type annotation',
    exclude: true,
  })
  annotation: MaybeUndefined<any> = UNDEFINED;

  @Field({
    description: 'Field validator function',
    exclude: true,
  })
  validator: MaybeUndefined<Callable> = UNDEFINED;

  @Field({
    description: 'Validator function kwargs',
    defaultFactory: () => ({}),
    exclude: true,
  })
  validatorKwargs: Dict = {};

  /**
   * Get field info object for use with Field decorator
   */
  get fieldInfo(): FieldInfo {
    const cleanData = this.cleanDump();
    const annotation = this.annotation !== UNDEFINED ? this.annotation : Object;
    const fieldObj: FieldInfo = {
      ...cleanData,
      type: annotation,
    };
    return fieldObj;
  }

  /**
   * Get field validator configuration
   */
  get fieldValidator(): Dict<Callable> | null {
    if (this.validator === UNDEFINED) {
      return null;
    }

    const kwargs = this.validatorKwargs || {};
    return {
      [`${this.name}_validator`]: (value: any) => {
        return (this.validator as Callable)(value, kwargs);
      }
    };
  }
}
