"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelConfig = exports.BaseModel = exports.Field = void 0;
require("reflect-metadata");
const constants_1 = require("../constants");
/**
 * Metadata storage for model fields
 */
const modelFields = new Map();
const modelConfigs = new Map();
/**
 * Decorator for marking class fields
 */
function Field(options = {}) {
    return function (target, propertyKey) {
        const constructor = target.constructor.name;
        if (!modelFields.has(constructor)) {
            modelFields.set(constructor, new Map());
        }
        const fields = modelFields.get(constructor);
        const type = Reflect.getMetadata('design:type', target, propertyKey);
        fields.set(propertyKey, {
            type,
            required: true,
            ...options
        });
    };
}
exports.Field = Field;
/**
 * Base class for all models
 */
class BaseModel {
    constructor(data = {}) {
        this.validateAndAssign(data);
    }
    validateAndAssign(data) {
        const constructor = this.constructor.name;
        const fields = modelFields.get(constructor) || new Map();
        const config = modelConfigs.get(constructor) || {};
        for (const [key, field] of fields.entries()) {
            let value = data[key];
            // Handle undefined values
            if (value === undefined) {
                if (field.defaultFactory) {
                    value = field.defaultFactory();
                }
                else if ('default' in field) {
                    value = field.default;
                }
                else if (field.required) {
                    throw new Error(`Missing required field: ${key}`);
                }
                else {
                    value = constants_1.UNDEFINED;
                }
            }
            // Run validators
            if (field.validators && value !== constants_1.UNDEFINED) {
                for (const validator of field.validators) {
                    const result = validator(value);
                    if (!result) {
                        throw new Error(`Validation failed for field: ${key}`);
                    }
                }
            }
            this[key] = value;
        }
    }
    cleanDump() {
        const result = {};
        const fields = modelFields.get(this.constructor.name) || new Map();
        for (const [key, _] of fields.entries()) {
            const value = this[key];
            if (!(0, constants_1.isUndefined)(value)) {
                result[key] = value;
            }
        }
        return result;
    }
    toDict() {
        const result = {};
        const fields = modelFields.get(this.constructor.name) || new Map();
        for (const [key, _] of fields.entries()) {
            result[key] = this[key];
        }
        return result;
    }
    static fromDict(data) {
        return new this(data);
    }
    static getFields() {
        return modelFields.get(this.name) || new Map();
    }
    static getConfig() {
        return modelConfigs.get(this.name) || {};
    }
}
exports.BaseModel = BaseModel;
/**
 * Decorator for model configuration
 */
function ModelConfig(config) {
    return function (constructor) {
        modelConfigs.set(constructor.name, {
            ...modelConfigs.get(constructor.name),
            ...config
        });
    };
}
exports.ModelConfig = ModelConfig;
