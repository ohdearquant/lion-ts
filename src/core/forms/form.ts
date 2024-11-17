import { z } from 'zod';
import { BaseForm } from './base';
import { getInputOutputFields } from './utils';

const UNDEFINED = Symbol('UNDEFINED');

interface FormProps {
  assignment: string;
  strictForm?: boolean;
  guidance?: string | Record<string, any>;
  inputFields?: string[];
  requestFields?: string[];
  task?: any;
  taskDescription?: string;
  initInputKwargs?: Record<string, any>;
  noneAsValidValue?: boolean;
  outputFields?: string[];
}

export class Form extends BaseForm {
  strictForm: boolean;
  guidance: string | Record<string, any> | undefined;
  inputFields: string[];
  requestFields: string[];
  task: any;
  taskDescription: string | undefined;
  initInputKwargs: Record<string, any>;

  constructor({
    assignment,
    strictForm = false,
    guidance,
    inputFields = [],
    requestFields = [],
    task = '',
    taskDescription,
    initInputKwargs = {},
    noneAsValidValue = false,
    outputFields = [],
  }: FormProps) {
    super({ assignment, templateName: 'default_form', outputFields, noneAsValidValue });
    this.strictForm = strictForm;
    this.guidance = guidance;
    this.inputFields = inputFields;
    this.requestFields = requestFields;
    this.task = task;
    this.taskDescription = taskDescription;
    this.initInputKwargs = initInputKwargs;

    const fields = getInputOutputFields(assignment);
    this.inputFields = fields.inputFields;
    this.requestFields = fields.requestFields;
    this.outputFields = outputFields.length ? outputFields : fields.requestFields;

    for (const field of this.inputFields) {
      this.initInputKwargs[field] = this.initInputKwargs[field] ?? UNDEFINED;
    }
  }

  checkIsCompleted(handleHow: 'return_missing' | 'raise' = 'raise'): string[] | undefined {
    if (this.strictForm && this.hasProcessed) {
      return;
    }
    return super.checkIsCompleted(handleHow);
  }

  static checkInputOutputListOmitted(data: any): any {
    if (typeof data !== 'object' || data === null) {
      throw new TypeError('Input data must be a dictionary.');
    }

    if (!data.assignment) {
      throw new Error('Assignment is missing.');
    }

    if ('inputFields' in data || 'requestFields' in data || 'task' in data) {
      throw new Error('Explicit inputFields, requestFields, or task fields are not allowed.');
    }

    const fields = getInputOutputFields(data.assignment);
    data.inputFields = fields.inputFields;
    data.requestFields = fields.requestFields;
    data.outputFields = data.outputFields || fields.requestFields;
    data.initInputKwargs = {};

    for (const field of data.inputFields) {
      data.initInputKwargs[field] = data[field] ?? UNDEFINED;
    }

    return data;
  }

  static checkInputOutputFields(data: any): Form {
    const form = new Form(data);
    for (const field of form.inputFields) {
      form.initInputKwargs[field] = form[field];
    }
    for (const field of form.requestFields) {
      if (!(field in form)) {
        form[field] = UNDEFINED;
      }
    }
    return form;
  }

  get workFields(): string[] {
    return [...this.inputFields, ...this.requestFields];
  }

  get requiredFields(): string[] {
    return Array.from(new Set([...this.inputFields, ...this.requestFields, ...this.outputFields]));
  }

