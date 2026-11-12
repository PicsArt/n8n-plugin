// Copy extension icons without a glob parser or task-runner dependency.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function copyIcons(relative) {
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const item = path.join(relative, entry.name);
    if (entry.isDirectory()) copyIcons(item);
    else if (entry.isFile() && ['.png', '.svg'].includes(path.extname(entry.name))) {
      const target = path.join(root, 'dist', item);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, item), target);
    }
  }
}
for (const directory of ['nodes', 'credentials']) copyIcons(directory);
