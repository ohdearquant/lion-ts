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

import { BaseModel, ModelConfig } from './base';
import { COMMON_CONFIG } from '../constants';
import { Dict } from '../types/base';
import { UNDEFINED, isUndefined } from '../types/undefined';

/**
 * Base model with automatic validation and serialization
 */
@ModelConfig(COMMON_CONFIG)
export class BaseAutoModel extends BaseModel {
  /**
   * Clean dump excluding undefined values
   */
  cleanDump(): Dict {
    const result: Dict = {};
    for (const [key, value] of Object.entries(this.toDict())) {
      if (!isUndefined(value)) {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Convert to dictionary
   */
  toDict(): Dict {
    return super.toDict();
  }

  /**
   * Create from dictionary
   */
  static fromDict(data: Dict): BaseAutoModel {
    return new this(data);
  }
}
