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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VERSION = exports.Settings = exports.Branch = exports.logger = void 0;
const dotenv_1 = require("dotenv");
const winston_1 = __importDefault(require("winston"));
const version_1 = require("./version");
Object.defineProperty(exports, "VERSION", { enumerable: true, get: function () { return version_1.VERSION; } });
// Load environment variables
(0, dotenv_1.config)();
// Setup logger
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
        })
    ]
});
// Export core components
var session_1 = require("./core/session");
Object.defineProperty(exports, "Branch", { enumerable: true, get: function () { return session_1.Branch; } });
// Export types and interfaces
__exportStar(require("./types/configs"), exports);
__exportStar(require("./core/types"), exports);
// Export utilities
__exportStar(require("./utils/id"), exports);
// Export constants and settings
var system_1 = require("./constants/system");
Object.defineProperty(exports, "Settings", { enumerable: true, get: function () { return system_1.Settings; } });
// Set default log level
exports.logger.level = 'info';
