import { DocStyle, DocstringResult, ParseError } from './types';

/**
 * Extract function description and parameter descriptions from docstring.
 * 
 * @param func - Function to extract docstring from
 * @param style - Docstring style ('google' or 'rest')
 * @returns Extracted docstring information
 * @throws ParseError if unsupported style provided
 */
export function extractDocstring(
    func: Function,
    style: DocStyle = 'google'
): DocstringResult {
    // Get function's documentation
    const docstring = getFunctionDoc(func);
    
    if (!docstring) {
        return {
            description: undefined,
            params: {},
            returns: undefined,
            raises: {},
            examples: [],
            notes: [],
            references: []
        };
    }

    // Parse based on style
    switch (style.toLowerCase()) {
        case 'google':
            return extractDocstringGoogle(docstring);
        case 'rest':
            return extractDocstringRest(docstring);
        default:
            throw new ParseError(
                `${style} is not supported. Please choose either "google" or "rest".`
            );
    }
}

/**
 * Extract details from Google-style docstring
 */
function extractDocstringGoogle(docstring: string): DocstringResult {
    const lines = docstring.split('\n');
    const result: DocstringResult = {
        description: lines[0].trim() || undefined,
        params: {},
        returns: undefined,
        raises: {},
        examples: [],
        notes: [],
        references: []
    };

    let currentSection: keyof DocstringResult | null = null;
    let currentParam: string | null = null;
    let buffer: string[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) {
            continue;
        }

        // Check for section headers
        if (!line.startsWith(' ')) {
            const lowerLine = line.toLowerCase();
            if (lowerLine.startsWith('args') || lowerLine.startsWith('parameters')) {
                currentSection = 'params';
                buffer = [];
                continue;
            }
            if (lowerLine.startsWith('returns')) {
                currentSection = 'returns';
                buffer = [];
                continue;
            }
            if (lowerLine.startsWith('raises') || lowerLine.startsWith('throws')) {
                currentSection = 'raises';
                buffer = [];
                continue;
            }
            if (lowerLine.startsWith('example')) {
                currentSection = 'examples';
                buffer = [];
                continue;
            }
            if (lowerLine.startsWith('note')) {
                currentSection = 'notes';
                buffer = [];
                continue;
            }
            if (lowerLine.startsWith('reference')) {
                currentSection = 'references';
                buffer = [];
                continue;
            }
        }

        // Process section content
        if (currentSection) {
            if (currentSection === 'params') {
                if (line.startsWith(' ')) {
                    const paramMatch = line.match(/^\s*(\w+)(?:\s*\([^)]+\))?\s*:\s*(.+)/);
                    if (paramMatch) {
                        const [, name, desc] = paramMatch;
                        result.params[name] = desc.trim();
                        currentParam = name;
                    } else if (currentParam && line.trim()) {
                        result.params[currentParam] += ' ' + line.trim();
                    }
                }
            } else if (currentSection === 'returns' && line.startsWith(' ')) {
                buffer.push(line.trim());
                result.returns = buffer.join(' ');
            } else if (currentSection === 'raises' && line.startsWith(' ')) {
                const raiseMatch = line.match(/^\s*(\w+):\s*(.+)/);
                if (raiseMatch) {
                    const [, name, desc] = raiseMatch;
                    result.raises[name] = desc.trim();
                }
            } else if (currentSection === 'examples' || currentSection === 'notes' || currentSection === 'references') {
                if (line.startsWith(' ')) {
                    buffer.push(line.trim());
                    result[currentSection] = [...buffer];
                }
            }
        }
    }

    return result;
}

/**
 * Extract details from reST-style docstring
 */
function extractDocstringRest(docstring: string): DocstringResult {
    const lines = docstring.split('\n');
    const result: DocstringResult = {
        description: lines[0].trim() || undefined,
        params: {},
        returns: undefined,
        raises: {},
        examples: [],
        notes: [],
        references: []
    };

    let currentParam: string | null = null;
    let currentSection: keyof DocstringResult | null = null;
    let buffer: string[] = [];
    
    for (const line of lines.slice(1)) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith(':param')) {
            currentSection = 'params';
            const paramMatch = trimmedLine.match(/^:param\s+(\w+):\s*(.+)/);
            if (paramMatch) {
                const [, name, desc] = paramMatch;
                result.params[name] = desc.trim();
                currentParam = name;
            }
        } else if (trimmedLine.startsWith(':returns:')) {
            currentSection = 'returns';
            const desc = trimmedLine.replace(/^:returns:\s*/, '').trim();
            buffer = [desc];
            result.returns = desc || undefined;
        } else if (trimmedLine.startsWith(':raises:')) {
            currentSection = 'raises';
            const raiseMatch = trimmedLine.match(/^:raises\s+(\w+):\s*(.+)/);
            if (raiseMatch) {
                const [, name, desc] = raiseMatch;
                result.raises[name] = desc.trim();
            }
        } else if (trimmedLine.startsWith(':example:')) {
            currentSection = 'examples';
            buffer = [];
        } else if (trimmedLine.startsWith(':note:')) {
            currentSection = 'notes';
            buffer = [];
        } else if (trimmedLine.startsWith(':reference:')) {
            currentSection = 'references';
            buffer = [];
        } else if (trimmedLine.startsWith(' ') && currentSection) {
            const content = trimmedLine.trim();
            if (currentSection === 'params' && currentParam) {
                result.params[currentParam] += ' ' + content;
            } else if (currentSection === 'returns') {
                buffer.push(content);
                result.returns = buffer.join(' ');
            } else if (currentSection === 'examples' || currentSection === 'notes' || currentSection === 'references') {
                buffer.push(content);
                result[currentSection] = [...buffer];
            }
        }
    }

    return result;
}

/**
 * Get function's documentation string
 */
function getFunctionDoc(func: Function): string | undefined {
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
    
    return undefined;
}
