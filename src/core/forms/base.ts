import { z } from 'zod';

interface BaseFormProps {
  assignment?: string;
  templateName?: string;
  outputFields?: string[];
  noneAsValidValue?: boolean;
  hasProcessed?: boolean;
}

export class BaseForm {
  assignment: string | undefined;
  templateName: string;
  outputFields: string[];
  noneAsValidValue: boolean;
  hasProcessed: boolean;

  constructor({
    assignment,
    templateName = 'default_form',
    outputFields = [],
    noneAsValidValue = false,
    hasProcessed = false,
  }: BaseFormProps) {
    this.assignment = assignment;
    this.templateName = templateName;
    this.outputFields = outputFields;
    this.noneAsValidValue = noneAsValidValue;
    this.hasProcessed = hasProcessed;
  }

  checkIsCompleted(
    handleHow: 'raise' | 'return_missing' = 'raise'
  ): string[] | undefined {
    const nonCompleteRequest: string[] = [];
    const invalidValues = [undefined, null];

    for (const field of this.requiredFields) {
      if (invalidValues.includes((this as any)[field])) {
        nonCompleteRequest.push(field);
      }
    }

    if (nonCompleteRequest.length > 0) {
      if (handleHow === 'raise') {
        throw new Error(`Incomplete request fields: ${nonCompleteRequest}`);
      } else if (handleHow === 'return_missing') {
        return nonCompleteRequest;
      }
    } else {
      this.hasProcessed = true;
    }
  }

  isCompleted(): boolean {
    try {
      this.checkIsCompleted('raise');
      return true;
    } catch {
      return false;
    }
  }

  static validateOutput(value: any): string[] {
    if (typeof value === 'string') {
      return [value];
    }
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value;
    }
    if (!value) {
      return [];
    }
    throw new Error('Invalid output fields.');
  }

  get workFields(): string[] {
    return this.outputFields;
  }

  get workDict(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const field of this.workFields) {
      result[field] = (this as any)[field];
    }
    return result;
  }

  get requiredFields(): string[] {
    return this.outputFields;
  }

  get requiredDict(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const field of this.requiredFields) {
      result[field] = (this as any)[field];
    }
    return result;
  }

  getResults(suppress = false, validOnly = false): Record<string, any> {
    const result: Record<string, any> = {};
    const outFields = this.outputFields || (this as any).requestFields || [];

    for (const field of outFields) {
      if (!(field in this)) {
        if (!suppress) {
          throw new Error(`Missing field: ${field}`);
        }
      } else {
        result[field] = (this as any)[field];
      }
    }

    if (validOnly) {
      const invalidValues = [undefined, null];
      const validResult: Record<string, any> = {};
      for (const [key, value] of Object.entries(result)) {
        if (!invalidValues.includes(value)) {
          validResult[key] = value;
        }
      }
      return validResult;
    }

    return result;
  }

  get displayDict(): Record<string, any> {
    return this.requiredDict;
  }
}
