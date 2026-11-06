import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from '@jest/globals';

const root = path.resolve(__dirname, '..');

function runBrowser(fixture: string, minimumChecks: number) {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'wppm-browser-'));
  try {
    const entry = path.join(temp, 'test.html');
    writeFileSync(entry, fixture);
    const output = execFileSync(
      process.env.CHROME_BIN || '/usr/bin/google-chrome',
      [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--no-first-run',
        '--disable-background-networking',
        '--disable-dev-shm-usage',
        '--run-all-compositor-stages-before-draw',
        '--disable-renderer-backgrounding',
        '--virtual-time-budget=4000',
        `--user-data-dir=${temp}/profile`,
        '--dump-dom',
        pathToFileURL(entry).href,
      ],
      {
        encoding: 'utf8',
        timeout: 25000,
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 2 * 1024 * 1024,
      },
    );
    const report = output.match(/<pre id="test-results">([\s\S]*?)<\/pre>/);
    assert.ok(report, 'Browser must finish tests and emit report');
    const results = JSON.parse(
      report[1].replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&'),
    );
    assert.ok(
      results.length >= minimumChecks,
      `Expected integration checks, received ${results.length}`,
    );
    assert.deepEqual(
      results.filter((result: { pass: boolean }) => !result.pass),
      [],
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

test('Chrome integration: masking, scrolling, live updates, aliases and DOM recycling', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      '</body>',
      `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-content.js')).href}"></script></body>`,
    );
  runBrowser(fixture, 20);
});

test.each([
  ['pt-BR', 'pt_BR', 'pt-BR', 'Salvar apelido'],
  ['pt-PT', 'pt_BR', 'pt-BR', 'Salvar apelido'],
  ['en-US', 'en', 'en', 'Save alias'],
  ['es-ES', 'pt_BR', 'pt-BR', 'Salvar apelido'],
])(
  'Chrome popup in %s: localization, controls, aliases and storage failures',
  (browserLanguage, catalogLocale, documentLanguage, saveLabel) => {
    const mock = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
      .match(/<script>([\s\S]*?)<\/script>/)?.[1]
      .replace(
        'const changes = {};',
        "if (window.failNextSave) { window.failNextSave = false; throw new Error('Simulated storage error'); } const changes = {};",
      );
    const catalog = JSON.parse(
      readFileSync(path.join(root, '_locales', catalogLocale, 'messages.json'), 'utf8'),
    );
    const localizationMock = `
    const catalog = ${JSON.stringify(catalog)};
    window.expectedMessages = Object.fromEntries(Object.entries(catalog).map(([key, entry]) => [key, entry.message]));
    window.expectedLanguage = ${JSON.stringify(documentLanguage)};
    window.expectedSaveLabel = ${JSON.stringify(saveLabel)};
    chrome.i18n = {
      getUILanguage: () => ${JSON.stringify(browserLanguage)},
      getMessage: (key, substitutions = []) => {
        const entry = catalog[key];
        const values = typeof substitutions === 'string' ? [substitutions] : substitutions;
        return entry?.message.replace(/\\$([a-z_]+)\\$/gi, (_, name) =>
          entry.placeholders[name.toLowerCase()].content.replace(/\\$(\\d+)/g, (_, index) => values[Number(index) - 1] ?? '')
        ) ?? '';
      }
    };
  `;
    const base = pathToFileURL(path.join(root, 'dist/extension/popup/')).href;
    const fixture = readFileSync(path.join(root, 'dist/extension/popup/popup.html'), 'utf8')
      .replace('<head>', `<head><base href="${base}"><script>${mock}${localizationMock}</script>`)
      .replace(
        '</head>',
        `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-popup.js')).href}" defer></script></head>`,
      );
    runBrowser(fixture, 14);
  },
);
