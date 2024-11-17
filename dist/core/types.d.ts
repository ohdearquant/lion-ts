import { MessageConfig, LogConfig } from '../types/configs';
export interface Message {
    content: string;
    metadata?: Record<string, any>;
    extraFields?: Record<string, any>;
    timestamp?: Date;
    ln_id?: string;
}
export interface Action {
    name: string;
    args?: Record<string, any>;
    result?: any;
    timestamp?: Date;
    ln_id?: string;
}
export interface BranchOptions {
    name?: string | null;
    user?: string | null;
    messageConfig?: Partial<MessageConfig>;
    messageLogConfig?: Partial<LogConfig>;
    actionLogConfig?: Partial<LogConfig>;
    autoRegisterTools?: boolean;
    actionCallConfig?: {
        initialDelay?: number;
        retryTimeout?: number | null;
        retryTiming?: boolean;
        errorMsg?: string | null;
        errorMap?: Record<string, string> | null;
    };
    imodelConfig?: {
        provider?: string;
        task?: string;
        model?: string;
        apiKey?: string;
    };
    retryImodelConfig?: {
        provider?: string;
        task?: string;
        model?: string;
        apiKey?: string;
    };
}
export interface MessageHandler {
    handle(message: Message): Promise<Message>;
}
export interface ActionHandler {
    handle(action: Action): Promise<any>;
}
export interface Logger {
    log(data: any): void;
    save(): Promise<void>;
    clear(): void;
}
