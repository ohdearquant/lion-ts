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

import { ModelConfig } from './base';
import { BaseAutoModel } from './auto';
import { uniqueHash } from '../libs/utils';

const schemaConfig = {
  extraFields: false,
  validateDefaults: false,
  populateByName: true,
  arbitraryTypesAllowed: true,
  useEnumValues: true,
};

/**
 * Model with schema validation and unique hash
 */
@ModelConfig(schemaConfig)
export class SchemaModel extends BaseAutoModel {
  private readonly _uniqueHash: string;

  constructor(data: Record<string, any> = {}) {
    super(data);
    this._uniqueHash = uniqueHash(32);
  }

  /**
   * Get list of field names
   */
  static keys(): string[] {
    return Array.from(this.getFields().keys());
  }

  /**
   * Hash based on unique identifier
   */
  hash(): number {
    return this._uniqueHash.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
  }
}
