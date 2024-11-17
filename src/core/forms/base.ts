import { Component } from '../generic/component';
import { UNDEFINED, Undefined } from '../../types/undefined';

/**
 * Base form class providing core functionality for form handling.
 *
 * This class serves as a foundation for creating custom forms within the
 * lion-core library. It includes methods for managing output fields,
 * handling results, and applying field annotations.
 *
 * The BaseForm class focuses on output fields, which are fields that are
 * presented as the result of form processing. Output fields can include all,
 * part, or none of the request fields and can be conditionally modified by
 * the process if the form is not set to be strict.
 */
export class BaseForm extends Component {
    /**
     * The objective of the task, which may define how input fields are processed into output fields.
     * @example "input1, input2 -> output"
     */
    assignment?: string;

    /** Name of the form template */
    templateName: string = 'default_form';

    /** Fields that are outputted and presented by the form */
    outputFields: string[] = [];

    /** Indicate whether to treat None as a valid value */
    noneAsValidValue: boolean = false;

    /** Indicates if the task has been processed */
    private hasProcessed: boolean = false;

    constructor(props: {
        assignment?: string;
        templateName?: string;
        outputFields?: string[];
        noneAsValidValue?: boolean;
        hasProcessed?: boolean;
    }) {
        super();
        if (props.assignment) this.assignment = props.assignment;
        if (props.templateName) this.templateName = props.templateName;
        if (props.outputFields) this.outputFields = this.validateOutput(props.outputFields);
        if (props.noneAsValidValue !== undefined) this.noneAsValidValue = props.noneAsValidValue;
        if (props.hasProcessed !== undefined) this.hasProcessed = props.hasProcessed;
    }

    /**
     * Check if all required fields are completed.
     * @param handleHow - How to handle incomplete fields
     * @returns List of incomplete fields if handleHow is "return_missing", undefined otherwise
     * @throws Error if required fields are incomplete and handleHow is "raise"
     */
    checkIsCompleted(
        handleHow: 'raise' | 'return_missing' = 'raise'
    ): string[] | undefined {
        const nonCompleteRequest: string[] = [];
        const invalidValues: (Undefined | undefined)[] = [UNDEFINED, undefined];

        for (const field of this.requiredFields) {
            const value = (this as any)[field];
            if (invalidValues.includes(value) || (!this.noneAsValidValue && value === null)) {
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

    /**
     * Check if the form is completed.
     * @returns True if the form is completed, False otherwise
     */
    isCompleted(): boolean {
        try {
            this.checkIsCompleted('raise');
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate the output_fields attribute.
     * @param value - The value to validate
     * @returns The validated value
     * @throws Error if the value is invalid
     */
    private validateOutput(value: any): string[] {
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

    /**
     * Get the list of fields that are outputted by the form.
     */
    get workFields(): string[] {
        return this.outputFields;
    }

    /**
     * Get a dictionary of all work fields and their values.
     */
    get workDict(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const field of this.workFields) {
            result[field] = (this as any)[field] ?? UNDEFINED;
        }
        return result;
    }

    /**
     * Get the list of required fields for the form.
     */
    get requiredFields(): string[] {
        return this.outputFields;
    }

    /**
     * Get a dictionary of all required fields and their values.
     */
    get requiredDict(): Record<string, any> {
        const result: Record<string, any> = {};
        for (const field of this.requiredFields) {
            result[field] = (this as any)[field] ?? UNDEFINED;
        }
        return result;
    }

    /**
     * Retrieve the results of the form.
     * @param suppress - If true, suppress errors for missing fields
     * @param validOnly - If true, return only valid (non-empty) results
     * @returns A dictionary of field names and their values
     * @throws Error if a required field is missing and suppress is false
     */
    getResults(suppress = false, validOnly = false): Record<string, any> {
        const result: Record<string, any> = {};
        const outFields = this.outputFields || (this as any).requestFields || [];

        for (const field of outFields) {
            if (!(field in this)) {
                if (!suppress) {
                    throw new Error(`Missing field: ${field}`);
                }
            } else {
                result[field] = (this as any)[field] ?? UNDEFINED;
            }
        }

        if (validOnly) {
            const invalidValues: (Undefined | undefined)[] = [UNDEFINED, undefined];
            const validResult: Record<string, any> = {};
            
            for (const [key, value] of Object.entries(result)) {
                if (!invalidValues.includes(value) && (this.noneAsValidValue || value !== null)) {
                    validResult[key] = value;
                }
            }
            return validResult;
        }

        return result;
    }

    /**
     * Get a dictionary of the required fields and their values for display.
     */
    get displayDict(): Record<string, any> {
        return this.requiredDict;
    }
}
