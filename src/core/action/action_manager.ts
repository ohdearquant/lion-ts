import { LogManager } from 'lion/core/generic/log_manager';
import { toDict, toList } from 'lion/libs/parse';
import { ActionRequest } from 'lion/core/communication/action_request';
import { FunctionCalling } from 'lion/core/action/function_calling';
import { Tool, funcToTool } from 'lion/core/action/tool';
import { ActionRequestModel } from 'lion/protocols/operatives/action';

type Any = any;
type Functool = Tool | ((...args: any[]) => Any);
type FindableTool = Functool | string;
type InputtableTool = { [key: string]: Any } | boolean | FindableTool;
type ToolType = FindableTool | FindableTool[] | InputtableTool;

export class ActionManager {
  registry: { [key: string]: Tool };
  logger: LogManager;

  constructor(registry: { [key: string]: Tool } | null = null, logger: LogManager | null = null) {
    this.registry = registry || {};
    this.logger = logger || new LogManager();
  }

  contains(tool: FindableTool): boolean {
    if (tool instanceof Tool) {
      return tool.functionName in this.registry;
    } else if (typeof tool === 'string') {
      return tool in this.registry;
    } else if (typeof tool === 'function') {
      return tool.name in this.registry;
    }
    return false;
  }

  registerTool(tool: Functool, update: boolean = false): void {
    if (!update && this.contains(tool)) {
      let name: string | undefined;
      if (tool instanceof Tool) {
        name = tool.functionName;
      } else if (typeof tool === 'function') {
        name = tool.name;
      }
      throw new Error(`Tool ${name} is already registered.`);
    }

    if (typeof tool === 'function') {
      tool = funcToTool(tool)[0];
    }
    if (!(tool instanceof Tool)) {
      throw new TypeError('Please register a Tool object or callable.');
    }

    this.registry[tool.functionName] = tool;
  }

  registerTools(tools: Functool[] | Functool, update: boolean = false): void {
    const toolsList = Array.isArray(tools) ? tools : [tools];
    toolsList.forEach(tool => this.registerTool(tool, update));
  }

  matchTool(funcCall: any): FunctionCalling {
    if (Array.isArray(funcCall)) {
      return this.matchToolTuple(funcCall);
    } else if (typeof funcCall === 'object') {
      return this.matchToolDict(funcCall);
    } else if (funcCall instanceof ActionRequest || funcCall instanceof ActionRequestModel) {
      return this.matchToolActionRequest(funcCall);
    } else if (typeof funcCall === 'string') {
      return this.matchToolString(funcCall);
    } else {
      throw new TypeError(`Unsupported type ${typeof funcCall}`);
    }
  }

  private matchToolTuple(funcCall: [string, any]): FunctionCalling {
    if (funcCall.length === 2) {
      const [functionName, arguments_] = funcCall;
      const tool = this.registry[functionName];
      if (!tool) {
        throw new Error(`Function ${functionName} is not registered`);
      }
      return new FunctionCalling(tool, arguments_);
    } else {
      throw new Error(`Invalid function call ${funcCall}`);
    }
  }

  private matchToolDict(funcCall: { [key: string]: any }): FunctionCalling {
    if (funcCall.function && funcCall.arguments) {
      const { function: functionName, arguments: arguments_ } = funcCall;
      const tool = this.registry[functionName];
      if (!tool) {
        throw new Error(`Function ${functionName} is not registered`);
      }
      return new FunctionCalling(tool, arguments_);
    } else {
      throw new Error(`Invalid function call ${funcCall}`);
    }
  }

  private matchToolActionRequest(funcCall: ActionRequest | ActionRequestModel): FunctionCalling {
    const tool = this.registry[funcCall.function];
    if (!tool) {
      throw new Error(`Function ${funcCall.function} is not registered.`);
    }
    return new FunctionCalling(tool, funcCall.arguments);
  }

  private matchToolString(funcCall: string): FunctionCalling {
    let call: any;
    try {
      call = toDict(funcCall, 'json', true);
    } catch (e) {
      throw new Error(`Invalid function call ${funcCall}`);
    }

    if (typeof call === 'object') {
      return this.matchTool(call);
    } else {
      throw new Error(`Invalid function call ${funcCall}`);
    }
  }

  async invoke(funcCall: { [key: string]: any } | string | ActionRequest, logManager: LogManager | null = null): Promise<any> {
    const functionCalling = this.matchTool(funcCall);
    const result = await functionCalling.invoke();
    await this.logger.alog(functionCalling.toLog());
    return result;
  }

  get schemaList(): { [key: string]: any }[] {
    return Object.values(this.registry).map(tool => tool.schema_);
  }

  getToolSchema(tools: ToolType = false, ...kwargs: any[]): { [key: string]: any } {
    let toolKwarg: { [key: string]: any };
    if (typeof tools === 'boolean') {
      toolKwarg = tools ? { tools: this.schemaList } : {};
    } else {
      toolKwarg = { tools: this._getToolSchema(tools) };
    }
    return { ...toolKwarg, ...kwargs };
  }

  private _getToolSchema(tool: any): { [key: string]: any } | { [key: string]: any }[] {
    if (typeof tool === 'object') {
      return tool;
    } else if (typeof tool === 'function') {
      const name = tool.name;
      if (name in this.registry) {
        return this.registry[name].schema_;
      } else {
        throw new Error(`Tool ${name} is not registered.`);
      }
    } else if (tool instanceof Tool || typeof tool === 'string') {
      const name = tool instanceof Tool ? tool.functionName : tool;
      if (name in this.registry) {
        return this.registry[name].schema_;
      } else {
        throw new Error(`Tool ${name} is not registered.`);
      }
    } else if (Array.isArray(tool)) {
      return tool.map(t => this._getToolSchema(t));
    } else {
      throw new TypeError(`Unsupported type ${typeof tool}`);
    }
  }
}
