
import fs from 'fs';

const content = fs.readFileSync('/Users/dikshantjangra/Desktop/hoperxpharma/app/(main)/pos/new-sale/page.tsx', 'utf8');
let openCount = 0;
let closeCount = 0;
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/\(/g) || []).length;
    const closes = (line.match(/\)/g) || []).length;
    openCount += opens;
    closeCount += closes;
    if (closeCount > openCount) {
        console.log(`Paren Mismatch at line ${i + 1}: open=${openCount}, close=${closeCount}`);
        console.log(`Line content: ${line}`);
        break;
    }
}
console.log(`Final Paren count: open=${openCount}, close=${closeCount}`);
