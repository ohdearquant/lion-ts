"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_CONFIG = void 0;
// Re-export everything from parse constants
__exportStar(require("./parse"), exports);
// Re-export base types
__exportStar(require("../types/base"), exports);
// Re-export undefined types and constants
__exportStar(require("../types/undefined"), exports);
// Common configuration
exports.COMMON_CONFIG = {
    populateByName: true,
    arbitraryTypesAllowed: true,
    useEnumValues: true,
};
