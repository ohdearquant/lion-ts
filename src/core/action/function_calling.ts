import * as asyncio from 'asyncio';
import { override } from 'lion/core/typing';
import { Field, PrivateAttr } from 'lion/core/typing';
import { CallDecorator as cd, tcall } from 'lion/libs/func';
import { TimedFuncCallConfig } from 'lion/settings';
import { EventStatus, ObservableAction } from './base';
import { Tool } from './tool';

type Any = any;

class FunctionCalling extends ObservableAction {
  funcTool: Tool | null = Field(default=null, exclude=true);
  private _contentFields: string[] = ['executionResponse', 'arguments', 'function'];
  arguments: { [key: string]: Any } | null = null;
  function: string | null = null;

  constructor(
    funcTool: Tool,
    arguments: { [key: string]: Any },
    timedConfig: { [key: string]: Any } | TimedFuncCallConfig = null,
    ...kwargs: Any[]
  ) {
    super(timedConfig, ...kwargs);
    this.funcTool = funcTool;
    this.arguments = arguments || {};
    this.function = this.funcTool.functionName;
  }

  @override
  async invoke(): Promise<Any> {
    const start = asyncio.get_event_loop().time();
    try {
      const _inner = cd.pre_post_process(
        async (kwargs: { [key: string]: Any }) => {
          const config = this._timedConfig.toDict();
          const result = await tcall(this.funcTool!.function, { ...kwargs, ...config });
          if (Array.isArray(result) && result.length === 2) {
            return result[0];
          }
          return result;
        },
        this.funcTool!.preProcessor,
        this.funcTool!.postProcessor,
        this.funcTool!.preProcessorKwargs || {},
        this.funcTool!.postProcessorKwargs || {}
      );

      const result = await _inner(this.arguments);
      this.executionResponse = result;
      this.executionTime = asyncio.get_event_loop().time() - start;
      this.status = EventStatus.COMPLETED;

      if (this.funcTool!.parser !== null) {
        if (asyncio.iscoroutinefunction(this.funcTool!.parser)) {
          result = await this.funcTool!.parser(result);
        } else {
          result = this.funcTool!.parser(result);
        }
      }
      return result;
    } catch (e) {
      this.status = EventStatus.FAILED;
      this.executionError = e.toString();
      this.executionTime = asyncio.get_event_loop().time() - start;
      return null;
    }
  }

  toString(): string {
    return `${this.funcTool!.functionName}(${JSON.stringify(this.arguments)})`;
  }

  toJSON(): string {
    return JSON.stringify({
      function: this.funcTool!.functionName,
      arguments: this.arguments
    });
  }
}

export { FunctionCalling };
