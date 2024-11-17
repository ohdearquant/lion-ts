import { Element, Log } from 'lion/core/generic';
import { Any, Enum, NoReturn, PrivateAttr, override } from 'lion/core/typing';
import { Settings, TimedFuncCallConfig } from 'lion/settings';

enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

class ObservableAction extends Element {
  status: EventStatus = EventStatus.PENDING;
  executionTime: number | null = null;
  executionResponse: Any = null;
  executionError: string | null = null;
  private _timedConfig: TimedFuncCallConfig | null = null;
  private _contentFields: string[] = ['executionResponse'];

  @override
  constructor(timedConfig: Record<string, any> | TimedFuncCallConfig | null, ...kwargs: any[]) {
    super();
    if (timedConfig === null) {
      this._timedConfig = Settings.Config.TIMED_CALL;
    } else {
      if (timedConfig instanceof TimedFuncCallConfig) {
        timedConfig = timedConfig.toDict();
      }
      if (typeof timedConfig === 'object') {
        timedConfig = { ...timedConfig, ...kwargs };
      }
      this._timedConfig = new TimedFuncCallConfig(timedConfig);
    }
  }

  toLog(): Log {
    const dict_ = this.toDict();
    dict_['status'] = this.status;
    const content = this._contentFields.reduce((acc, field) => {
      if (dict_[field] !== undefined) {
        acc[field] = dict_[field];
      }
      return acc;
    }, {} as Record<string, any>);
    const loginfo = Object.keys(dict_).reduce((acc, key) => {
      if (!this._contentFields.includes(key)) {
        acc[key] = dict_[key];
      }
      return acc;
    }, {} as Record<string, any>);
    return new Log(content, loginfo);
  }

  static fromDict(data: Record<string, any>, ...kwargs: any[]): NoReturn {
    throw new Error("An event cannot be recreated. Once it's done, it's done.");
  }
}

export { ObservableAction, EventStatus };
