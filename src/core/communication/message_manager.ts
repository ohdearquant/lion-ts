import { LogManager, Pile, Progression } from '../../core/generic';
import { ID, Any, BaseModel, JsonValue, Literal } from '../../core/typing';
import { ActionRequest } from './action_request';
import { ActionResponse } from './action_response';
import { AssistantResponse } from './assistant_response';
import { Instruction } from './instruction';
import { RoledMessage } from './message';
import { System } from './system';

const DEFAULT_SYSTEM = "You are a helpful AI assistant. Let's think step by step.";

export class MessageManager {
    messages: Pile<RoledMessage>;
    logger: LogManager;
    system: System | null;
    saveOnClear: boolean;

    constructor(messages: RoledMessage[] = [], logger: LogManager = new LogManager(), system: System | null = null, saveOnClear: boolean = true) {
        this.messages = new Pile(messages, { itemType: RoledMessage });
        this.logger = logger;
        this.system = system;
        this.saveOnClear = saveOnClear;
        if (this.system) {
            this.addMessage({ system: this.system });
        }
    }

    setSystem(system: System): void {
        if (!this.system) {
            this.system = system;
            this.messages.insert(0, this.system);
        } else {
            const oldSystem = this.system;
            this.system = system;
            this.messages.insert(0, this.system);
            this.messages.exclude(oldSystem);
        }
    }

    async aclearMessages(): Promise<void> {
        await this.messages.lock(async () => {
            this.clearMessages();
        });
    }

    async aAddMessage(kwargs: Record<string, any>): Promise<RoledMessage> {
        return await this.messages.lock(async () => {
            return this.addMessage(kwargs);
        });
    }

    get progress(): Progression {
        return new Progression({ order: this.messages.items });
    }

    static createInstruction({
        sender = null,
        recipient = null,
        instruction = null,
        context = null,
        guidance = null,
        plainContent = null,
        requestFields = null,
        requestModel = null,
        images = null,
        imageDetail = null,
        toolSchemas = null,
        ...kwargs
    }: {
        sender?: ID.SenderRecipient | null,
        recipient?: ID.SenderRecipient | null,
        instruction?: Instruction | JsonValue | null,
        context?: JsonValue | null,
        guidance?: JsonValue | null,
        plainContent?: string | null,
        requestFields?: string[] | Record<string, Any> | null,
        requestModel?: typeof BaseModel | BaseModel | null,
        images?: any[] | null,
        imageDetail?: Literal<'low' | 'high' | 'auto'> | null,
        toolSchemas?: Record<string, any> | null,
        [key: string]: any
    } = {}): Instruction {
        if (instruction instanceof Instruction) {
            instruction.update(
                context,
                { guidance, requestFields, plainContent, requestModel, images, imageDetail, toolSchemas, ...kwargs }
            );
            if (sender) {
                instruction.sender = sender;
            }
            if (recipient) {
                instruction.recipient = recipient;
            }
            return instruction;
        } else {
            return new Instruction(
                instruction,
                context,
                guidance,
                images,
                sender,
                recipient,
                requestFields,
                plainContent,
                imageDetail,
                requestModel,
                toolSchemas,
                kwargs
            );
        }
    }

    static createAssistantResponse({
        sender = null,
        recipient = null,
        assistantResponse = null
    }: {
        sender?: Any | null,
        recipient?: Any | null,
        assistantResponse?: AssistantResponse | Any | null
    } = {}): AssistantResponse {
        if (assistantResponse instanceof AssistantResponse) {
            if (sender) {
                assistantResponse.sender = sender;
            }
            if (recipient) {
                assistantResponse.recipient = recipient;
            }
            return assistantResponse;
        }

        return new AssistantResponse(
            assistantResponse,
            sender,
            recipient
        );
    }

    static createActionRequest({
        sender = null,
        recipient = null,
        function: functionName = null,
        arguments: args = null,
        actionRequest = null
    }: {
        sender?: ID.SenderRecipient | null,
        recipient?: ID.SenderRecipient | null,
        function?: string | null,
        arguments?: Record<string, Any> | null,
        actionRequest?: ActionRequest | null
    } = {}): ActionRequest {
        if (actionRequest) {
            if (!(actionRequest instanceof ActionRequest)) {
                throw new Error("Error: action request must be an instance of ActionRequest.");
            }
            if (sender) {
                actionRequest.sender = sender;
            }
            if (recipient) {
                actionRequest.recipient = recipient;
            }
            return actionRequest;
        }

        return new ActionRequest(
            functionName,
            args,
            sender,
            recipient
        );
    }

    static createActionResponse({
        actionRequest,
        actionResponse = null
    }: {
        actionRequest: ActionRequest,
        actionResponse?: ActionResponse | Any | null
    }): ActionResponse {
        if (!(actionRequest instanceof ActionRequest)) {
            throw new Error("Error: please provide a corresponding action request for an action response.");
        }

        if (actionResponse) {
            if (actionResponse instanceof ActionResponse) {
                if (actionRequest.isResponded) {
                    throw new Error("Error: action request already has a response.");
                }
                actionRequest.content.action_response_id = actionResponse.ln_id;
                return actionResponse;
            }
        }

        return new ActionResponse(
            actionRequest,
            actionResponse
        );
    }

