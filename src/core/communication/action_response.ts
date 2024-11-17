import { ID, Any, Note } from '../../core/typing';
import { copy } from '../../libs/utils';
import { ActionRequest } from './action_request';
import { MessageFlag, MessageRole, RoledMessage } from './message';

function prepareActionResponseContent(actionRequest: ActionRequest, output: Any): Note {
    return new Note({
        action_request_id: actionRequest.ln_id,
        action_response: {
            function: actionRequest.function,
            arguments: actionRequest.arguments,
            output: output
        }
    });
}

export class ActionResponse extends RoledMessage {
    constructor(
        actionRequest: ID<ActionRequest>,
        output: Any = null,
        protectedInitParams: Record<string, any> = null
    ) {
        const messageFlags = [actionRequest, output];

        if (messageFlags.every(flag => flag === MessageFlag.MESSAGE_LOAD)) {
            protectedInitParams = protectedInitParams || {};
            super(protectedInitParams);
            return;
        }

        if (messageFlags.every(flag => flag === MessageFlag.MESSAGE_CLONE)) {
            super({ role: MessageRole.ASSISTANT });
            return;
        }

        super({
            role: MessageRole.ASSISTANT,
            recipient: actionRequest.sender,
            sender: actionRequest.recipient,
            content: prepareActionResponseContent(actionRequest, output)
        });

        actionRequest.content.action_response_id = this.ln_id;
    }

    get function(): string {
        return copy(this.content.get(['action_response', 'function']));
    }

    get arguments(): Record<string, any> {
        return copy(this.content.get(['action_response', 'arguments']));
    }

    get output(): Any {
        return this.content.get(['action_response', 'output']);
    }

    get response(): Record<string, any> {
        return copy(this.content.get('action_response', {}));
    }

    get actionRequestId(): ID<ActionRequest> | null {
        return copy(this.content.get('action_request_id', null));
    }

    protected _formatContent(): Record<string, any> {
        return {
            role: this.role.value,
            content: this.response
        };
    }
}
