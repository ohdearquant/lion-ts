"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Branch = void 0;
const index_1 = require("../index");
const system_1 = require("../constants/system");
const id_1 = require("../utils/id");
class MessageLogger {
    constructor(config) {
        this.messages = [];
        this.config = config;
    }
    log(message) {
        this.messages.push({
            ...message,
            timestamp: message.timestamp || new Date(),
            ln_id: message.ln_id || (0, id_1.generateMessageId)()
        });
    }
    async save() {
        // TODO: Implement file-based logging
        index_1.logger.info(`Saving ${this.messages.length} messages to ${this.config.persistDir}`);
    }
    clear() {
        this.messages = [];
    }
}
class ActionLogger {
    constructor(config) {
        this.actions = [];
        this.config = config;
    }
    log(action) {
        this.actions.push({
            ...action,
            timestamp: action.timestamp || new Date(),
            ln_id: action.ln_id || (0, id_1.generateActionId)()
        });
    }
    async save() {
        // TODO: Implement file-based logging
        index_1.logger.info(`Saving ${this.actions.length} actions to ${this.config.persistDir}`);
    }
    clear() {
        this.actions = [];
    }
}
class Branch {
    constructor(options = {}) {
        this.id = (0, id_1.generateBranchId)();
        this.config = this.mergeConfig(system_1.DEFAULT_BRANCH_CONFIG, options);
        this.messageLogger = new MessageLogger(this.config.messageLogConfig);
        this.actionLogger = new ActionLogger(this.config.actionLogConfig);
        this.tools = new Map();
        if (this.config.autoRegisterTools) {
            this.registerDefaultTools();
        }
    }
    mergeConfig(defaultConfig, options) {
        const merged = {
            name: options.name ?? defaultConfig.name,
            user: options.user ?? defaultConfig.user,
            messageConfig: {
                ...defaultConfig.messageConfig,
                ...(options.messageConfig || {})
            },
            messageLogConfig: {
                ...defaultConfig.messageLogConfig,
                ...(options.messageLogConfig || {})
            },
            actionLogConfig: {
                ...defaultConfig.actionLogConfig,
                ...(options.actionLogConfig || {})
            },
            autoRegisterTools: options.autoRegisterTools ?? defaultConfig.autoRegisterTools,
            actionCallConfig: {
                ...defaultConfig.actionCallConfig,
                ...(options.actionCallConfig || {})
            },
            imodelConfig: {
                ...defaultConfig.imodelConfig,
                ...(options.imodelConfig || {})
            },
            retryImodelConfig: {
                ...defaultConfig.retryImodelConfig,
                ...(options.retryImodelConfig || {})
            }
        };
        return merged;
    }
    registerDefaultTools() {
        // TODO: Implement default tools registration
        index_1.logger.info('Registering default tools');
    }
    async processMessage(content, metadata = {}) {
        const message = {
            content,
            metadata,
            timestamp: new Date(),
            ln_id: (0, id_1.generateMessageId)()
        };
        this.messageLogger.log(message);
        return message;
    }
    async executeAction(name, args = {}) {
        const action = {
            name,
            args,
            timestamp: new Date(),
            ln_id: (0, id_1.generateActionId)()
        };
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool '${name}' not found`);
        }
        try {
            const result = await tool(args);
            action.result = result;
            this.actionLogger.log(action);
            return result;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            action.result = { error: errorMessage };
            this.actionLogger.log(action);
            throw new Error(`Action '${name}' failed: ${errorMessage}`);
        }
    }
    registerTool(name, handler) {
        this.tools.set(name, handler);
    }
    async save() {
        await Promise.all([
            this.messageLogger.save(),
            this.actionLogger.save()
        ]);
    }
    clear() {
        this.messageLogger.clear();
        this.actionLogger.clear();
    }
}
exports.Branch = Branch;
