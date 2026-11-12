import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test } from '@jest/globals';

const root = path.resolve(__dirname, '..');

function runBrowser(fixture: string, minimumChecks: number, browserArguments: string[] = []) {
  const temp = mkdtempSync(path.join(os.tmpdir(), 'wppd-browser-'));
  try {
    const entry = path.join(temp, 'test.html');
    writeFileSync(entry, fixture);
    const output = execFileSync(
      process.env.CHROME_BIN || '/usr/bin/google-chrome',
      [
        '--headless=new',
        ...browserArguments,
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
    assert.deepEqual(
      results.filter((result: { pass: boolean }) => !result.pass),
      [],
    );
    assert.ok(
      results.length >= minimumChecks,
      `Expected integration checks, received ${results.length}`,
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

test('master switch can recover from an initial settings read failure', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const scenario = `<script>
    setTimeout(async () => {
      const first = document.querySelector('.message-in');
      const masked = getComputedStyle(first).filter !== 'none';
      await chrome.storage.local.set({ settings: { enabled: false } });
      const restored = getComputedStyle(first).filter === 'none';
      const report = document.createElement('pre');
      report.id = 'test-results';
      report.textContent = JSON.stringify([{ name: 'initial read failure masks content', pass: masked }, { name: 'explicit disable overrides the failed initial read', pass: restored }]);
      document.body.append(report);
    }, 80);
  </script>`;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      'get: async () => structuredClone(stored)',
      "get: async () => { throw new Error('Initial read failure'); }",
    )
    .replace('</body>', `${scenario}</body>`);
  runBrowser(fixture, 2);
});

test('saved media-only preferences apply on initial load without masking conversation text', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const scenario = `<script>
    setTimeout(() => {
      const image = document.getElementById('saved-photo');
      const report = document.createElement('pre');
      report.id = 'test-results';
      report.textContent = JSON.stringify([
        { name: 'saved photo blur initializes', pass: getComputedStyle(image).filter !== 'none' },
        { name: 'chat overlay stays off', pass: !document.querySelector('[data-wppd-screen]') },
        { name: 'conversation text stays readable', pass: getComputedStyle(document.querySelector('.selectable-text')).filter === 'none' }
      ]);
      document.body.append(report);
    }, 100);
  </script>`;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      'blurChat: true, visibleArea: 40',
      'blurChat: false, blurImages: true, visibleArea: 40',
    )
    .replace(
      'Mensagem 1</div>',
      '<span class="selectable-text">Mensagem 1</span><img id="saved-photo" data-testid="image-thumb" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22/%3E"></div>',
    )
    .replace('</body>', `${scenario}</body>`);
  runBrowser(fixture, 3);
});

test('albums and mixed media remain protected through grouped messages and loading', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      '</body>',
      `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-media.js')).href}"></script></body>`,
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
    window.availableChats = ['Família Silva', 'Grupo Novo', ...Array.from({ length: 12 }, (_, index) => 'Contato ' + (index + 1))];
    window.rejectChats = false;
    chrome.tabs = {
      query: async () => [{ id: 23 }],
      sendMessage: async (tabId, request) => {
        if (window.rejectChats) throw new Error('No WhatsApp receiver');
        return { available: true, chats: window.availableChats, found: request.names.filter((name) => window.availableChats.includes(name)) };
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

test('screen protection follows the viewport instead of message counts or history position', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      '</body>',
      `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-screen.js')).href}"></script></body>`,
    );
  runBrowser(fixture, 13);
});

test('albums, info cards, carousels, galleries and opened media follow protection choices', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      '</body>',
      `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-surfaces.js')).href}"></script></body>`,
    );
  runBrowser(fixture, 17);
});

test('outgoing media previews stay usable and restore protection after closing', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      '</body>',
      `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-compose.js')).href}"></script></body>`,
    );
  runBrowser(fixture, 16);
});

test('sidebar lookup never scrolls or reorders the list and remembers user-loaded names', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      '</body>',
      `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-directory.js')).href}"></script></body>`,
    );
  runBrowser(fixture, 10);
});

test('sidebar preview protection leaves unread counters clear unless selected separately', () => {
  const base = pathToFileURL(path.join(root, 'fixtures/')).href;
  const fixture = readFileSync(path.join(root, 'fixtures/whatsapp.html'), 'utf8')
    .replace('<head>', `<head><base href="${base}">`)
    .replace(
      '</body>',
      `<script src="${pathToFileURL(path.join(root, 'dist/test-runtime/browser-sidebar.js')).href}"></script></body>`,
    );
  runBrowser(fixture, 15);
});

test('reduced motion keeps help feedback brief without switch movement or spinner rotation', () => {
  const css = pathToFileURL(path.join(root, 'dist/extension/popup/popup.css')).href;
  runBrowser(
    `<!doctype html><html><head><link rel="stylesheet" href="${css}"></head><body>
    <button id="help" class="help-button">Help</button>
    <input id="switch" role="switch" type="checkbox">
    <span id="spinner" class="loading-spinner"></span>
    <div id="info" class="info-popover" popover="manual">Explanation</div>
    <script>
      const info = document.getElementById('info');
      info.showPopover();
      const short = (style) => style.transitionDuration.split(',').every(value => parseFloat(value) <= 0.04);
      const results = [
        { name: 'reduced motion preference is active', pass: matchMedia('(prefers-reduced-motion: reduce)').matches },
        { name: 'help fade is brief', pass: short(getComputedStyle(info)) },
        { name: 'button feedback stays brief', pass: short(getComputedStyle(document.getElementById('help'))) },
        { name: 'switch movement is immediate', pass: getComputedStyle(document.getElementById('switch'), '::before').transitionProperty === 'none' },
        { name: 'spinner stops rotating', pass: getComputedStyle(document.getElementById('spinner')).animationName === 'none' }
      ];
      const report = document.createElement('pre'); report.id = 'test-results'; report.textContent = JSON.stringify(results); document.body.append(report);
    </script></body></html>`,
    5,
    ['--force-prefers-reduced-motion'],
  );
});
