
import fs from 'fs';

const content = fs.readFileSync('/Users/dikshantjangra/Desktop/hoperxpharma/app/(main)/pos/new-sale/page.tsx', 'utf8');

// Simple regex to find tags, but ignore self-closing and braces
const tags = [];
const re = /<([a-zA-Z0-9]+)|<\/([a-zA-Z0-9]+)>|\/>/g;
let match;

while ((match = re.exec(content)) !== null) {
    if (match[0] === '/>') {
        // self-closing, handled by previous open tag usually? 
        // No, my regex finds <Tag. So if it's <Tag />, we pop.
        if (tags.length > 0 && !tags[tags.length - 1].closed) {
            tags.pop();
        }
    } else if (match[1]) {
        // opening tag
        tags.push({ name: match[1], line: content.substring(0, match.index).split('\n').length });
    } else if (match[2]) {
        // closing tag
        if (tags.length === 0) {
            console.log(`Extra closing tag </${match[2]}> at line ${content.substring(0, match.index).split('\n').length}`);
        } else {
            const last = tags.pop();
            if (last.name !== match[2]) {
                console.log(`Mismatch: opened <${last.name}> at line ${last.line}, closed </${match[2]}> at line ${content.substring(0, match.index).split('\n').length}`);
            }
        }
    }
}

console.log('Unclosed tags:');
tags.forEach(t => console.log(`<${t.name}> at line ${t.line}`));
