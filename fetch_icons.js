const fs = require('fs');
const https = require('https');

const icons = [
  'menu', 'x', 'users', 'clipboard-list', 'file-text', 'log-out', 
  'download', 'check-circle', 'check', 'building', 'brain', 'trash-2', 
  'pencil', 'save', 'user-search', 'atom', 'inbox', 'refresh-cw', 
  'smartphone', 'bell', 'moon', 'help-circle', 'headphones'
];

async function fetchIcon(name) {
  return new Promise((resolve, reject) => {
    https.get(`https://unpkg.com/lucide-static@0.359.0/icons/${name}.svg`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ name, data }));
    }).on('error', reject);
  });
}

async function main() {
  const results = await Promise.all(icons.map(fetchIcon));
  let output = '';
  results.forEach(res => {
    if(res.data.includes('<svg')) {
      // replace class, width, height with the ones used in the component
      let svg = res.data.replace(/xmlns=".*?"/, 'xmlns="http://www.w3.org/2000/svg"');
      svg = svg.replace(/width=".*?"/, 'width="${this.size}"');
      svg = svg.replace(/height=".*?"/, 'height="${this.size}"');
      svg = svg.replace(/stroke-width=".*?"/, 'stroke-width="${this.strokeWidth}"');
      output += `      '${res.name}': \`${svg.trim()}\`,\n`;
    } else {
      console.error(`Failed to fetch ${res.name}: ${res.data}`);
    }
  });
  fs.writeFileSync('new_icons.txt', output);
  console.log('Done! Wrote to new_icons.txt');
}
main();
