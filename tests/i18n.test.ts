import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@jest/globals';
import { getUiLocale } from '../src/i18n';

const root = path.resolve(__dirname, '..');

test.each([
  ['pt-BR', 'pt-BR'],
  ['pt-PT', 'pt-BR'],
  ['pt', 'pt-BR'],
  ['en', 'en'],
  ['en-US', 'en'],
  ['en-GB', 'en'],
  ['en_AU', 'en'],
  ['es-ES', 'pt-BR'],
  ['fr', 'pt-BR'],
  ['ar', 'pt-BR'],
  ['', 'pt-BR'],
])('browser locale %s uses %s for the document language', (language, expected) => {
  expect(getUiLocale(language)).toBe(expected);
});

test('extension metadata uses native Chrome localization with Brazilian Portuguese as default', () => {
  const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  expect(manifest.default_locale).toBe('pt_BR');
  expect(manifest.name).toBe('__MSG_extensionName__');
  expect(manifest.description).toBe('__MSG_extensionDescription__');
});

test('Portuguese and English catalogs ship with the build and have matching message keys', () => {
  const catalogs = ['pt_BR', 'en'].map((locale) => {
    const file = path.join(root, 'dist/extension/_locales', locale, 'messages.json');
    expect(existsSync(file)).toBe(true);
    return JSON.parse(readFileSync(file, 'utf8'));
  });
  expect(Object.keys(catalogs[0]).sort()).toEqual(Object.keys(catalogs[1]).sort());
  expect(catalogs[0].saveAlias.message).toBe('Salvar apelido');
  expect(catalogs[1].saveAlias.message).toBe('Save alias');
  for (const catalog of catalogs) {
    const html = readFileSync(path.join(root, 'popup/popup.html'), 'utf8');
    for (const match of html.matchAll(/data-i18n(?:-placeholder|-aria-label)?="([^"]+)"/g)) {
      expect(catalog[match[1]]?.message.length).toBeGreaterThan(0);
    }
  }
});
