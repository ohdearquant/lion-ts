import { ParseError } from './types';

/**
 * Options for code block extraction
 */
interface ExtractCodeBlockOptions {
    /** Language identifier to match */
    language?: string;
    /** List of languages to filter by */
    languages?: string[];
    /** Whether to suppress errors */
    suppress?: boolean;
    /** Whether to categorize blocks by language */
    categorize?: boolean;
    /** Whether to return results as a list */
    returnAsList?: boolean;
}

/**
 * Extract code block from markdown-style text
 * 
 * @param input - Input text containing code block
 * @param options - Extraction options
 * @returns Extracted code block content
 * @throws ParseError if no code block found and suppress is false
 * 
 * @example
 * ```typescript
 * const text = '```js\nconst x = 1;\n```';
 * const code = extractCodeBlock(text);
 * // 'const x = 1;'
 * ```
 */
export function extractCodeBlock(
    input: string,
    options: ExtractCodeBlockOptions = {}
): string | string[] | Record<string, string[]> {
    const {
        language = '',
        languages = [],
        suppress = true,
        categorize = false,
        returnAsList = false
    } = options;

    try {
        if (!input.trim()) {
            if (categorize) return {};
            if (returnAsList) return [];
            return '';
        }

        // Extract all code blocks with their languages
        const blocks: Array<{ lang: string; content: string }> = [];
        let pos = 0;
        const inputLength = input.length;

        while (pos < inputLength) {
            // Find start of next code block
            const startMatch = /^(?:```|~~~)(.*?)(?:\r?\n|$)/m.exec(input.slice(pos));
            if (!startMatch) break;

            const fenceType = startMatch[0].startsWith('```') ? '```' : '~~~';
            const lang = startMatch[1].trim().toLowerCase();
            const contentStart = pos + startMatch.index + startMatch[0].length;

            // Find matching end fence
            let searchPos = contentStart;
            let contentEnd = -1;
            let foundEnd = false;

            // Find the next end fence that's alone on its line
            while (searchPos < inputLength) {
                const nextEnd = input.indexOf(fenceType, searchPos);
                if (nextEnd === -1) break;

                // Check if this fence is alone on its line
                const lineStart = input.lastIndexOf('\n', nextEnd - 1) + 1;
                let lineEnd = input.indexOf('\n', nextEnd);
                if (lineEnd === -1) {
                    lineEnd = inputLength;
                }

                const line = input.slice(lineStart, lineEnd).trim();
                if (line === fenceType) {
                    contentEnd = lineStart - 1;
                    foundEnd = true;
                    pos = lineEnd;
                    break;
                }
                searchPos = nextEnd + fenceType.length;
            }

            if (!foundEnd) {
                if (suppress) break;
                throw new ParseError('Unclosed code block found');
            }

            // Extract content and handle trailing newlines
            let content = input.slice(contentStart, contentEnd + 1);
            if (content.endsWith('\n')) {
                content = content.slice(0, -1);
            }

            // Handle whitespace-only content
            if (!content.trim()) {
                content = '';
            }

            blocks.push({ lang, content });
            pos = Math.max(pos, contentEnd + fenceType.length + 1);
        }

        if (blocks.length === 0) {
            if (suppress) {
                if (categorize) return {};
                if (returnAsList) return [];
                return '';
            }
            throw new ParseError('No code block found in the input string.');
        }

        // Filter blocks by language if specified
        let filteredBlocks = blocks;
        if (languages.length > 0) {
            const lowercaseLanguages = languages.map(l => l.toLowerCase());
            filteredBlocks = blocks.filter(block => 
                lowercaseLanguages.includes(block.lang) || 
                (block.lang === '' && lowercaseLanguages.includes('plain'))
            );
        } else if (language) {
            const lowercaseLanguage = language.toLowerCase();
            filteredBlocks = blocks.filter(block => 
                block.lang === lowercaseLanguage || 
                (block.lang === '' && lowercaseLanguage === 'plain')
            );
        }

        // Handle empty results after filtering
        if (filteredBlocks.length === 0) {
            if (suppress) {
                if (categorize) return {};
                if (returnAsList) return [];
                return '';
            }
            throw new ParseError('No matching code blocks found.');
        }

        // Return results in requested format
        if (categorize) {
            const result: Record<string, string[]> = {};
            for (const block of filteredBlocks) {
                const lang = block.lang || 'plain';
                if (!result[lang]) result[lang] = [];
                result[lang].push(block.content);
            }
            return result;
        }

        if (returnAsList) {
            return filteredBlocks.map(block => block.content);
        }

        // Return single string for default case
        return filteredBlocks.map(block => block.content).join('\n\n');
    } catch (error) {
        if (suppress) {
            if (categorize) return {};
            if (returnAsList) return [];
            return '';
        }
        throw error instanceof ParseError ? error : new ParseError(String(error));
    }
}

/**
 * Extract all code blocks from markdown-style text
 * 
 * @param input - Input text containing code blocks
 * @param options - Extraction options
 * @returns Array of extracted code blocks
 * @throws ParseError if no code blocks found and suppress is false
 * 
 * @example
 * ```typescript
 * const text = '```js\nconst x = 1;\n```\n```py\nx = 1\n```';
 * const blocks = extractCodeBlocks(text);
 * // ['const x = 1;', 'x = 1']
 * ```
 */
export function extractCodeBlocks(
    input: string,
    options: ExtractCodeBlockOptions = {}
): string[] | Record<string, string[]> {
    return extractCodeBlock(input, { ...options, returnAsList: true }) as string[] | Record<string, string[]>;
}