  get validationKwargs(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const field of this.workFields) {
      result[field] = (this as any)[field]?.validationKwargs || {};
    }
    return result;
  }

  get instructionDict(): Record<string, any> {
    return {
      context: this.instructionContext,
      instruction: this.instructionPrompt,
      requestFields: this.instructionRequestFields,
    };
  }

  get instructionContext(): string {
    let context = '### Input Fields:\n';
    for (const [idx, field] of this.inputFields.entries()) {
      context += `Input No.${idx + 1}: ${field}\n`;
      context += `  - value: ${(this as any)[field]}\n`;
    }
    return context;
  }

  get instructionPrompt(): string {
    let prompt = '';
    if (this.guidance) {
      prompt += `### Overall Guidance:\n${this.guidance}.\n`;
    }

    const inFields = this.inputFields.join(', ');
    const outFields = this.outputFields.join(', ');
    prompt += '### Task Instructions:\n';
    prompt += `1. Provided Input Fields: ${inFields}.\n`;
    prompt += `2. Requested Output Fields: ${outFields}.\n`;
    prompt += `3. Your task:\n${this.task}.\n`;

    return prompt;
  }

  get instructionRequestFields(): string {
    let context = '### Output Fields:\n';
    for (const [idx, field] of this.requestFields.entries()) {
      context += `Input No.${idx + 1}: ${field}\n`;
    }
    return context;
  }

  updateField(fieldName: string, value: any = UNDEFINED, annotation: any = UNDEFINED, fieldObj: any = UNDEFINED, ...kwargs: any[]): void {
    (this as any)[fieldName] = value;
    this.initInputKwargs[fieldName] = value;
  }

  setField(fieldName: string, value: any): void {
    if (this.strictForm && ['assignment', 'inputFields', 'requestFields'].includes(fieldName)) {
      throw new Error(`Cannot modify ${fieldName} in strict form mode.`);
    }
    (this as any)[fieldName] = value;
    this.initInputKwargs[fieldName] = value;
  }

  checkIsWorkable(handleHow: 'raise' | 'return_missing' = 'raise'): string[] | undefined {
    if (this.strictForm && this.hasProcessed) {
      throw new Error('Cannot modify processed form in strict mode.');
    }

    const missingInputs: string[] = [];
    const invalidValues = [UNDEFINED, null];

    for (const field of this.inputFields) {
      if (invalidValues.includes((this as any)[field])) {
        missingInputs.push(field);
      }
    }

    if (missingInputs.length > 0) {
      if (handleHow === 'raise') {
        throw new Error(`Incomplete input fields: ${missingInputs}`);
      } else if (handleHow === 'return_missing') {
        return missingInputs;
      }
    }
  }

  isWorkable(): boolean {
    try {
      this.checkIsWorkable('raise');
      return true;
    } catch {
      return false;
    }
  }

  toDict(validOnly = false): Record<string, any> {
    const result: Record<string, any> = { ...this };
    if (!validOnly) {
      return result;
    }

    const disallowValues = [UNDEFINED, null];
    return Object.fromEntries(Object.entries(result).filter(([_, value]) => !disallowValues.includes(value)));
  }

  static fromDict(data: Record<string, any>): Form {
    const inputData = { ...data };
    inputData.initInputKwargs = {};

    for (const field of inputData.inputFields) {
      inputData.initInputKwargs[field] = inputData[field] ?? UNDEFINED;
    }

    return new Form(inputData);
  }

  fillInputFields(form: BaseForm | any = null, ...valueKwargs: any[]): void {
    if (form && !(form instanceof BaseForm)) {
      throw new TypeError('Provided form is not a BaseForm instance.');
    }

    for (const field of this.inputFields) {
      if (this.noneAsValidValue) {
        if ((this as any)[field] !== UNDEFINED) {
          continue;
        }
        const value = valueKwargs[field] ?? (form ? form[field] : UNDEFINED);
        if (value !== UNDEFINED) {
          (this as any)[field] = value;
        }
      } else {
        if ((this as any)[field] === UNDEFINED || (this as any)[field] === null) {
          const value = valueKwargs[field] ?? (form ? form[field] : UNDEFINED);
          if (value !== UNDEFINED && value !== null) {
            (this as any)[field] = value;
          }
        }
      }
    }
  }

  fillRequestFields(form: BaseForm | any = null, ...valueKwargs: any[]): void {
    if (form && !(form instanceof BaseForm)) {
      throw new TypeError('Provided form is not a BaseForm instance.');
    }

    for (const field of this.requestFields) {
      if (this.noneAsValidValue) {
        if ((this as any)[field] !== UNDEFINED) {
          continue;
        }
        const value = valueKwargs[field] ?? (form ? form[field] : UNDEFINED);
        if (value !== UNDEFINED) {
          (this as any)[field] = value;
        }
      } else {
        if ((this as any)[field] === UNDEFINED || (this as any)[field] === null) {
          const value = valueKwargs[field] ?? (form ? form[field] : UNDEFINED);
          if (value !== UNDEFINED && value !== null) {
            (this as any)[field] = value;
          }
        }
      }
    }
  }

  static fromForm(
    form: BaseForm | typeof BaseForm,
    guidance?: string | Record<string, any>,
    assignment?: string,
    strictForm = false,
    taskDescription?: string,
    fillInputs = true,
    noneAsValidValue = false,
    outputFields?: string[],
    sameFormOutputFields = false,
    ...inputValueKwargs: any[]
  ): Form {
    if (typeof form === 'function') {
      if (!(form.prototype instanceof BaseForm)) {
        throw new TypeError('Provided form is not a BaseForm class.');
      }
    } else {
      if (!(form instanceof BaseForm)) {
        throw new TypeError('Provided form is not a BaseForm instance.');
      }
    }

    if (sameFormOutputFields && outputFields) {
      throw new Error('Cannot provide outputFields and sameFormOutputFields at the same time.');
    }

    if (!assignment) {
      assignment = form.assignment;
    }

    const obj = new Form({
      guidance: guidance || form.guidance,
      assignment,
      taskDescription: taskDescription || form.taskDescription,
      noneAsValidValue: noneAsValidValue || form.noneAsValidValue,
      strictForm: strictForm || form.strictForm,
      outputFields: outputFields || form.outputFields,
    });

    for (const field of obj.workFields) {
      if (!(field in form)) {
        throw new Error(`Invalid assignment field: ${field}`);
      }
      obj.updateField(field, form[field]);
    }

    if (fillInputs) {
      obj.fillInputFields(form, ...inputValueKwargs);
    }

    return obj;
  }

  removeRequestFromOutput(): void {
    this.outputFields = this.outputFields.filter((field) => !this.requestFields.includes(field));
  }

  appendToInput(fieldName: string, value: any = UNDEFINED, annotation: any = UNDEFINED, fieldObj: any = UNDEFINED, ...kwargs: any[]): void {
    this._appendToOne('input', fieldName, value, annotation, fieldObj, ...kwargs);
  }

  appendToOutput(fieldName: string, value: any = UNDEFINED, annotation: any = UNDEFINED, fieldObj: any = UNDEFINED, ...kwargs: any[]): void {
    this._appendToOne('output', fieldName, value, annotation, fieldObj, ...kwargs);
  }

  appendToRequest(fieldName: string, annotation: any = UNDEFINED, fieldObj: any = UNDEFINED, ...kwargs: any[]): void {
    this._appendToOne('request', fieldName, UNDEFINED, annotation, fieldObj, ...kwargs);
  }

  private _appendToOne(
    fieldType: 'input' | 'output' | 'request',
    fieldName: string,
    value: any = UNDEFINED,
    annotation: any = UNDEFINED,
    fieldObj: any = UNDEFINED,
    ...kwargs: any[]
  ): void {
    if (this.strictForm && ['input', 'request'].includes(fieldType)) {
      throw new Error(`Cannot modify ${fieldType} fields in strict form mode.`);
    }

    if (fieldType === 'input' && !this.inputFields.includes(fieldName)) {
      this.inputFields.push(fieldName);
      this.assignment = `${fieldName}, ${this.assignment}`;
    } else if (fieldType === 'request' && !this.requestFields.includes(fieldName)) {
      this.requestFields.push(fieldName);
      this.assignment = `${this.assignment}, ${fieldName}`;
    } else if (fieldType === 'output' && !this.outputFields.includes(fieldName)) {
      this.outputFields.push(fieldName);
    }

    if (value !== UNDEFINED || annotation !== UNDEFINED || fieldObj !== UNDEFINED || kwargs.length > 0 || !(fieldName in this)) {
      this.updateField(fieldName, value, annotation, fieldObj, ...kwargs);
    }
  }
}
