"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractCodeBlock = void 0;
/**
 * Extract code blocks from a given string containing Markdown-formatted text.
 *
 * @param strToParse - The input string containing Markdown code blocks
 * @param options - Extraction options
 * @returns Extracted code blocks in specified format
 */
function extractCodeBlock(strToParse, options = {}) {
    const { returnAsList = false, languages = null, categorize = false } = options;
    const codeBlocks = [];
    const codeDict = {};
    // Create regex pattern for code blocks
    const pattern = new RegExp('^(?<fence>```|~~~)[ \\t]*' + // Opening fence ``` or ~~~
        '(?<lang>[\\w+-]*)[ \\t]*\\n' + // Optional language identifier
        '(?<code>.*?)(?<=\\n)' + // Code content
        '^\\1[ \\t]*$', // Closing fence matching opening
    'gms' // Flags: global, multiline, dot-all
    );
    let match;
    while ((match = pattern.exec(strToParse)) !== null) {
        // Extract named groups
        const groups = match.groups;
        const lang = groups.lang || 'plain';
        const code = groups.code || '';
        if (!languages || languages.includes(lang)) {
            if (categorize) {
                if (!codeDict[lang]) {
                    codeDict[lang] = [];
                }
                codeDict[lang].push(code);
            }
            else {
                codeBlocks.push(code);
            }
        }
    }
    if (categorize) {
        return codeDict;
    }
    else if (returnAsList) {
        return codeBlocks;
    }
    else {
        return codeBlocks.join('\n\n');
    }
}
exports.extractCodeBlock = extractCodeBlock;
// Helper type guard
function isExtractOptions(obj) {
    return typeof obj === 'object' &&
        obj !== null &&
        !Array.isArray(obj);
}
// Usage examples:
/*
// Simple extraction
const code = extractCodeBlock(markdownText);

// Return as list
const codeList = extractCodeBlock(markdownText, {
    returnAsList: true
});

// Filter by language
const pythonCode = extractCodeBlock(markdownText, {
    languages: ['python']
});

// Categorized by language
const codeBylang = extractCodeBlock(markdownText, {
    categorize: true
});
*/ 
