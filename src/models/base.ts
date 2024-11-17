import 'reflect-metadata';
import { z } from 'zod';
import { 
  UNDEFINED, 
  isUndefined, 
  type Dict, 
  type FieldInfo, 
  type ModelConfig 
} from '../constants';

/**
 * Metadata storage for model fields
 */
const modelFields = new Map<string, Map<string, FieldInfo>>();
const modelConfigs = new Map<string, ModelConfig>();

/**
 * Decorator for marking class fields
 */
export function Field(options: Partial<FieldInfo> = {}) {
  return function(target: any, propertyKey: string) {
    const constructor = target.constructor.name;
    if (!modelFields.has(constructor)) {
      modelFields.set(constructor, new Map());
    }
    
    const fields = modelFields.get(constructor)!;
    const type = Reflect.getMetadata('design:type', target, propertyKey);
    
    fields.set(propertyKey, {
      type,
      required: true,
      ...options
    });
  };
}

/**
 * Base class for all models
 */
export abstract class BaseModel {
  private static schema: z.ZodType;
  
  constructor(data: Dict = {}) {
    this.validateAndAssign(data);
  }

  private validateAndAssign(data: Dict): void {
    const constructor = this.constructor.name;
    const fields = modelFields.get(constructor) || new Map();
    const config = modelConfigs.get(constructor) || {};

    for (const [key, field] of fields.entries()) {
      let value = data[key];

      // Handle undefined values
      if (value === undefined) {
        if (field.defaultFactory) {
          value = field.defaultFactory();
        } else if ('default' in field) {
          value = field.default;
        } else if (field.required) {
          throw new Error(`Missing required field: ${key}`);
        } else {
          value = UNDEFINED;
        }
      }

      // Run validators
      if (field.validators && value !== UNDEFINED) {
        for (const validator of field.validators) {
          const result = validator(value);
          if (!result) {
            throw new Error(`Validation failed for field: ${key}`);
          }
        }
      }

      (this as any)[key] = value;
    }
  }

  public cleanDump(): Dict {
    const result: Dict = {};
    const fields = modelFields.get(this.constructor.name) || new Map();

    for (const [key, _] of fields.entries()) {
      const value = (this as any)[key];
      if (!isUndefined(value)) {
        result[key] = value;
      }
    }

    return result;
  }

  public toDict(): Dict {
    const result: Dict = {};
    const fields = modelFields.get(this.constructor.name) || new Map();

    for (const [key, _] of fields.entries()) {
      result[key] = (this as any)[key];
    }

    return result;
  }

  public static fromDict(data: Dict): BaseModel {
    return new (this as any)(data);
  }

  protected static getFields(): Map<string, FieldInfo> {
    return modelFields.get(this.name) || new Map();
  }

  protected static getConfig(): ModelConfig {
    return modelConfigs.get(this.name) || {};
  }
}

/**
 * Decorator for model configuration
 */
export function ModelConfig(config: ModelConfig) {
  return function(constructor: Function) {
    modelConfigs.set(constructor.name, {
      ...modelConfigs.get(constructor.name),
      ...config
    });
  };
}
