/**
 * Supported docstring styles
 */
type DocStyle = 'google' | 'rest';

/**
 * Result of docstring extraction
 */
interface DocstringResult {
    description: string | null;
    params: Record<string, string>;
}

/**
 * Extract function description and parameter descriptions from docstring.
 * 
 * @param func - Function to extract docstring from
 * @param style - Docstring style ('google' or 'rest')
 * @returns Tuple of description and parameter descriptions
 * @throws Error if unsupported style provided
 */
export function extractDocstring(
    func: Function,
    style: DocStyle = 'google'
): [string | null, Record<string, string>] {
    // Get function's documentation
    const docstring = getFunctionDoc(func);
    
    if (!docstring) {
        return [null, {}];
    }

    // Parse based on style
    switch (style.toLowerCase()) {
        case 'google':
            return extractDocstringGoogle(docstring);
        case 'rest':
            return extractDocstringRest(docstring);
        default:
            throw new Error(
                `${style} is not supported. Please choose either "google" or "rest".`
            );
    }
}

/**
 * Extract details from Google-style docstring
 */
function extractDocstringGoogle(
    docstring: string
): [string | null, Record<string, string>] {
    const lines = docstring.split('\n');
    const funcDescription = lines[0].trim();
    const paramsDescription: Record<string, string> = {};

    let paramStartPos = -1;
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim().toLowerCase();
        if (line.startsWith('args') || 
            line.startsWith('parameters') ||
            line.startsWith('params') ||
            line.startsWith('arguments')) {
            paramStartPos = i + 1;
            break;
        }
    }

    if (paramStartPos === -1) {
        return [funcDescription, paramsDescription];
    }

    let currentParam: string | null = null;
    for (let i = paramStartPos; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') {
            continue;
        }
        
        if (line.startsWith(' ')) {
            const paramDesc = line.split(':', 1);
            if (paramDesc.length === 1 && currentParam) {
                paramsDescription[currentParam] += ` ${paramDesc[0].trim()}`;
                continue;
            }
            
            const [param, ...descParts] = line.split(':');
            const paramName = param.split('(')[0].trim();
            const desc = descParts.join(':').trim();
            
            paramsDescription[paramName] = desc;
            currentParam = paramName;
        } else {
            break;
        }
    }

    return [funcDescription, paramsDescription];
}

/**
 * Extract details from reST-style docstring
 */
function extractDocstringRest(
    docstring: string
): [string | null, Record<string, string>] {
    const lines = docstring.split('\n');
    const funcDescription = lines[0].trim();
    const paramsDescription: Record<string, string> = {};

    let currentParam: string | null = null;
    
    for (const line of lines.slice(1)) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith(':param')) {
            const paramDesc = trimmedLine.split(':', 2);
            if (paramDesc.length < 2) continue;
            
            const [_, param, ...descParts] = paramDesc;
            const paramName = param.split(' ').pop()?.trim() || '';
            const desc = descParts.join(':').trim();
            
            paramsDescription[paramName] = desc;
            currentParam = paramName;
        } else if (trimmedLine.startsWith(' ') && currentParam) {
            paramsDescription[currentParam] += ` ${trimmedLine}`;
        }
    }

    return [funcDescription, paramsDescription];
}

/**
 * Get function's documentation string
 */
function getFunctionDoc(func: Function): string | null {
    // Try to get JSDoc comment
    const funcString = func.toString();
    const jsdocMatch = funcString.match(/\/\*\*([\s\S]*?)\*\//);
    
    if (jsdocMatch) {
        // Clean up JSDoc comment
        return jsdocMatch[1]
            .split('\n')
            .map(line => line.trim().replace(/^\* ?/, ''))
            .join('\n')
            .trim();
    }
    
    // Try to get single-line or multi-line comment
    const commentMatch = funcString.match(
        /^[^{]*?(\/\*[\s\S]*?\*\/|\/\/.*$)/m
    );
    
    if (commentMatch) {
        return commentMatch[1]
            .replace(/^\/\*|\*\/$/g, '')
            .replace(/^\/\/ ?/gm, '')
            .trim();
    }
    
    return null;
}

// Example usage:
/*
// Google style
function exampleGoogle(param1: number, param2: string): void {
    /** Example function.
     *
     * Args:
     *   param1 (number): The first parameter
     *   param2 (string): The second parameter
     */
}

const [descGoogle, paramsGoogle] = extractDocstring(exampleGoogle, 'google');

// reST style
function exampleRest(param1: number, param2: string): void {
    /** Example function.
     *
     * :param param1: The first parameter
     * :type param1: number
     * :param param2: The second parameter
     * :type param2: string
     */
}

const [descRest, paramsRest] = extractDocstring(exampleRest, 'rest');
*/