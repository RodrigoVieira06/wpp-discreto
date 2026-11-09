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

test('product name is consistent across the package, toolbar, popup and locale catalogs', () => {
  const root = path.resolve(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, 'dist/extension/manifest.json'), 'utf8'),
  );
  assert.equal(pkg.name, 'wpp-discreto');
  assert.equal(manifest.action.default_title, 'Wpp Discreto');
  const popup = fs.readFileSync(path.join(root, 'dist/extension/popup/popup.html'), 'utf8');
  assert.ok(popup.includes('<title>Wpp Discreto</title>'));
  assert.ok(popup.includes('<h1>Wpp Discreto</h1>'));
  for (const locale of ['pt_BR', 'en']) {
    const catalog = JSON.parse(
      fs.readFileSync(path.join(root, 'dist/extension/_locales', locale, 'messages.json'), 'utf8'),
    );
    assert.ok(catalog.extensionName.message.startsWith('Wpp Discreto'));
    assert.ok(catalog.conversationDataNotice.message.includes('Wpp Discreto'));
  }
});
