import { 
  UNDEFINED, 
  type Dict,
  type Callable,
  type MaybeUndefined 
} from '../constants';
import { BaseModel, Field } from './base';

/**
 * Model for field definitions with validation and metadata
 */
export class FieldModel extends BaseModel {
  @Field({
    type: 'any',
    description: 'Default value for the field'
  })
  default: MaybeUndefined<any> = UNDEFINED;

  @Field({
    type: 'function',
    description: 'Factory function for default value'
  })
  defaultFactory: MaybeUndefined<Callable> = UNDEFINED;

  @Field({
    type: 'string',
    description: 'Title of the field'
  })
  title: MaybeUndefined<string> = UNDEFINED;

  @Field({
    type: 'string',
    description: 'Description of the field'
  })
  description: MaybeUndefined<string> = UNDEFINED;

  @Field({
    type: 'array',
    description: 'Example values for the field'
  })
  examples: MaybeUndefined<any[]> = UNDEFINED;

  @Field({
    type: 'array',
    description: 'Validation functions for the field'
  })
  validators: MaybeUndefined<Callable[]> = UNDEFINED;

  @Field({
    type: 'boolean',
    description: 'Whether to exclude this field from serialization'
  })
  exclude: MaybeUndefined<boolean> = UNDEFINED;

  @Field({
    type: 'boolean',
    description: 'Whether this field is deprecated'
  })
  deprecated: MaybeUndefined<boolean> = UNDEFINED;

  @Field({
    type: 'boolean',
    description: 'Whether this field is frozen (immutable)'
  })
  frozen: MaybeUndefined<boolean> = UNDEFINED;

  @Field({
    type: 'string',
    description: 'Alias for the field name'
  })
  alias: MaybeUndefined<string> = UNDEFINED;

  @Field({
    type: 'number',
    description: 'Priority for alias resolution'
  })
  aliasPriority: MaybeUndefined<number> = UNDEFINED;

  @Field({
    type: 'string',
    description: 'Name of the field',
    required: true
  })
  name!: string;

  @Field({
    type: 'any',
    description: 'Type annotation for the field'
  })
  annotation: MaybeUndefined<any> = UNDEFINED;

  @Field({
    type: 'function',
    description: 'Validator function for the field'
  })
  validator: MaybeUndefined<Callable> = UNDEFINED;

  @Field({
    type: 'object',
    description: 'Additional arguments for the validator',
    defaultFactory: () => ({})
  })
  validatorKwargs: Dict = {};

  /**
   * Get the field information for use in model creation
   */
  public get fieldInfo(): Dict {
    const info: Dict = {};
    const dump = this.cleanDump();

    // Copy all non-undefined values
    for (const [key, value] of Object.entries(dump)) {
      if (value !== UNDEFINED) {
        info[key] = value;
      }
    }

    // Set annotation if provided
    if (this.annotation !== UNDEFINED) {
      info.type = this.annotation;
    }

    return info;
  }

  /**
   * Get the field validator configuration
   */
  public get fieldValidator(): Dict | null {
    if (this.validator === UNDEFINED) {
      return null;
    }

    const kwargs = this.validatorKwargs || {};
    return {
      [`${this.name}_validator`]: {
        validator: this.validator,
        ...kwargs
      }
    };
  }

  /**
   * Create a new field model instance
   */
  constructor(data: Dict = {}) {
    super(data);
    if (!data.name) {
      throw new Error('Field name is required');
    }
  }
}
