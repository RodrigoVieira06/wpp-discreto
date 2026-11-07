import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from '@jest/globals';
import * as model from '../src/settings';

test('invalid persisted settings cannot inject CSS or enable options accidentally', () => {
  assert.deepEqual(model.settings(null), {
    blurImages: false,
    blurVideos: false,
    blurStickers: false,
    alwaysBlurMedia: false,
    enabled: true,
    aliasesEnabled: true,
    language: 'auto',
    blurPreviews: false,
    blurChat: false,
    fullBlur: false,
    visibleArea: 40,
    blurStrength: 8,
  });
  assert.deepEqual(
    model.settings({
      blurPreviews: 'true',
      blurChat: true,
      fullBlur: false,
      visibleArea: 500,
      blurStrength: 'url(evil)',
    }),
    {
      blurImages: false,
      blurVideos: false,
      blurStickers: false,
      alwaysBlurMedia: false,
      enabled: true,
      aliasesEnabled: true,
      language: 'auto',
      blurPreviews: false,
      blurChat: true,
      fullBlur: false,
      visibleArea: 100,
      blurStrength: 8,
    },
  );
  assert.equal(model.settings({ visibleArea: -3, blurStrength: 0 }).visibleArea, 20);
  assert.equal(model.settings({ visibleArea: NaN, blurStrength: Infinity }).blurStrength, 8);
});

test('new preferences migrate existing settings and reject unsupported language values', () => {
  assert.deepEqual(model.settings({ enabled: false, aliasesEnabled: false, language: 'en' }), {
    blurImages: false,
    blurVideos: false,
    blurStickers: false,
    alwaysBlurMedia: false,
    enabled: false,
    aliasesEnabled: false,
    language: 'en',
    blurPreviews: false,
    blurChat: false,
    fullBlur: false,
    visibleArea: 40,
    blurStrength: 8,
  });
  assert.equal(model.settings({ language: 'es' }).language, 'auto');
  assert.equal(model.settings({ blurChat: true }).enabled, true);
});

test('aliases normalize Unicode, reject empty values and deduplicate exact names', () => {
  assert.deepEqual(
    model.aliases([
      { original: ' Cafe\u0301 ', alias: ' Time ' },
      { original: 'Café', alias: 'Outro' },
      null,
      { original: 'x', alias: ' ' },
    ]),
    [{ original: 'Café', alias: 'Time' }],
  );
  assert.deepEqual(model.aliases({}), []);
});

test('manifest limits execution to WhatsApp and references existing files', () => {
  const root = path.join(__dirname, '../dist/extension');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://web.whatsapp.com/*']);
  for (const file of [
    ...manifest.content_scripts[0].js,
    ...manifest.content_scripts[0].css,
    ...Object.values(manifest.icons),
    manifest.action.default_popup,
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
});

test('screen area migrates count-based settings without interpreting counts as percentages', () => {
  assert.equal(model.settings({ visibleCount: 12, blurChat: true }).visibleArea, 40);
  assert.equal(model.settings({ visibleArea: 0 }).visibleArea, 20);
  assert.equal(model.settings({ visibleArea: 0 }).fullBlur, true);
  assert.equal(model.settings({ visibleArea: 10 }).visibleArea, 20);
  assert.equal(model.settings({ visibleArea: 10 }).fullBlur, false);
  assert.equal(model.settings({ fullBlur: true, visibleArea: 60 }).visibleArea, 60);
  assert.equal(model.settings({ blurImages: true, alwaysBlurMedia: true }).blurImages, true);
  assert.equal(model.settings({ visibleArea: 100 }).visibleArea, 100);
});
