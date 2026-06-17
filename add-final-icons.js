const fs = require('fs');
const path = require('path');
const https = require('https');

const missingIcons = [
  { original: "shield-question", fetch: "shield-question" },
  { original: "align-left", fetch: "align-left" }
];

const downloadIcon = (name) => {
  return new Promise((resolve, reject) => {
    // try unpkg
    const url = `https://unpkg.com/lucide-static@latest/icons/${name}.svg`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          resolve(null);
        }
      });
    }).on('error', err => reject(err));
  });
};

async function main() {
  const newIconEntries = [];
  
  for (const iconObj of missingIcons) {
    console.log(`Fetching ${iconObj.fetch} from unpkg...`);
    let svgContent = await downloadIcon(iconObj.fetch);
    
    if (svgContent) {
      // Modify width/height to use variables
      svgContent = svgContent.replace(/width="[^"]+"/, 'width="${this.size}"');
      svgContent = svgContent.replace(/height="[^"]+"/, 'height="${this.size}"');
      svgContent = svgContent.replace(/stroke-width="[^"]+"/, 'stroke-width="${this.strokeWidth}"');
      
      // Clean up newlines
      svgContent = svgContent.replace(/\r?\n/g, '');

      // Use the ORIGINAL name in our code
      newIconEntries.push(`      '${iconObj.original}': \`${svgContent}\``);
    } else {
      console.log(`Could not resolve ${iconObj.fetch}`);
    }
  }

  const lucideComponentFile = path.join(__dirname, 'src/app/components/lucide-icon/lucide-icon.component.ts');
  let lucideContent = fs.readFileSync(lucideComponentFile, 'utf8');

  const insertIndex = lucideContent.indexOf('};');
  if (insertIndex !== -1 && newIconEntries.length > 0) {
    const toInsert = ',\n' + newIconEntries.join(',\n') + '\n    ';
    lucideContent = lucideContent.slice(0, insertIndex) + toInsert + lucideContent.slice(insertIndex);
    fs.writeFileSync(lucideComponentFile, lucideContent);
    console.log('Successfully updated lucide-icon.component.ts with final icons');
  }
}

main().catch(console.error);
