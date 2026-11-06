import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from '@jest/globals';

test('project uses TypeScript and SCSS sources with the requested quality tools', () => {
  const root = path.resolve(__dirname, '..');
  for (const file of [
    'src/content.ts',
    'src/settings.ts',
    'popup/popup.ts',
    'src/content.scss',
    'popup/popup.scss',
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing source: ${file}`);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  for (const dependency of [
    'typescript',
    'sass',
    '@biomejs/biome',
    'jest',
    'lefthook',
    '@commitlint/cli',
    '@commitlint/config-conventional',
  ]) {
    assert.ok(pkg.devDependencies[dependency], `Missing tool: ${dependency}`);
  }
  assert.ok(pkg.scripts.test.includes('jest'));
});
