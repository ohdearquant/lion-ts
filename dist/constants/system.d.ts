import { BranchConfig, MessageConfig, RetryConfig, TimedFuncCallConfig, iModelConfig, LogConfig } from '../types/configs';
export declare enum BaseSystemFields {
    LN_ID = "ln_id",
    TIMESTAMP = "timestamp",
    METADATA = "metadata",
    EXTRA_FIELDS = "extra_fields",
    CONTENT = "content",
    CREATED = "created",
    EMBEDDING = "embedding"
}
export declare const DEFAULT_TIMED_FUNC_CALL_CONFIG: TimedFuncCallConfig;
export declare const DEFAULT_RETRY_CONFIG: RetryConfig;
export declare const DEFAULT_CHAT_CONFIG: iModelConfig;
export declare const DEFAULT_RETRY_IMODEL_CONFIG: iModelConfig;
export declare const DEFAULT_MESSAGE_CONFIG: MessageConfig;
export declare const DEFAULT_MESSAGE_LOG_CONFIG: LogConfig;
export declare const DEFAULT_ACTION_LOG_CONFIG: LogConfig;
export declare const DEFAULT_BRANCH_CONFIG: BranchConfig;
export declare const DEFAULT_TIMEZONE: string;
export declare const BASE_LION_FIELDS: Set<BaseSystemFields>;
export declare class Settings {
    static readonly Config: {
        RETRY: RetryConfig;
        TIMED_CALL: TimedFuncCallConfig;
        TIMEZONE: string;
    };
    static readonly Branch: {
        BRANCH: BranchConfig;
    };
    static readonly iModel: {
        CHAT: {
            model: string;
        };
        PARSE: iModelConfig;
    };
}