    static createSystem({
        system = null,
        sender = null,
        recipient = null,
        systemDatetime = null
    }: {
        system?: Any | null,
        sender?: Any | null,
        recipient?: Any | null,
        systemDatetime?: boolean | string | null
    } = {}): System {
        system = system || DEFAULT_SYSTEM;

        if (system instanceof System) {
            system.update({
                sender,
                recipient,
                systemDatetime
            });
            return system;
        }

        return new System(
            system,
            sender,
            recipient,
            systemDatetime
        );
    }

    addMessage({
        sender = null,
        recipient = null,
        instruction = null,
        context = null,
        guidance = null,
        plainContent = null,
        requestFields = null,
        requestModel = null,
        images = null,
        imageDetail = null,
        assistantResponse = null,
        system = null,
        systemDatetime = null,
        function: functionName = null,
        arguments: args = null,
        actionRequest = null,
        actionResponse = null,
        metadata = null
    }: {
        sender?: ID.SenderRecipient | null,
        recipient?: ID.SenderRecipient | null,
        instruction?: Instruction | JsonValue | null,
        context?: JsonValue | null,
        guidance?: JsonValue | null,
        plainContent?: string | null,
        requestFields?: string[] | Record<string, Any> | null,
        requestModel?: typeof BaseModel | BaseModel | null,
        images?: any[] | null,
        imageDetail?: Literal<'low' | 'high' | 'auto'> | null,
        assistantResponse?: AssistantResponse | Any | null,
        system?: System | Any | null,
        systemDatetime?: boolean | string | null,
        function?: string | null,
        arguments?: Record<string, Any> | null,
        actionRequest?: ActionRequest | null,
        actionResponse?: ActionResponse | Any | null,
        metadata?: Record<string, any> | null
    } = {}): RoledMessage {
        let _msg: RoledMessage | null = null;
        if ([instruction, assistantResponse, system].filter(Boolean).length > 1) {
            throw new Error("Only one message type can be added at a time.");
        }

        if (system) {
            _msg = MessageManager.createSystem({
                system,
                sender,
                recipient,
                systemDatetime
            });
            this.setSystem(_msg as System);
        } else if (actionResponse) {
            if (!actionRequest) {
                throw new Error("Error: Action response must have an action request.");
            }
            _msg = MessageManager.createActionResponse({
                actionRequest,
                actionResponse
            });
        } else if (actionRequest || (functionName && args)) {
            _msg = MessageManager.createActionRequest({
                sender,
                recipient,
                function: functionName,
                arguments: args,
                actionRequest
            });
        } else if (assistantResponse) {
            _msg = MessageManager.createAssistantResponse({
                sender,
                recipient,
                assistantResponse
            });
        } else {
            _msg = MessageManager.createInstruction({
                sender,
                recipient,
                instruction,
                context,
                guidance,
                plainContent,
                requestFields,
                requestModel,
                images,
                imageDetail
            });
        }

        if (metadata) {
            _msg.metadata.update('extra', metadata);
        }

        if (this.messages.includes(_msg)) {
            this.messages.update(_msg);
        } else {
            this.messages.include(_msg);
        }

        this.logger.log(_msg.toLog());
        return _msg;
    }

    clearMessages(): void {
        if (this.saveOnClear) {
            this.logger.dump({ clear: true });
        }

        this.messages.clear();
        this.progress.clear();
        if (this.system) {
            this.messages.include(this.system);
            this.progress.insert(0, this.system);
        }
    }

    get lastResponse(): AssistantResponse | null {
        for (let i = this.messages.items.length - 1; i >= 0; i--) {
            if (this.messages.items[i] instanceof AssistantResponse) {
                return this.messages.items[i] as AssistantResponse;
            }
        }
        return null;
    }

    get lastInstruction(): Instruction | null {
        for (let i = this.messages.items.length - 1; i >= 0; i--) {
            if (this.messages.items[i] instanceof Instruction) {
                return this.messages.items[i] as Instruction;
            }
        }
        return null;
    }

    get assistantResponses(): Pile<AssistantResponse> {
        return new Pile(
            this.messages.items.filter(item => item instanceof AssistantResponse) as AssistantResponse[]
        );
    }

    get actionRequests(): Pile<ActionRequest> {
        return new Pile(
            this.messages.items.filter(item => item instanceof ActionRequest) as ActionRequest[]
        );
    }

    get actionResponses(): Pile<ActionResponse> {
        return new Pile(
            this.messages.items.filter(item => item instanceof ActionResponse) as ActionResponse[]
        );
    }

    get instructions(): Pile<Instruction> {
        return new Pile(
            this.messages.items.filter(item => item instanceof Instruction) as Instruction[]
        );
    }

    toChatMsgs(progress: number[] = []): Record<string, any>[] {
        if (progress.length === 0) {
            return [];
        }
        try {
            return progress.map(i => this.messages.items[i].chatMsg);
        } catch (error) {
            throw new Error("Invalid progress, not all requested messages are in the message pile");
        }
    }

    get hasLogs(): boolean {
        return !this.logger.logs.isEmpty();
    }
}
