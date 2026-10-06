const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const addEventListenerRegex = /\.addEventListener\([^,]+,\s*([^)]+)\)/g;
const listeners = new Set();
let match;
while ((match = addEventListenerRegex.exec(html)) !== null) {
  listeners.add(match[1].trim());
}

console.log("Listeners:", Array.from(listeners));
