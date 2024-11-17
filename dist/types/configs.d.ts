export interface TimedFuncCallConfig {
    initialDelay: number;
    retryTimeout: number | null;
    retryTiming: boolean;
    errorMsg: string | null;
    errorMap: Record<string, string> | null;
}
export interface RetryConfig {
    numRetries: number;
    initialDelay: number;
    retryDelay: number;
    backoffFactor: number;
    retryTimeout: number | null;
    retryTiming: boolean;
    verboseRetry: boolean;
    errorMsg: string | null;
    errorMap: Record<string, string> | null;
}
export interface iModelConfig {
    provider: string;
    task: string;
    model: string;
    apiKey: string;
}
export interface MessageConfig {
    validationMode: 'raise' | 'warn' | 'ignore';
    autoRetries: boolean;
    maxRetries: number;
    allowActions: boolean;
    autoInvokeAction: boolean;
}
export interface LogConfig {
    persistDir: string;
    subfolder: string;
    filePrefix: string;
    capacity: number;
    autoSaveOnExit: boolean;
    clearAfterDump: boolean;
    useTimestamp: boolean;
    extension: string;
}
export interface BranchConfig {
    name: string | null;
    user: string | null;
    messageLogConfig: LogConfig;
    actionLogConfig: LogConfig;
    messageConfig: MessageConfig;
    autoRegisterTools: boolean;
    actionCallConfig: TimedFuncCallConfig;
    imodelConfig: iModelConfig;
    retryImodelConfig: iModelConfig;
}
