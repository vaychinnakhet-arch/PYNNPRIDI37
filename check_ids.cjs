const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const idRegex = /id="([^"]+)"/g;
const htmlIds = new Set();
let match;
while ((match = idRegex.exec(html)) !== null) {
  htmlIds.add(match[1]);
}

const getElementRegex = /document\.getElementById\("([^"]+)"\)/g;
const usedIds = new Set();
while ((match = getElementRegex.exec(html)) !== null) {
  usedIds.add(match[1]);
}

const missingIds = [];
for (const id of usedIds) {
  if (!htmlIds.has(id)) {
    missingIds.push(id);
  }
}

if (missingIds.length > 0) {
  console.log("Missing IDs:", missingIds);
} else {
  console.log("No missing IDs found.");
}
