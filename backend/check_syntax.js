const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/(main)/prescriptions/components/PrescriptionForm.tsx');

try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let openBraces = 0;
    let closeBraces = 0;
    
    let openParens = 0;
    let closeParens = 0;
    
    // Simple scanner (ignoring comments/strings for speed, but might be inaccurate)
    // Better to just look at indentation or obvious errors.
    // But let's try a simple count.
    
    // Remove comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    content = content.replace(/\/\/.*/g, '');
    
    for (let char of content) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
        if (char === '(') openParens++;
        if (char === ')') closeParens++;
    }
    
    console.log(`Braces: ${openBraces} open, ${closeBraces} close`);
    console.log(`Parens: ${openParens} open, ${closeParens} close`);
    
    if (openBraces !== closeBraces) console.log("BRACE MISMATCH!");
    if (openParens !== closeParens) console.log("PAREN MISMATCH!");

} catch (err) {
    console.error(err);
}
