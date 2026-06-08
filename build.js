#!/usr/bin/env node

/**
 * FlashStore Build Script
 * Minifies app.css and app.js for production
 */

const fs = require('fs');
const path = require('path');

const CSS_FILE = path.join(__dirname, 'app.css');
const JS_FILE = path.join(__dirname, 'app.js');

// Simple CSS minifier (no external dependencies)
function minifyCSS(css) {
    return css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove newlines and extra spaces
        .replace(/\s+/g, ' ')
        // Remove spaces around selectors and properties
        .replace(/\s*([{}:;,])\s*/g, '$1')
        // Remove trailing semicolons before closing braces
        .replace(/;}/g, '}')
        // Remove leading/trailing whitespace
        .trim();
}

// Simple JS minifier (basic - for production use terser)
function minifyJS(js) {
    return js
        // Remove single-line comments (but not URLs with //)
        .replace(/(?<![:"])\/\/(?!\/).*$/gm, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Collapse multiple spaces
        .replace(/\s+/g, ' ')
        // Remove spaces around operators
        .replace(/\s*([{}:;,=+\-*/<>!&|?])\s*/g, '$1')
        // Clean up
        .trim();
}

// Read files
console.log('Building FlashStore...');
console.log('');

let cssContent, jsContent;
try {
    cssContent = fs.readFileSync(CSS_FILE, 'utf8');
    console.log(`✓ Read app.css (${(cssContent.length / 1024).toFixed(1)} KB)`);
} catch (err) {
    console.error('✗ Error reading app.css:', err.message);
    process.exit(1);
}

try {
    jsContent = fs.readFileSync(JS_FILE, 'utf8');
    console.log(`✓ Read app.js (${(jsContent.length / 1024).toFixed(1)} KB)`);
} catch (err) {
    console.error('✗ Error reading app.js:', err.message);
    process.exit(1);
}

// Minify
const minifiedCSS = minifyCSS(cssContent);
const minifiedJS = minifyJS(jsContent);

// Write minified files
const cssOut = path.join(__dirname, 'app.min.css');
const jsOut = path.join(__dirname, 'app.min.js');

try {
    fs.writeFileSync(cssOut, minifiedCSS, 'utf8');
    const savings = ((1 - minifiedCSS.length / cssContent.length) * 100).toFixed(1);
    console.log(`✓ Written app.min.css (${(minifiedCSS.length / 1024).toFixed(1)} KB, ${savings}% smaller)`);
} catch (err) {
    console.error('✗ Error writing app.min.css:', err.message);
    process.exit(1);
}

try {
    fs.writeFileSync(jsOut, minifiedJS, 'utf8');
    const savings = ((1 - minifiedJS.length / jsContent.length) * 100).toFixed(1);
    console.log(`✓ Written app.min.js (${(minifiedJS.length / 1024).toFixed(1)} KB, ${savings}% smaller)`);
} catch (err) {
    console.error('✗ Error writing app.min.js:', err.message);
    process.exit(1);
}

console.log('');
console.log('Build complete!');
console.log('');
console.log('To use minified files, update landing_page_mobile.html:');
console.log('  <link rel="stylesheet" href="app.min.css">');
console.log('  <script src="app.min.js"></script>');
