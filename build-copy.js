// build-copy.js — Cross-platform file copy for build step
// Works on Windows, Mac, and Linux (GitHub Actions)
const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy index.html into dist/
fs.copyFileSync('index.html', path.join('dist', 'index.html'));
console.log('  Copied index.html → dist/');

// Copy assets/ into dist/assets/
if (fs.existsSync('assets')) {
  copyDir('assets', path.join('dist', 'assets'));
  console.log('  Copied assets/ → dist/assets/');
}
