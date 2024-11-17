/**
 * Copyright 2024 HaiyangLi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { fieldSerializer, fieldValidator } from 'pydantic';
import { Component, Log } from '../../core/generic';
import { Any, Communicatable, Enum, Field, Note, override } from '../../core/typing';
import { copy } from '../../libs/utils';
import { getClass } from '../_class_registry';
import { BaseMail } from './base_mail';

export enum MessageRole {
    SYSTEM = 'system',
    USER = 'user',
    ASSISTANT = 'assistant'
}

export enum MessageFlag {
    MESSAGE_CLONE = 'MESSAGE_CLONE',
    MESSAGE_LOAD = 'MESSAGE_LOAD'
}

export enum MessageField {
    TIMESTAMP = 'timestamp',
    LION_CLASS = 'lion_class',
    ROLE = 'role',
    CONTENT = 'content',
    LN_ID = 'ln_id',
    SENDER = 'sender',
    RECIPIENT = 'recipient',
    METADATA = 'metadata'
}

const MESSAGE_FIELDS = Object.values(MessageField);

export class RoledMessage extends Component(BaseMail) {
    content: Note = Field({
        defaultFactory: () => new Note(),
        description: 'The content of the message.'
    });

    role: MessageRole | null = Field({
        default: null,
        description: 'The role of the message in the conversation.',
        examples: ['system', 'user', 'assistant']
    });

    get imageContent(): Array<Record<string, Any>> | null {
        const msg = this.chatMsg;
        if (typeof msg === 'object' && Array.isArray(msg.content)) {
            return msg.content.filter((i: any) => i.type === 'image_url');
        }
        return null;
    }

    get chatMsg(): Record<string, Any> | null {
        try {
            return this._formatContent();
        } catch (error) {
            return null;
        }
    }

    @fieldValidator('role')
    static _validateRole(value: Any): MessageRole | null {
        if (Object.values(MessageRole).includes(value)) {
            return value as MessageRole;
        }
        throw new Error(`Invalid message role: ${value}`);
    }

    clone(): RoledMessage {
        const cls = this.constructor as typeof RoledMessage;
        const signature = Reflect.getMetadata('design:paramtypes', cls.prototype, 'constructor');
        const paramNum = signature.length - 2;

        const initArgs = Array(paramNum).fill(MessageFlag.MESSAGE_CLONE);

        const obj = new cls(...initArgs);
        obj.role = this.role;
        obj.content = this.content;
        obj.metadata.set('clone_from', this);

        return obj;
    }

    @override
    static fromDict(data: Record<string, any>, ...kwargs: any[]): RoledMessage {
        data = copy(data);
        if (kwargs.length) {
            Object.assign(data, ...kwargs);
        }
        if ('lion_class' in data) {
            const cls = getClass(data.lion_class);
            delete data.lion_class;
            return cls.fromDict(data, ...kwargs);
        }
        const cls = this;
        const signature = Reflect.getMetadata('design:paramtypes', cls.prototype, 'constructor');
        const paramNum = signature.length - 2;

        const initArgs = Array(paramNum).fill(MessageFlag.MESSAGE_LOAD);

        const extraFields: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
            if (!(k in cls.prototype)) {
                extraFields[k] = v;
                delete data[k];
            }
        }

        const obj = new cls(...initArgs, { protectedInitParams: data });

        for (const [k, v] of Object.entries(extraFields)) {
            obj.addField(k, v);
        }

        const metadata = data.metadata || {};
        const lastUpdated = metadata.last_updated || null;
        if (lastUpdated !== null) {
            obj.metadata.set('last_updated', lastUpdated);
        }
        return obj;
    }

    @override
    toString(): string {
        const contentPreview = this.content.toString().slice(0, 75);
        const contentStr = contentPreview.length === 75 ? `${contentPreview}...` : contentPreview;
        return `Message(role=${this.role}, sender=${this.sender}, content='${contentStr}')`;
    }

    toLog(): Log {
        const dict = this.toDict();
        const content = dict.content;
        delete dict.content;
        return new Log({
            content: content,
            loginfo: dict
        });
    }

    @fieldSerializer('content')
    _serializeContent(value: Note): Record<string, Any> {
        const outputDict = copy(value.content, true);
        const originObj = outputDict.clone_from;

        if (originObj && originObj instanceof Communicatable) {
            const infoDict = {
                clone_from_info: {
                    original_ln_id: originObj.ln_id,
                    original_timestamp: originObj.timestamp,
                    original_sender: originObj.sender,
                    original_recipient: originObj.recipient
                }
            };
            Object.assign(outputDict, infoDict);
        }
        return outputDict;
    }

    @fieldSerializer('role')
    _serializeRole(value: MessageRole): string {
        return value.value;
    }

    protected _formatContent(): Record<string, Any> {
        const content = this.content.get('images', null) ? this.content.toDict() : this.content.toString();
        return {
            role: this.role.value,
            content: content
        };
    }
}
