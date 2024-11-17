import { ID, Any, JsonValue } from '../../core/typing';
import { toStr } from '../../libs/parse';
import { MessageFlag, MessageRole, RoledMessage } from './message';
import { formatSystemContent, validateSenderRecipient } from './utils';

export class System extends RoledMessage {
    constructor(
        system: JsonValue = null,
        sender: ID.SenderRecipient = null,
        recipient: ID.SenderRecipient = null,
        systemDatetime: boolean | JsonValue = null,
        protectedInitParams: Record<string, any> = null
    ) {
        if ([system, sender, recipient, systemDatetime].every(x => x === MessageFlag.MESSAGE_LOAD)) {
            super(protectedInitParams);
            return;
        }

        if ([system, sender, recipient, systemDatetime].every(x => x === MessageFlag.MESSAGE_CLONE)) {
            super({ role: MessageRole.SYSTEM });
            return;
        }

        super({
            role: MessageRole.SYSTEM,
            sender: sender || 'system',
            content: formatSystemContent(systemDatetime, system),
            recipient: recipient || 'N/A'
        });
    }

    update(
        system: JsonValue = null,
        sender: ID.SenderRecipient = null,
        recipient: ID.Ref = null,
        systemDatetime: boolean | string = null
    ): void {
        if (system) {
            this.content = formatSystemContent(systemDatetime, system);
        }
        if (sender) {
            this.sender = validateSenderRecipient(sender);
        }
        if (recipient) {
            this.recipient = validateSenderRecipient(recipient);
        }
    }

    get systemInfo(): string {
        if ('system_datetime' in this.content) {
            const msg = `System datetime: ${this.content['system_datetime']}\n\n`;
            return msg + `${this.content['system']}`;
        }

        return toStr(this.content['system']);
    }

    protected _formatContent(): Record<string, any> {
        return {
            role: this.role.value,
            content: this.systemInfo
        };
    }
}
