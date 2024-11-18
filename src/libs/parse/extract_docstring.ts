import { ParseError } from './types';

/**
 * Result of docstring extraction
 */
interface DocstringResult {
    description: string | undefined;
    params: Record<string, string>;
    returns?: string;
    raises: Record<string, string>;
    examples: string[];
    notes: string[];
    references: string[];
}

/**
 * Extract docstring information from a function.
 * 
 * @param func - Function to extract docstring from
 * @param style - Docstring style ('google' or 'rest')
 * @returns Extracted docstring information
 * @throws ParseError if docstring cannot be parsed
 * 
 * @example
 * ```typescript
 * function test() {
 *     /**
 *      * Test function.
 *      * @param x - Input value
 *      * @returns The result
 *      *\/
 * }
 * const info = extractDocstring(test);
 * // { description: 'Test function.', params: { x: 'Input value' }, ... }
 * ```
 */
export function extractDocstring(
    func: Function,
    style: 'google' | 'rest' = 'google'
): DocstringResult {
    if (style !== 'google' && style !== 'rest') {
        throw new ParseError(`Unsupported docstring style: ${style}`);
    }

    const result: DocstringResult = {
        description: undefined,
        params: {},
        raises: {},
        examples: [],
        notes: [],
        references: []
    };

    // Get function source
    const source = func.toString();

    // Try JSDoc style first
    const jsdocMatch = source.match(/\/\*\*([\s\S]*?)\*\//);
    if (jsdocMatch) {
        const docstring = jsdocMatch[1]
            .split('\n')
            .map(line => line.trim().replace(/^\*\s*/, ''))
            .join('\n')
            .trim();

        // Handle empty or whitespace-only docstrings
        if (!docstring || docstring === '*' || /^\s*\*\s*$/.test(docstring)) {
            return result;
        }

        // Parse based on style
        if (style === 'rest') {
            parseRestStyle(docstring, result);
        } else {
            parseGoogleStyle(docstring, result);
        }
        return result;
    }

    // Try single-line comment
    const singleLineMatch = source.match(/\/\/\s*(.*)/);
    if (singleLineMatch && singleLineMatch[1].trim()) {
        result.description = singleLineMatch[1].trim();
        return result;
    }

    // Try multi-line comment
    const multiLineMatch = source.match(/\/\*([\s\S]*?)\*\//);
    if (multiLineMatch && multiLineMatch[1].trim()) {
        result.description = multiLineMatch[1]
            .split('\n')
            .map(line => line.trim())
            .join(' ')
            .trim();
        return result;
    }

    return result;
}

/**
 * Parse Google style docstring
 */
function parseGoogleStyle(docstring: string, result: DocstringResult): void {
    const sections = docstring.split(/\n\s*(?=Args:|Returns:|Raises:|Examples?:|Notes?:|References?:)/);
    
    // Description is the first section
    const desc = sections[0].trim();
    result.description = desc || undefined;

    // Process remaining sections
    sections.slice(1).forEach(section => {
        const [header, ...content] = section.split('\n');
        const sectionContent = content.join('\n').trim();

        switch (header.trim()) {
            case 'Args:':
                parseParams(sectionContent, result.params);
                break;
            case 'Returns:':
                result.returns = sectionContent || undefined;
                break;
            case 'Raises:':
                parseExceptions(sectionContent, result.raises);
                break;
            case 'Example:':
            case 'Examples:':
                result.examples = parseList(sectionContent);
                break;
            case 'Note:':
            case 'Notes:':
                result.notes = parseList(sectionContent);
                break;
            case 'References:':
                result.references = parseList(sectionContent);
                break;
        }
    });
}

/**
 * Parse reST style docstring
 */
function parseRestStyle(docstring: string, result: DocstringResult): void {
    const lines = docstring.split('\n');
    let currentSection: string | null = null;
    let currentName: string | null = null;
    let currentContent: string[] = [];
    let descriptionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

        // Skip empty lines at the start of sections
        if (!currentSection && !line) continue;

        // Check for section markers
        if (line.startsWith(':param ')) {
            if (currentSection === 'description') {
                result.description = descriptionLines.join(' ').trim() || undefined;
            } else if (currentSection === 'param' && currentName) {
                result.params[currentName] = currentContent.join(' ').trim();
            } else if (currentSection === 'raises' && currentName) {
                result.raises[currentName] = currentContent.join(' ').trim();
            }

            const match = line.match(/^:param\s+(\w+):\s*(.*)/);
            if (match) {
                currentSection = 'param';
                currentName = match[1];
                currentContent = [match[2]];
            }
        } else if (line.match(/^:returns?:/)) {
            if (currentSection === 'description') {
                result.description = descriptionLines.join(' ').trim() || undefined;
            } else if (currentSection === 'param' && currentName) {
                result.params[currentName] = currentContent.join(' ').trim();
            }

            currentSection = 'returns';
            currentName = null;
            currentContent = [line.replace(/^:returns?:\s*/, '')];
        } else if (line.match(/^:raises?\s+/)) {
            if (currentSection === 'description') {
                result.description = descriptionLines.join(' ').trim() || undefined;
            } else if (currentSection === 'param' && currentName) {
                result.params[currentName] = currentContent.join(' ').trim();
            } else if (currentSection === 'raises' && currentName) {
                result.raises[currentName] = currentContent.join(' ').trim();
            }

            const match = line.match(/^:raises?\s+(\w+):\s*(.*)/);
            if (match) {
                currentSection = 'raises';
                currentName = match[1];
                currentContent = [match[2]];
            }
        } else if (line === ':example:') {
            if (currentSection === 'description') {
                result.description = descriptionLines.join(' ').trim() || undefined;
            } else if (currentSection === 'param' && currentName) {
                result.params[currentName] = currentContent.join(' ').trim();
            }

            currentSection = 'example';
            currentName = null;
            currentContent = [];
        } else {
            // Handle continuation lines
            if (currentSection === null) {
                currentSection = 'description';
                descriptionLines.push(line);
            } else if (currentSection === 'description') {
                if (line.startsWith(':')) {
                    i--; // Reprocess this line
                    continue;
                }
                descriptionLines.push(line);
            } else if (currentSection === 'example') {
                if (line) result.examples.push(line);
            } else if (line) {
                currentContent.push(line);
            }
        }
    }

    // Handle the last section
    if (currentSection === 'description') {
        result.description = descriptionLines.join(' ').trim() || undefined;
    } else if (currentSection === 'param' && currentName) {
        result.params[currentName] = currentContent.join(' ').trim();
    } else if (currentSection === 'returns') {
        result.returns = currentContent.join(' ').trim();
    } else if (currentSection === 'raises' && currentName) {
        result.raises[currentName] = currentContent.join(' ').trim();
    }
}

/**
 * Parse parameter section into key-value pairs
 */
function parseParams(content: string, params: Record<string, string>): void {
    const lines = content.split('\n');
    let currentParam = '';
    let currentDesc = '';

    lines.forEach(line => {
        const paramMatch = line.match(/^\s*(\w+):\s*(.+)/);
        if (paramMatch) {
            if (currentParam) {
                params[currentParam] = currentDesc.trim();
            }
            [, currentParam, currentDesc] = paramMatch;
        } else {
            currentDesc += ' ' + line.trim();
        }
    });

    if (currentParam) {
        params[currentParam] = currentDesc.trim();
    }
}

/**
 * Parse exception section into key-value pairs
 */
function parseExceptions(content: string, raises: Record<string, string>): void {
    const lines = content.split('\n');
    let currentException = '';
    let currentDesc = '';

    lines.forEach(line => {
        const exceptionMatch = line.match(/^\s*(\w+):\s*(.+)/);
        if (exceptionMatch) {
            if (currentException) {
                raises[currentException] = currentDesc.trim();
            }
            [, currentException, currentDesc] = exceptionMatch;
        } else {
            currentDesc += ' ' + line.trim();
        }
    });

    if (currentException) {
        raises[currentException] = currentDesc.trim();
    }
}

/**
 * Parse section content into list items
 */
function parseList(content: string): string[] {
    return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
}
