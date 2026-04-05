const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules')) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const frontendFiles = walk(path.join(__dirname, 'frontend'));
const backendFiles = walk(path.join(__dirname, 'backend'));
const files = [...frontendFiles, ...backendFiles];

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // >${value}  =>  >EGP {value}
    content = content.replace(/>\$\{/g, '>EGP {');
    
    // >$number  =>  >EGP number
    content = content.replace(/>\$([0-9])/g, '>EGP $1');

    // : ${value}  =>  : EGP {value}  (only if it's literally a dollar sign and brace, not backtick)
    // Actually look for exactly `g: ${` as in `Price per 100g: ${(price...)}`
    content = content.replace(/g:\s*\$\{/g, 'g: EGP {');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
console.log('Done');
