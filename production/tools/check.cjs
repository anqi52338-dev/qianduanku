'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8'));
for (const [name, hash] of Object.entries(release.sha256)) if (name.startsWith('public/')) {
  const file = path.join(root, name);
  if (crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== hash) throw new Error('Release checksum mismatch: ' + name);
  if (name.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}
const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (ids.length !== new Set(ids).size) throw new Error('Duplicate HTML IDs');
console.log('Frontend syntax, release checksums, and HTML ID checks passed.');
