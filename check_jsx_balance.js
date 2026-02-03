
import fs from 'fs';

const content = fs.readFileSync('/Users/dikshantjangra/Desktop/hoperxpharma/app/(main)/pos/new-sale/page.tsx', 'utf8');
const lines = content.split('\n');

let balance = 0;
const stack = [];

for (let i = 1371; i < lines.length; i++) {
    const line = lines[i];
    // Find <div or </div> or <Tag or />
    const re = /<([a-zA-Z0-9]+)|<\/([a-zA-Z0-9]+)>|\/>/g;
    let match;
    while ((match = re.exec(line)) !== null) {
        if (match[0] === '/>') {
            // current tag stack top is self-closed
            if (stack.length > 0) stack.pop();
        } else if (match[1]) {
            stack.push({ name: match[1], line: i + 1 });
        } else if (match[2]) {
            if (stack.length > 0) {
                const last = stack.pop();
                if (last.name !== match[2]) {
                    console.log(`Mismatch at line ${i + 1}: expected </${last.name}>, found </${match[2]}>`);
                }
            } else {
                console.log(`Extra closing tag </${match[2]}> at line ${i + 1}`);
            }
        }
    }
}

console.log('Unclosed tags at end:');
stack.forEach(t => console.log(`<${t.name}> at line ${t.line}`));
