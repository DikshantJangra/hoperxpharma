
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

let openParen = 0;
let closeParen = 0;
const lines = cleanContent.split('\n');
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '(') openParen++;
        if (char === ')') {
            closeParen++;
            if (closeParen > openParen) {
                console.log(`Extra closing paren found in clean content! Line ${i + 1}`);
                console.log(`Line: ${line}`);
            }
        }
    }
}

console.log(`Final Clean Paren Count: (=${openParen}, )=${closeParen}`);
