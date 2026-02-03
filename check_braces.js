
import fs from 'fs';

const content = fs.readFileSync('/Users/dikshantjangra/Desktop/hoperxpharma/app/(main)/pos/new-sale/page.tsx', 'utf8');

let cleanContent = '';
let inString = false;
let stringChar = '';
let inComment = false;
let inMultilineComment = false;

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inComment) {
        if (char === '\n') inComment = false;
        continue;
    }
    if (inMultilineComment) {
        if (char === '*' && next === '/') {
            inMultilineComment = false;
            i++;
        }
        continue;
    }
    if (inString) {
        if (char === stringChar) {
            if (content[i - 1] !== '\\') inString = false;
        }
        continue;
    }

    if (char === '/' && next === '/') {
        inComment = true;
        i++;
        continue;
    }
    if (char === '/' && next === '*') {
        inMultilineComment = true;
        i++;
        continue;
    }
    if (char === "'" || char === '"' || char === '`') {
        inString = true;
        stringChar = char;
        continue;
    }

    cleanContent += char;
}

let openBrace = 0;
let closeBrace = 0;
for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    if (char === '{') openBrace++;
    if (char === '}') {
        closeBrace++;
        if (closeBrace > openBrace) {
            console.log(`Extra closing brace found in clean content! Current count: {=${openBrace}, }=${closeBrace}`);
            // Find context
            const snippet = cleanContent.substring(i - 20, i + 20);
            console.log(`Context: ...${snippet}...`);
        }
    }
}

console.log(`Final Clean Count: {=${openBrace}, }=${closeBrace}`);
