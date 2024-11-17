import { RESTRICTED_FIELDS, getInputOutputFields } from '../utils';

describe('forms utils', () => {
    describe('RESTRICTED_FIELDS', () => {
        it('should contain expected fields', () => {
            expect(RESTRICTED_FIELDS.size).toBe(4);
            expect(RESTRICTED_FIELDS.has('input_fields')).toBe(true);
            expect(RESTRICTED_FIELDS.has('request_fields')).toBe(true);
            expect(RESTRICTED_FIELDS.has('init_input_kwargs')).toBe(true);
            expect(RESTRICTED_FIELDS.has('output_fields')).toBe(true);
        });
    });

    describe('getInputOutputFields', () => {
        it('should return empty arrays for null input', () => {
            const [inputs, outputs] = getInputOutputFields(null);
            expect(inputs).toEqual([]);
            expect(outputs).toEqual([]);
        });

        it('should parse valid input -> output format', () => {
            const [inputs, outputs] = getInputOutputFields('field1, field2 -> output1, output2');
            expect(inputs).toEqual(['field1', 'field2']);
            expect(outputs).toEqual(['output1', 'output2']);
        });

        it('should handle whitespace and case', () => {
            const [inputs, outputs] = getInputOutputFields('  Field1  ,  FIELD2  ->  Output1  ,  OUTPUT2  ');
            expect(inputs).toEqual(['field1', 'field2']);
            expect(outputs).toEqual(['output1', 'output2']);
        });

        it('should throw error for invalid format', () => {
            expect(() => getInputOutputFields('invalid format')).toThrow(
                'Invalid assignment format. Expected \'inputs -> outputs\'.'
            );
        });
    });
});
