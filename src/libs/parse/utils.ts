import { ParseError } from './types';

/**
 * Extract numbers from text in various formats
 * 
 * @param text - Text to extract numbers from
 * @returns Array of tuples containing number type and value
 * 
 * @example
 * ```typescript
 * extractNumbers('50% of 100.5');
 * // [['percentage', '50%'], ['decimal', '100.5']]
 * ```
 */
export function extractNumbers(text: string): Array<[string, string]> {
    const patterns = {
        percentage: /\b\d+(\.\d+)?%/g,
        decimal: /\b\d+\.\d+\b/g,
        fraction: /\b\d+\/\d+\b/g,
        integer: /\b\d+\b/g
    };

    const results: Array<[string, string]> = [];
    const matched = new Set<string>();

    // Extract percentages first
    let match;
    while ((match = patterns.percentage.exec(text)) !== null) {
        results.push(['percentage', match[0]]);
        matched.add(match[0]);
    }

    // Extract decimals
    while ((match = patterns.decimal.exec(text)) !== null) {
        if (!matched.has(match[0])) {
            results.push(['decimal', match[0]]);
            matched.add(match[0]);
        }
    }

    // Extract fractions
    while ((match = patterns.fraction.exec(text)) !== null) {
        if (!matched.has(match[0])) {
            results.push(['fraction', match[0]]);
            matched.add(match[0]);
        }
    }

    // Extract integers
    while ((match = patterns.integer.exec(text)) !== null) {
        if (!matched.has(match[0])) {
            results.push(['integer', match[0]]);
            matched.add(match[0]);
        }
    }

    return results;
}

/**
 * Split text into lines and extract code blocks
 * 
 * @param text - Text to split into lines
 * @returns Array of lines with code blocks preserved
 * 
 * @example
 * ```typescript
 * splitLines('let x = 1;\nprint(x)');
 * // ['let x = 1;', 'print(x)']
 * ```
 */
export function splitLines(text: string): string[] {
    if (!text) return [];
    return text.split(/\r?\n/);
}

/**
 * Join lines with appropriate line endings
 * 
 * @param lines - Lines to join
 * @param separator - Line separator to use
 * @returns Joined text
 * 
 * @example
 * ```typescript
 * joinLines(['let x = 1;', 'print(x)']);
 * // 'let x = 1;\nprint(x)'
 * ```
 */
export function joinLines(lines: string[], separator: string = '\n'): string {
    return lines.join(separator);
}

/**
 * Remove common indentation from text
 * 
 * @param text - Text to dedent
 * @returns Dedented text
 * 
 * @example
 * ```typescript
 * dedent('    let x = 1;\n    print(x)');
 * // 'let x = 1;\nprint(x)'
 * ```
 */
export function dedent(text: string): string {
    if (!text) return '';

    // Split into lines
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return '';

    // Find minimum indentation
    let minIndent = Infinity;
    for (const line of lines) {
        if (!line.trim()) continue;
        const indent = line.match(/^\s*/)?.[0].length ?? 0;
        minIndent = Math.min(minIndent, indent);
    }

    // Remove common indentation
    if (minIndent === Infinity) return text;
    return lines
        .map(line => line.slice(minIndent))
        .join('\n');
}

/**
 * Indent text by specified amount
 * 
 * @param text - Text to indent
 * @param indent - Indentation to add
 * @returns Indented text
 * 
 * @example
 * ```typescript
 * indent('let x = 1;\nprint(x)', '  ');
 * // '  let x = 1;\n  print(x)'
 * ```
 */
export function indent(text: string, indent: string = '    '): string {
    if (!text) return '';
    return text
        .split(/\r?\n/)
        .map(line => indent + line)
        .join('\n');
}

/**
 * Wrap text at specified width
 * 
 * @param text - Text to wrap
 * @param width - Maximum line width
 * @returns Wrapped text
 * 
 * @example
 * ```typescript
 * wrap('This is a long line of text', 10);
 * // 'This is a\nlong line\nof text'
 * ```
 */
export function wrap(text: string, width: number = 80): string {
    if (!text) return '';
    if (width <= 0) throw new ParseError('Width must be positive');

    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        if (currentLine.length + word.length + 1 <= width) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }

    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
}

/**
 * Unwrap text by joining lines
 * 
 * @param text - Text to unwrap
 * @returns Unwrapped text
 * 
 * @example
 * ```typescript
 * unwrap('This is a\nlong line\nof text');
 * // 'This is a long line of text'
 * ```
 */
export function unwrap(text: string): string {
    if (!text) return '';
    return text
        .split(/\r?\n/)
        .map(line => line.trim())
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}
