import 'reflect-metadata';
import { type Dict, type FieldInfo, type ModelConfig } from '../constants';
/**
 * Decorator for marking class fields
 */
export declare function Field(options?: Partial<FieldInfo>): (target: any, propertyKey: string) => void;
/**
 * Base class for all models
 */
export declare abstract class BaseModel {
    private static schema;
    constructor(data?: Dict);
    private validateAndAssign;
    cleanDump(): Dict;
    toDict(): Dict;
    static fromDict(data: Dict): BaseModel;
    protected static getFields(): Map<string, FieldInfo>;
    protected static getConfig(): ModelConfig;
}
/**
 * Decorator for model configuration
 */
export declare function ModelConfig(config: ModelConfig): (constructor: Function) => void;
