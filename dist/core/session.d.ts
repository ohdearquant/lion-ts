import { BranchOptions, Message } from './types';
export declare class Branch {
    private config;
    private messageLogger;
    private actionLogger;
    private tools;
    readonly id: string;
    constructor(options?: BranchOptions);
    private mergeConfig;
    private registerDefaultTools;
    processMessage(content: string, metadata?: Record<string, any>): Promise<Message>;
    executeAction(name: string, args?: Record<string, any>): Promise<any>;
    registerTool(name: string, handler: Function): void;
    save(): Promise<void>;
    clear(): void;
}
