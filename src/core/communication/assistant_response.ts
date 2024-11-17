import { ID, Any, BaseModel, JsonValue, Note } from '../../core/typing';
import { toStr } from '../../libs/parse';
import { copy } from '../../libs/utils';
import { MessageFlag, MessageRole, RoledMessage } from './message';

function prepareAssistantResponse(assistantResponse: BaseModel | BaseModel[] | Record<string, any> | string | Any): Note {
    const content = new Note();
    if (assistantResponse) {
        if (assistantResponse instanceof BaseModel) {
            content['assistant_response'] = assistantResponse.choices[0].message.content || '';
            content['model_response'] = assistantResponse.modelDump({ excludeNone: true, excludeUnset: true });
        } else if (Array.isArray(assistantResponse)) {
            const msg = assistantResponse.map(i => i.choices[0].delta.content || '').join('');
            content['assistant_response'] = msg;
            content['model_response'] = assistantResponse.map(i => i.modelDump({ excludeNone: true, excludeUnset: true }));
        } else if (typeof assistantResponse === 'object' && 'content' in assistantResponse) {
            content['assistant_response'] = assistantResponse['content'];
        } else if (typeof assistantResponse === 'string') {
            content['assistant_response'] = assistantResponse;
        } else {
            content['assistant_response'] = toStr(assistantResponse);
        }
    } else {
        content['assistant_response'] = '';
    }
    return content;
}

export class AssistantResponse extends RoledMessage {
    constructor(
        assistantResponse: BaseModel | JsonValue | MessageFlag,
        sender: ID.Ref | MessageFlag,
        recipient: ID.Ref | MessageFlag,
        protectedInitParams: Record<string, any> = null
    ) {
        const messageFlags = [assistantResponse, sender, recipient];

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
            sender: sender || 'N/A',
            recipient: recipient
        });

        const content = prepareAssistantResponse(assistantResponse);
        if ('model_response' in content) {
            this.metadata['model_response'] = content['model_response'];
            delete content['model_response'];
        }
        this.content = content;
    }

    get response(): string {
        return copy(this.content['assistant_response']);
    }

    get modelResponse(): Record<string, any> | Record<string, any>[] {
        return copy(this.metadata['model_response'] || {});
    }

    protected _formatContent(): Record<string, any> {
        return {
            role: this.role.value,
            content: this.response
        };
    }
}
