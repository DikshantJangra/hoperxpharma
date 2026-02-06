const fs = require('fs');
const content = fs.readFileSync('/Users/dikshantjangra/Desktop/hoperxpharma/app/(main)/pos/new-sale/page.tsx', 'utf8');
const lines = content.split('\n');
let level = 0;
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const char of line) {
        if (char === '{') level++;
        if (char === '}') level--;
        if (level < 0) {
            console.log(`Extra closing brace found at line ${i + 1}`);
            process.exit(0);
        }
    }
    if (level === 0 && i > 40 && i < 1610) {
        // Check if level hits 0 unexpectedly (assuming NewSalePage wraps everything)
        const nextNonEmpty = lines.slice(i + 1).find(l => l.trim().length > 0);
        if (nextNonEmpty && !nextNonEmpty.trim().startsWith('import') && !nextNonEmpty.trim().startsWith('export')) {
            console.log(`Potential early closure at line ${i + 1}`);
        }
    }
}
console.log('Total level at end:', level);
