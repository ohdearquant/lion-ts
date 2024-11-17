import { Pile } from 'lion/core/generic/pile';
import { UNDEFINED, Field } from 'lion/core/typing';
import { BaseForm } from './base';
import { Form } from './form';

interface ReportProps {
  defaultFormTemplate?: typeof Form;
  strictForm?: boolean;
  completedTasks?: Pile<Form>;
  completedTaskAssignments?: Record<string, string>;
}

export class Report extends BaseForm {
  defaultFormTemplate: typeof Form;
  strictForm: boolean;
  completedTasks: Pile<Form>;
  completedTaskAssignments: Record<string, string>;

  constructor({
    defaultFormTemplate = Form,
    strictForm = false,
    completedTasks = new Pile<Form>({ itemType: Form }),
    completedTaskAssignments = {},
  }: ReportProps) {
    super({});
    this.defaultFormTemplate = defaultFormTemplate;
    this.strictForm = strictForm;
    this.completedTasks = completedTasks;
    this.completedTaskAssignments = completedTaskAssignments;
  }

  get workFields(): string[] {
    const baseReportFields = Object.keys(this.constructor.prototype);
    const allFields = Object.keys(this);
    return allFields.filter((field) => !baseReportFields.includes(field));
  }

  getIncompleteFields(noneAsValidValue = false): string[] {
    const baseReportFields = Object.keys(this.constructor.prototype);
    const result: string[] = [];
    for (const field of Object.keys(this)) {
      if (baseReportFields.includes(field)) continue;
      if (noneAsValidValue) {
        if ((this as any)[field] === UNDEFINED) {
          result.push(field);
        }
      } else {
        if ((this as any)[field] === UNDEFINED || (this as any)[field] === null) {
          result.push(field);
        }
      }
    }
    return result;
  }

  parseAssignment(inputFields: string[], requestFields: string[]): string {
    if (!Array.isArray(inputFields)) {
      throw new TypeError('The inputFields must be a list of strings.');
    }

    if (!Array.isArray(requestFields)) {
      throw new TypeError('The requestFields must be a list of strings.');
    }

    for (const field of [...inputFields, ...requestFields]) {
      if (!(field in this)) {
        throw new Error(`Field ${field} is missing.`);
      }
    }

    const inputAssignment = inputFields.join(', ');
    const outputAssignment = requestFields.join(', ');
    return `${inputAssignment} -> ${outputAssignment}`;
  }

  createForm({
    assignment,
    inputFields,
    requestFields,
    taskDescription,
    fillInputs = true,
    noneAsValidValue = false,
    strict,
  }: {
    assignment?: string;
    inputFields?: string[];
    requestFields?: string[];
    taskDescription?: string;
    fillInputs?: boolean;
    noneAsValidValue?: boolean;
    strict?: boolean;
  }): Form {
    if (assignment) {
      if (inputFields || requestFields) {
        throw new Error('Cannot provide input/request fields with assignment.');
      }
    } else {
      if (!inputFields || !requestFields) {
        throw new Error('Provide inputFields and requestFields lists together.');
      }
    }

    if (!assignment) {
      assignment = this.parseAssignment(inputFields!, requestFields!);
    }

    return this.defaultFormTemplate.fromForm({
      assignment,
      form: this,
      taskDescription,
      fillInputs,
      noneAsValidValue,
      strict: strict ?? this.strictForm,
    });
  }

  saveCompletedForm(form: Form, updateResults = false): void {
    try {
      form.checkIsCompleted('raise');
    } catch (e) {
      throw new Error(`Failed to add completed form. Error: ${e}`);
    }

    const reportFields = Object.keys(this);
    for (const field of Object.keys(form)) {
      if (!reportFields.includes(field)) {
        throw new Error(
          `The task does not match the report. Field ${field} in task assignment not found in report.`
        );
      }
    }

    this.completedTasks.include(form);
    this.completedTaskAssignments[form.ln_id] = form.assignment;

    if (updateResults) {
      for (const field of form.requestFields) {
        const fieldResult = (form as any)[field];
        (this as any)[field] = fieldResult;
      }
    }
  }

  static fromFormTemplate(templateClass: typeof BaseForm, inputKwargs: Record<string, any> = {}): Report {
    if (!(templateClass.prototype instanceof BaseForm)) {
      throw new Error('Invalid form template. Must be a subclass of Form.');
    }

    const repTemplate = `report_for_${templateClass.prototype.templateName}`;
    const reportObj = new Report({ templateName: repTemplate });

    const baseReportFields = Object.keys(Report.prototype);

    for (const [field, fieldInfo] of Object.entries(templateClass.prototype)) {
      if (baseReportFields.includes(field)) continue;
      if (!(field in reportObj)) {
        (reportObj as any)[field] = fieldInfo;
      }
      if (field in inputKwargs) {
        (reportObj as any)[field] = inputKwargs[field];
      }
    }

    return reportObj;
  }

  static fromForm(form: BaseForm, fillInputs = true): Report {
    if (!(form instanceof BaseForm)) {
      throw new TypeError('Invalid form. Should be an instance of BaseForm.');
    }

    const reportTemplateName = `report_for_${form.templateName}`;
    const reportObj = new Report({ templateName: reportTemplateName });

    const baseReportFields = Object.keys(Report.prototype);

    for (const [field, fieldInfo] of Object.entries(form)) {
      if (baseReportFields.includes(field)) continue;
      if (!(field in reportObj)) {
        (reportObj as any)[field] = fieldInfo;
      }
      if (fillInputs) {
        (reportObj as any)[field] = (form as any)[field];
      }
    }

    return reportObj;
  }
}
