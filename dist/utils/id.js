"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStepId = exports.generateBranchId = exports.generateActionId = exports.generateMessageId = exports.generateId = void 0;
const uuid_1 = require("uuid");
const generateId = (prefix = '') => {
    const uuid = (0, uuid_1.v4)();
    return prefix ? `${prefix}_${uuid}` : uuid;
};
exports.generateId = generateId;
const generateMessageId = () => (0, exports.generateId)('msg');
exports.generateMessageId = generateMessageId;
const generateActionId = () => (0, exports.generateId)('act');
exports.generateActionId = generateActionId;
const generateBranchId = () => (0, exports.generateId)('branch');
exports.generateBranchId = generateBranchId;
const generateStepId = () => (0, exports.generateId)('step');
exports.generateStepId = generateStepId;
