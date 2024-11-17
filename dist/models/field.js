"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldModel = void 0;
const constants_1 = require("../constants");
const base_1 = require("./base");
/**
 * Model for field definitions with validation and metadata
 */
class FieldModel extends base_1.BaseModel {
    /**
     * Get the field information for use in model creation
     */
    get fieldInfo() {
        const info = {};
        const dump = this.cleanDump();
        // Copy all non-undefined values
        for (const [key, value] of Object.entries(dump)) {
            if (value !== constants_1.UNDEFINED) {
                info[key] = value;
            }
        }
        // Set annotation if provided
        if (this.annotation !== constants_1.UNDEFINED) {
            info.type = this.annotation;
        }
        return info;
    }
    /**
     * Get the field validator configuration
     */
    get fieldValidator() {
        if (this.validator === constants_1.UNDEFINED) {
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
    constructor(data = {}) {
        super(data);
        this.default = constants_1.UNDEFINED;
        this.defaultFactory = constants_1.UNDEFINED;
        this.title = constants_1.UNDEFINED;
        this.description = constants_1.UNDEFINED;
        this.examples = constants_1.UNDEFINED;
        this.validators = constants_1.UNDEFINED;
        this.exclude = constants_1.UNDEFINED;
        this.deprecated = constants_1.UNDEFINED;
        this.frozen = constants_1.UNDEFINED;
        this.alias = constants_1.UNDEFINED;
        this.aliasPriority = constants_1.UNDEFINED;
        this.annotation = constants_1.UNDEFINED;
        this.validator = constants_1.UNDEFINED;
        this.validatorKwargs = {};
        if (!data.name) {
            throw new Error('Field name is required');
        }
    }
}
exports.FieldModel = FieldModel;
__decorate([
    (0, base_1.Field)({
        type: 'any',
        description: 'Default value for the field'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "default", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'function',
        description: 'Factory function for default value'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "defaultFactory", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'string',
        description: 'Title of the field'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "title", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'string',
        description: 'Description of the field'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "description", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'array',
        description: 'Example values for the field'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "examples", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'array',
        description: 'Validation functions for the field'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "validators", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'boolean',
        description: 'Whether to exclude this field from serialization'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "exclude", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'boolean',
        description: 'Whether this field is deprecated'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "deprecated", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'boolean',
        description: 'Whether this field is frozen (immutable)'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "frozen", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'string',
        description: 'Alias for the field name'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "alias", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'number',
        description: 'Priority for alias resolution'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "aliasPriority", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'string',
        description: 'Name of the field',
        required: true
    }),
    __metadata("design:type", String)
], FieldModel.prototype, "name", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'any',
        description: 'Type annotation for the field'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "annotation", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'function',
        description: 'Validator function for the field'
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "validator", void 0);
__decorate([
    (0, base_1.Field)({
        type: 'object',
        description: 'Additional arguments for the validator',
        defaultFactory: () => ({})
    }),
    __metadata("design:type", Object)
], FieldModel.prototype, "validatorKwargs", void 0);
