#!/usr/bin/env node
// Dependency-free so bootstrap workflows can run before npm install.
const fs = require('node:fs');

const contents = fs.readFileSync('.github/labels.yml', 'utf8');
const labels = [];
for (const line of contents.split('\n')) {
  const started = line.match(/^-\s*name:\s*(.+)$/);
  if (started) { labels.push({ name: unquote(started[1]) }); continue; }
  const field = line.match(/^\s+(color|description):\s*(.+)$/);
  if (field && labels.length) labels[labels.length - 1][field[1]] = unquote(field[2]);
}
function unquote(value) { return value.trim().replace(/^["']|["']$/g, ''); }

if (!labels.length) { console.error('No labels found in .github/labels.yml'); process.exit(1); }
for (const label of labels) console.log(`${label.name}\t${label.color || 'ededed'}\t${label.description || ''}`);
