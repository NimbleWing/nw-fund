const fs = require('fs');
const path = require('path');

const NSIS_DIR = path.join(__dirname, '../src-tauri/target/release/bundle/nsis');
const OLD_NAME = '灵翼基金管理系统';
const NEW_NAME = 'NW.Fund';

if (!fs.existsSync(NSIS_DIR)) {
  console.error('Bundle directory not found:', NSIS_DIR);
  process.exit(1);
}

const files = fs.readdirSync(NSIS_DIR);

for (const file of files) {
  if (file.includes(OLD_NAME)) {
    const oldPath = path.join(NSIS_DIR, file);
    const newFileName = file.replace(OLD_NAME, NEW_NAME);
    const newPath = path.join(NSIS_DIR, newFileName);

    fs.renameSync(oldPath, newPath);
    console.log(`Renamed: ${file} -> ${newFileName}`);
  }
}

console.log('Done!');
