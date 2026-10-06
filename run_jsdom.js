const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: "dangerously" });

// We need to wait for DOMContentLoaded to fire in JSDOM, or it already fired.
dom.window.onerror = (msg, file, line, col, err) => {
    console.error("JSDOM ERROR:", msg, err);
};

// Wait a bit to see if any errors are logged
setTimeout(() => {
    console.log("JSDOM Test Finished");
}, 2000);
