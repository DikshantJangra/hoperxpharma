
import fs from 'fs';

const content = fs.readFileSync('/Users/dikshantjangra/Desktop/hoperxpharma/app/(main)/pos/new-sale/page.tsx', 'utf8');
const lines = content.split('\n');
const stack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Very naive tag finder
    const tags = line.match(/<[a-zA-Z]+|<\/[a-zA-Z]+/g) || [];
    for (const tag of tags) {
        if (tag.startsWith('</')) {
            const tagName = tag.substring(2);
            if (stack.length === 0) {
                console.log(`Extra closing tag </${tagName}> at line ${i + 1}`);
            } else {
                const last = stack.pop();
                if (last.name !== tagName) {
                    console.log(`Mismatch at line ${i + 1}: expected </${last.name}>, found </${tagName}>`);
                }
            }
        } else if (tag.endsWith('/>')) {
            // skip self-closing (though regex needs to be better)
        } else {
            // Check for self-closing in the same line
            if (!line.includes(tag + '>') && !line.includes(tag + ' ') && !line.match(new RegExp(tag + ".*/>"))) {
                // skip
            }
            // Actually let's just use a better regex or manually find
        }
    }
}
// This is too hard to write perfectly in a few lines. Let's try something simpler.
