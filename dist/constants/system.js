"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = exports.BASE_LION_FIELDS = exports.DEFAULT_TIMEZONE = exports.DEFAULT_BRANCH_CONFIG = exports.DEFAULT_ACTION_LOG_CONFIG = exports.DEFAULT_MESSAGE_LOG_CONFIG = exports.DEFAULT_MESSAGE_CONFIG = exports.DEFAULT_RETRY_IMODEL_CONFIG = exports.DEFAULT_CHAT_CONFIG = exports.DEFAULT_RETRY_CONFIG = exports.DEFAULT_TIMED_FUNC_CALL_CONFIG = exports.BaseSystemFields = void 0;
var BaseSystemFields;
(function (BaseSystemFields) {
    BaseSystemFields["LN_ID"] = "ln_id";
    BaseSystemFields["TIMESTAMP"] = "timestamp";
    BaseSystemFields["METADATA"] = "metadata";
    BaseSystemFields["EXTRA_FIELDS"] = "extra_fields";
    BaseSystemFields["CONTENT"] = "content";
    BaseSystemFields["CREATED"] = "created";
    BaseSystemFields["EMBEDDING"] = "embedding";
})(BaseSystemFields || (exports.BaseSystemFields = BaseSystemFields = {}));
exports.DEFAULT_TIMED_FUNC_CALL_CONFIG = {
    initialDelay: 0,
    retryTimeout: null,
    retryTiming: false,
    errorMsg: null,
    errorMap: null
};
exports.DEFAULT_RETRY_CONFIG = {
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
exports.DEFAULT_CHAT_CONFIG = {
    provider: 'openai',
    task: 'chat',
    model: 'gpt-4o',
    apiKey: 'OPENAI_API_KEY'
};
exports.DEFAULT_RETRY_IMODEL_CONFIG = {
    provider: 'openai',
    task: 'chat',
    model: 'gpt-4o-mini',
    apiKey: 'OPENAI_API_KEY'
};
exports.DEFAULT_MESSAGE_CONFIG = {
    validationMode: 'raise',
    autoRetries: false,
    maxRetries: 0,
    allowActions: true,
    autoInvokeAction: true
};
exports.DEFAULT_MESSAGE_LOG_CONFIG = {
    persistDir: './data/logs',
    subfolder: 'messages',
    filePrefix: 'message_',
    capacity: 128,
    autoSaveOnExit: true,
    clearAfterDump: true,
    useTimestamp: true,
    extension: '.csv'
};
exports.DEFAULT_ACTION_LOG_CONFIG = {
    persistDir: './data/logs',
    subfolder: 'actions',
    filePrefix: 'action_',
    capacity: 128,
    autoSaveOnExit: true,
    clearAfterDump: true,
    useTimestamp: true,
    extension: '.csv'
};
exports.DEFAULT_BRANCH_CONFIG = {
    name: null,
    user: null,
    messageLogConfig: exports.DEFAULT_MESSAGE_LOG_CONFIG,
    actionLogConfig: exports.DEFAULT_ACTION_LOG_CONFIG,
    messageConfig: exports.DEFAULT_MESSAGE_CONFIG,
    autoRegisterTools: true,
    actionCallConfig: exports.DEFAULT_TIMED_FUNC_CALL_CONFIG,
    imodelConfig: exports.DEFAULT_CHAT_CONFIG,
    retryImodelConfig: exports.DEFAULT_RETRY_IMODEL_CONFIG
};
// Using UTC timezone by default
exports.DEFAULT_TIMEZONE = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
exports.BASE_LION_FIELDS = new Set(Object.values(BaseSystemFields));
class Settings {
}
exports.Settings = Settings;
Settings.Config = {
    RETRY: exports.DEFAULT_RETRY_CONFIG,
    TIMED_CALL: exports.DEFAULT_TIMED_FUNC_CALL_CONFIG,
    TIMEZONE: exports.DEFAULT_TIMEZONE
};
Settings.Branch = {
    BRANCH: exports.DEFAULT_BRANCH_CONFIG
};
Settings.iModel = {
    CHAT: { model: 'openai/gpt-4o' },
    PARSE: exports.DEFAULT_CHAT_CONFIG
};
