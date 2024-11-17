import {
  BranchConfig,
  MessageConfig,
  RetryConfig,
  TimedFuncCallConfig,
  iModelConfig,
  LogConfig
} from '../types/configs';

export enum BaseSystemFields {
  LN_ID = 'ln_id',
  TIMESTAMP = 'timestamp',
  METADATA = 'metadata',
  EXTRA_FIELDS = 'extra_fields',
  CONTENT = 'content',
  CREATED = 'created',
  EMBEDDING = 'embedding'
}

export const DEFAULT_TIMED_FUNC_CALL_CONFIG: TimedFuncCallConfig = {
  initialDelay: 0,
  retryTimeout: null,
  retryTiming: false,
  errorMsg: null,
  errorMap: null
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  numRetries: 0,
  initialDelay: 0,
  retryDelay: 0,
  backoffFactor: 1,
  retryTimeout: null,
  retryTiming: false,
  verboseRetry: false,
  errorMsg: null,
  errorMap: null
};

export const DEFAULT_CHAT_CONFIG: iModelConfig = {
  provider: 'openai',
  task: 'chat',
  model: 'gpt-4o',
  apiKey: 'OPENAI_API_KEY'
};

export const DEFAULT_RETRY_IMODEL_CONFIG: iModelConfig = {
  provider: 'openai',
  task: 'chat',
  model: 'gpt-4o-mini',
  apiKey: 'OPENAI_API_KEY'
};

export const DEFAULT_MESSAGE_CONFIG: MessageConfig = {
  validationMode: 'raise',
  autoRetries: false,
  maxRetries: 0,
  allowActions: true,
  autoInvokeAction: true
};

export const DEFAULT_MESSAGE_LOG_CONFIG: LogConfig = {
  persistDir: './data/logs',
  subfolder: 'messages',
  filePrefix: 'message_',
  capacity: 128,
  autoSaveOnExit: true,
  clearAfterDump: true,
  useTimestamp: true,
  extension: '.csv'
};

export const DEFAULT_ACTION_LOG_CONFIG: LogConfig = {
  persistDir: './data/logs',
  subfolder: 'actions',
  filePrefix: 'action_',
  capacity: 128,
  autoSaveOnExit: true,
  clearAfterDump: true,
  useTimestamp: true,
  extension: '.csv'
};

export const DEFAULT_BRANCH_CONFIG: BranchConfig = {
  name: null,
  user: null,
  messageLogConfig: DEFAULT_MESSAGE_LOG_CONFIG,
  actionLogConfig: DEFAULT_ACTION_LOG_CONFIG,
  messageConfig: DEFAULT_MESSAGE_CONFIG,
  autoRegisterTools: true,
  actionCallConfig: DEFAULT_TIMED_FUNC_CALL_CONFIG,
  imodelConfig: DEFAULT_CHAT_CONFIG,
  retryImodelConfig: DEFAULT_RETRY_IMODEL_CONFIG
};

// Using UTC timezone by default
export const DEFAULT_TIMEZONE = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
export const BASE_LION_FIELDS = new Set(Object.values(BaseSystemFields));

export class Settings {
  static readonly Config = {
    RETRY: DEFAULT_RETRY_CONFIG,
    TIMED_CALL: DEFAULT_TIMED_FUNC_CALL_CONFIG,
    TIMEZONE: DEFAULT_TIMEZONE
  };

  static readonly Branch = {
    BRANCH: DEFAULT_BRANCH_CONFIG
  };

  static readonly iModel = {
    CHAT: { model: 'openai/gpt-4o' },
    PARSE: DEFAULT_CHAT_CONFIG
  };
}
