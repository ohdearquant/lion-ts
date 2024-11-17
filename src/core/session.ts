import { logger } from '../index';
import { DEFAULT_BRANCH_CONFIG } from '../constants/system';
import { BranchConfig } from '../types/configs';
import { Action, BranchOptions, Message, Logger } from './types';
import { generateMessageId, generateActionId, generateBranchId } from '../utils/id';

class MessageLogger implements Logger {
  private messages: Message[] = [];
  private config: BranchConfig['messageLogConfig'];

  constructor(config: BranchConfig['messageLogConfig']) {
    this.config = config;
  }

  log(message: Message): void {
    this.messages.push({
      ...message,
      timestamp: message.timestamp || new Date(),
      ln_id: message.ln_id || generateMessageId()
    });
  }

  async save(): Promise<void> {
    // TODO: Implement file-based logging
    logger.info(`Saving ${this.messages.length} messages to ${this.config.persistDir}`);
  }

  clear(): void {
    this.messages = [];
  }
}

class ActionLogger implements Logger {
  private actions: Action[] = [];
  private config: BranchConfig['actionLogConfig'];

  constructor(config: BranchConfig['actionLogConfig']) {
    this.config = config;
  }

  log(action: Action): void {
    this.actions.push({
      ...action,
      timestamp: action.timestamp || new Date(),
      ln_id: action.ln_id || generateActionId()
    });
  }

  async save(): Promise<void> {
    // TODO: Implement file-based logging
    logger.info(`Saving ${this.actions.length} actions to ${this.config.persistDir}`);
  }

  clear(): void {
    this.actions = [];
  }
}

export class Branch {
  private config: BranchConfig;
  private messageLogger: MessageLogger;
  private actionLogger: ActionLogger;
  private tools: Map<string, Function>;
  readonly id: string;

  constructor(options: BranchOptions = {}) {
    this.id = generateBranchId();
    this.config = this.mergeConfig(DEFAULT_BRANCH_CONFIG, options);
    this.messageLogger = new MessageLogger(this.config.messageLogConfig);
    this.actionLogger = new ActionLogger(this.config.actionLogConfig);
    this.tools = new Map();

    if (this.config.autoRegisterTools) {
      this.registerDefaultTools();
    }
  }

  private mergeConfig(defaultConfig: BranchConfig, options: BranchOptions): BranchConfig {
    const merged: BranchConfig = {
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

  private registerDefaultTools(): void {
    // TODO: Implement default tools registration
    logger.info('Registering default tools');
  }

  async processMessage(content: string, metadata: Record<string, any> = {}): Promise<Message> {
    const message: Message = {
      content,
      metadata,
      timestamp: new Date(),
      ln_id: generateMessageId()
    };

    this.messageLogger.log(message);
    return message;
  }

  async executeAction(name: string, args: Record<string, any> = {}): Promise<any> {
    const action: Action = {
      name,
      args,
      timestamp: new Date(),
      ln_id: generateActionId()
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      action.result = { error: errorMessage };
      this.actionLogger.log(action);
      throw new Error(`Action '${name}' failed: ${errorMessage}`);
    }
  }

  registerTool(name: string, handler: Function): void {
    this.tools.set(name, handler);
  }

  async save(): Promise<void> {
    await Promise.all([
      this.messageLogger.save(),
      this.actionLogger.save()
    ]);
  }

  clear(): void {
    this.messageLogger.clear();
    this.actionLogger.clear();
  }
}
