import { type Dict, type Callable, type MaybeUndefined } from '../constants';
import { BaseModel } from './base';
/**
 * Model for field definitions with validation and metadata
 */
export declare class FieldModel extends BaseModel {
    default: MaybeUndefined<any>;
    defaultFactory: MaybeUndefined<Callable>;
    title: MaybeUndefined<string>;
    description: MaybeUndefined<string>;
    examples: MaybeUndefined<any[]>;
    validators: MaybeUndefined<Callable[]>;
    exclude: MaybeUndefined<boolean>;
    deprecated: MaybeUndefined<boolean>;
    frozen: MaybeUndefined<boolean>;
    alias: MaybeUndefined<string>;
    aliasPriority: MaybeUndefined<number>;
    name: string;
    annotation: MaybeUndefined<any>;
    validator: MaybeUndefined<Callable>;
    validatorKwargs: Dict;
    /**
     * Get the field information for use in model creation
     */
    get fieldInfo(): Dict;
    /**
     * Get the field validator configuration
     */
    get fieldValidator(): Dict | null;
    /**
     * Create a new field model instance
     */
    constructor(data?: Dict);
}
