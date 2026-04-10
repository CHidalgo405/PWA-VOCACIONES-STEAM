const fs = require('fs');
const path = require('path');

const directoryToSearch = './src/app';

const emojiRegex = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}]/gu;

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            searchFiles(filePath);
        } else if (file.endsWith('.html') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (emojiRegex.test(content)) {
                console.log(`Found emoji in: ${filePath}`);
                const lines = content.split('\n');
                lines.forEach((line, index) => {
                    if (emojiRegex.test(line)) {
                        console.log(`  Line ${index + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    });
}

searchFiles(directoryToSearch);
