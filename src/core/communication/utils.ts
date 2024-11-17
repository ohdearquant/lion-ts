import { ID, UNDEFINED, Any, BaseModel, IDError, Literal, LnID, Note } from '../../core/typing';
import { breakDownPydanticAnnotation } from '../../integrations/pydantic_/break_down_annotation';
import { time } from '../../libs/utils';

const DEFAULT_SYSTEM = "You are a helpful AI assistant. Let's think step by step.";

export function formatSystemContent(systemDatetime: boolean | string | null, systemMessage: string): Note {
    const content = new Note({ system: systemMessage || DEFAULT_SYSTEM });
    if (systemDatetime) {
        if (typeof systemDatetime === 'string') {
            content['system_datetime'] = systemDatetime;
        } else {
            content['system_datetime'] = time({ type: 'iso', timespec: 'minutes' });
        }
    }
    return content;
}

export function prepareRequestResponseFormat(requestFields: Record<string, any>): string {
    return `**MUST RETURN JSON-PARSEABLE RESPONSE ENCLOSED BY JSON CODE BLOCKS.** \n\`\`\`json\n${JSON.stringify(requestFields, null, 2)}\n\`\`\``.trim();
}

export function formatImageItem(idx: string, x: string): Record<string, any> {
    return {
        type: 'image_url',
        image_url: {
            url: `data:image/jpeg;base64,${idx}`,
            detail: x
        }
    };
}

export function formatTextItem(item: any): string {
    let msg = '';
    const items = Array.isArray(item) ? item : [item];
    for (const j of items) {
        if (typeof j === 'object') {
            for (const [k, v] of Object.entries(j)) {
                msg += `- ${k}: ${v} \n\n`;
            }
        } else {
            msg += `${j}\n`;
        }
    }
    return msg;
}

export function formatTextContent(content: Record<string, any>): string {
    if ('plain_content' in content && typeof content['plain_content'] === 'string') {
        return content['plain_content'];
    }

    let msg = "\n---\n # Task\n";
    for (const [k, v] of Object.entries(content)) {
        if (['guidance', 'instruction', 'context', 'request_response_format', 'tool_schemas'].includes(k)) {
            const key = k === 'request_response_format' ? 'response format' : k;
            msg += `## **Task ${key}**\n${formatTextItem(v)}\n\n`;
        }
    }
    msg += "\n\n---\n";
    return msg;
}

export function formatImageContent(textContent: string, images: string[], imageDetail: Literal<'low' | 'high' | 'auto'>): Record<string, any>[] {
    const content = [{ type: 'text', text: textContent }];
    content.push(...images.map(idx => formatImageItem(idx, imageDetail)));
    return content;
}

export function prepareInstructionContent({
    guidance = null,
    instruction = null,
    context = null,
    requestFields = null,
    plainContent = null,
    requestModel = null,
    images = null,
    imageDetail = null,
    toolSchemas = null
}: {
    guidance?: string | null,
    instruction?: string | null,
    context?: string | Record<string, any> | any[] | null,
    requestFields?: Record<string, any> | string[] | null,
    plainContent?: string | null,
    requestModel?: typeof BaseModel | null,
    images?: string | string[] | null,
    imageDetail?: Literal<'low' | 'high' | 'auto'> | null,
    toolSchemas?: Record<string, any> | null
} = {}): Note {
    if (requestFields && requestModel) {
        throw new Error("only one of requestFields or requestModel can be provided");
    }

    const out: Record<string, any> = { context: [] };
    if (guidance) out['guidance'] = guidance;
    if (instruction) out['instruction'] = instruction;
    if (context) {
        if (Array.isArray(context)) {
            out['context'].push(...context);
        } else {
            out['context'].push(context);
        }
    }
    if (images) {
        out['images'] = Array.isArray(images) ? images : [images];
        out['image_detail'] = imageDetail || 'low';
    }
    if (toolSchemas) out['tool_schemas'] = toolSchemas;
    if (requestModel) {
        out['request_model'] = requestModel;
        requestFields = breakDownPydanticAnnotation(requestModel);
        out['context'].push({ respond_schema_info: requestModel.modelJsonSchema() });
    }
    if (requestFields) {
        const fields = Array.isArray(requestFields) ? Object.fromEntries(requestFields.map(i => [i, '...'])) : requestFields;
        out['request_fields'] = fields;
        out['request_response_format'] = prepareRequestResponseFormat(fields);
    }
    if (plainContent) out['plain_content'] = plainContent;

    return new Note(out);
}

export function validateSenderRecipient(value: any): LnID | Literal<'system' | 'user' | 'N/A' | 'assistant'> {
    if (['system', 'user', 'N/A', 'assistant'].includes(value)) {
        return value;
    }

    if (value === null) {
        return 'N/A';
    }

    try {
        return ID.getId(value);
    } catch (error) {
        if (error instanceof IDError) {
            throw new Error("Invalid sender or recipient");
        }
        throw error;
    }
}
