import { ID, Any, LnID, Note } from '../../core/typing';
import { toDict } from '../../libs/parse';
import { copy } from '../../libs/utils';
import { MessageFlag, MessageRole, RoledMessage } from './message';

function prepareActionRequest(functionName: string | Function, arguments: Record<string, any>): Note {
    let args = copy(arguments);
    if (typeof arguments !== 'object') {
        try {
            arguments = toDict(args, { fuzzyParse: true, strType: 'json', suppress: true });
            if (!arguments) {
                arguments = toDict(args, { strType: 'xml', suppress: true });
            }
            if (!arguments || typeof arguments !== 'object') {
                throw new Error();
            }
        } catch (error) {
            throw new Error('Arguments must be a dictionary.');
        }
    }
    return new Note({
        action_request: {
            function: functionName,
            arguments: arguments
        }
    });
}

export class ActionRequest extends RoledMessage {
    constructor(
        functionName: string | Function | MessageFlag,
        arguments: Record<string, any> | MessageFlag,
        sender: ID.Ref | MessageFlag = null,
        recipient: ID.Ref | MessageFlag = null,
        protectedInitParams: Record<string, any> = null
    ) {
        const messageFlags = [functionName, arguments, sender, recipient];

        if (messageFlags.every(flag => flag === MessageFlag.MESSAGE_LOAD)) {
            protectedInitParams = protectedInitParams || {};
            super(protectedInitParams);
            return;
        }

        if (messageFlags.every(flag => flag === MessageFlag.MESSAGE_CLONE)) {
            super({ role: MessageRole.ASSISTANT });
            return;
        }

        functionName = typeof functionName === 'function' ? functionName.name : functionName;

        super({
            role: MessageRole.ASSISTANT,
            content: prepareActionRequest(functionName, arguments),
            sender: sender,
            recipient: recipient
        });
    }

    get actionResponseId(): LnID | null {
        return this.content.get('action_response_id', null);
    }

    get isResponded(): boolean {
        return this.actionResponseId !== null;
    }

    get request(): Record<string, any> {
        const request = copy(this.content.get('action_request', {}));
        delete request.output;
        return request;
    }

    get arguments(): Record<string, any> {
        return this.request.arguments || {};
    }

    get function(): string {
        return this.request.function || '';
    }

    protected _formatContent(): Record<string, any> {
        return {
            role: this.role.value,
            content: this.request
        };
    }
}
