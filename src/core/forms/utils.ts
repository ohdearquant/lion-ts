export const RESTRICTED_FIELDS: Set<string> = new Set([
    "input_fields",
    "request_fields",
    "init_input_kwargs",
    "output_fields",
]);

/**
 * Parse a string in the format "inputs -> outputs" into separate input and output field arrays
 * @param str The string to parse in format "inputs -> outputs"
 * @returns A tuple containing [inputFields, requestFields]
 * @throws Error if the string format is invalid
 */
export function getInputOutputFields(str: string | null): [string[], string[]] {
    if (str === null) {
        return [[], []];
    }

    if (!str.includes("->")) {
        throw new Error(
            "Invalid assignment format. Expected 'inputs -> outputs'.",
        );
    }

    const [inputs, outputs] = str.split("->");
    const inputFields = inputs.split(",").map(i => i.trim().toLowerCase());
    const requestFields = outputs.split(",").map(o => o.trim().toLowerCase());

    return [inputFields, requestFields];
}
