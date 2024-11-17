import { ID, Any, BaseModel, JsonValue, Literal } from '../../core/typing';
import { breakDownPydanticAnnotation } from '../../integrations/pydantic_';
import { toStr } from '../../libs/parse';
import { copy } from '../../libs/utils';
import { MessageFlag, MessageRole, RoledMessage } from './message';
import { formatImageContent, formatTextContent, prepareInstructionContent, prepareRequestResponseFormat } from './utils';

export class Instruction extends RoledMessage {
    constructor(
        instruction: JsonValue | MessageFlag,
        context: JsonValue | MessageFlag = null,
        guidance: JsonValue | MessageFlag = null,
        images: any[] | MessageFlag = null,
        sender: ID.Ref | MessageFlag = null,
        recipient: ID.Ref | MessageFlag = null,
        requestFields: JsonValue | MessageFlag = null,
        plainContent: JsonValue | MessageFlag = null,
        imageDetail: Literal<'low' | 'high' | 'auto'> | MessageFlag = null,
        requestModel: BaseModel | typeof BaseModel | MessageFlag = null,
        toolSchemas: Record<string, any> = null,
        protectedInitParams: Record<string, any> = null
    ) {
        const messageFlags = [
            instruction,
            context,
            guidance,
            images,
            sender,
            recipient,
            requestFields,
            plainContent,
            imageDetail,
            toolSchemas,
            requestModel
        ];

        if (messageFlags.every(flag => flag === MessageFlag.MESSAGE_LOAD)) {
            protectedInitParams = protectedInitParams || {};
            super(protectedInitParams);
            return;
        }

        if (messageFlags.every(flag => flag === MessageFlag.MESSAGE_CLONE)) {
            super({ role: MessageRole.USER });
            return;
        }

        super({
            role: MessageRole.USER,
            content: prepareInstructionContent({
                guidance,
                instruction,
                context,
                images,
                requestFields,
                plainContent,
                imageDetail,
                requestModel,
                toolSchemas
            }),
            sender: sender || 'user',
            recipient: recipient || 'N/A'
        });
    }

    get guidance(): string | null {
        return this.content.get('guidance', null);
    }

    set guidance(guidance: string) {
        if (typeof guidance !== 'string') {
            guidance = toStr(guidance);
        }
        this.content['guidance'] = guidance;
    }

    get instruction(): JsonValue | null {
        if ('plain_content' in this.content) {
            return this.content['plain_content'];
        } else {
            return this.content.get('instruction', null);
        }
    }

    set instruction(instruction: JsonValue) {
        this.content['instruction'] = instruction;
    }

    get context(): JsonValue | null {
        return this.content.get('context', null);
    }

    set context(context: JsonValue) {
        if (!Array.isArray(context)) {
            context = [context];
        }
        this.content['context'] = context;
    }

    get toolSchemas(): JsonValue | null {
        return this.content.get('tool_schemas', null);
    }

    set toolSchemas(toolSchemas: Record<string, any>) {
        this.content['tool_schemas'] = toolSchemas;
    }

    get plainContent(): string | null {
        return this.content.get('plain_content', null);
    }

    set plainContent(plainContent: string) {
        this.content['plain_content'] = plainContent;
    }

    get imageDetail(): Literal<'low' | 'high' | 'auto'> | null {
        return this.content.get('image_detail', null);
    }

    set imageDetail(imageDetail: Literal<'low' | 'high' | 'auto'>) {
        this.content['image_detail'] = imageDetail;
    }

    get images(): any[] {
        return this.content.get('images', []);
    }

    set images(images: any[]) {
        if (!Array.isArray(images)) {
            images = [images];
        }
        this.content['images'] = images;
    }

    get requestFields(): Record<string, any> | null {
        return this.content.get('request_fields', null);
    }

    set requestFields(requestFields: Record<string, any>) {
        this.content['request_fields'] = requestFields;
        this.content['request_response_format'] = prepareRequestResponseFormat(requestFields);
    }

    get requestModel(): typeof BaseModel | null {
        return this.content.get('request_model', null);
    }

    set requestModel(requestModel: typeof BaseModel) {
        if (requestModel instanceof BaseModel) {
            this.content['request_model'] = requestModel.constructor;
        } else {
            this.content['request_model'] = requestModel;
        }

        this.requestFields = {};
        this.extendContext({ respond_schema_info: requestModel.modelJsonSchema() });
        this.requestFields = breakDownPydanticAnnotation(requestModel);
    }

    extendImages(images: any[] | string, imageDetail: Literal<'low' | 'high' | 'auto'> = null): void {
        images = Array.isArray(images) ? images : [images];
        const currentImages = this.content.get('images', []);
        currentImages.push(...images);
        this.images = currentImages;

        if (imageDetail) {
            this.imageDetail = imageDetail;
        }
    }

    extendContext(...args: any[]): void {
        const context = this.content.get('context', []);

        args.forEach(arg => {
            if (Array.isArray(arg)) {
                context.push(...arg);
            } else {
                context.push(arg);
            }
        });

        this.context = context;
    }

    update(
        ...args: any[],
        guidance: JsonValue = null,
        instruction: JsonValue = null,
        requestFields: JsonValue = null,
        plainContent: JsonValue = null,
        requestModel: BaseModel | typeof BaseModel = null,
        images: string | any[] = null,
        imageDetail: Literal<'low' | 'high' | 'auto'> = null,
        toolSchemas: Record<string, any> = null,
        ...kwargs: any[]
    ): void {
        if (requestModel && requestFields) {
            throw new Error('You cannot pass both requestModel and requestFields to create_instruction');
        }
        if (guidance) {
            this.guidance = guidance;
        }
        if (instruction) {
            this.instruction = instruction;
        }
        if (plainContent) {
            this.plainContent = plainContent;
        }
        if (requestFields) {
            this.requestFields = requestFields;
        }
        if (requestModel) {
            this.requestModel = requestModel;
        }
        if (images) {
            this.images = images;
        }
        if (imageDetail) {
            this.imageDetail = imageDetail;
        }
        if (toolSchemas) {
            this.toolSchemas = toolSchemas;
        }
        this.extendContext(...args, ...kwargs);
    }

    protected _formatContent(): Record<string, any> {
        const content = this.content.toDict();
        const textContent = formatTextContent(content);
        if (!('images' in content)) {
            return { role: this.role.value, content: textContent };
        } else {
            return {
                role: this.role.value,
                content: formatImageContent(textContent, this.images, this.imageDetail)
            };
        }
    }
}
