import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Readable, Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { test } from '@jest/globals';
import sharp from 'sharp';
import { PipeClient } from '../scripts/lib/cdp';

test('rendered screen mask blurs only its area and preserves exempt media', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'wppm-pixels-'));
  const browser = spawn(
    process.env.CHROME_BIN || '/usr/bin/google-chrome',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-background-networking',
      '--remote-debugging-pipe',
      `--user-data-dir=${temp}/profile`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] },
  );
  const protocol = new PipeClient(browser.stdio[3] as Writable, browser.stdio[4] as Readable);
  try {
    const root = path.resolve(__dirname, '..');
    const html = (await readFile(path.join(root, 'fixtures/whatsapp.html'), 'utf8')).replace(
      '<head>',
      `<head><base href="${pathToFileURL(path.join(root, 'fixtures/')).href}">`,
    );
    const entry = path.join(temp, 'test.html');
    await writeFile(entry, html);
    const { targetId } = await protocol.send<{ targetId: string }>('Target.createTarget', {
      url: pathToFileURL(entry).href,
    });
    const { sessionId } = await protocol.send<{ sessionId: string }>('Target.attachToTarget', {
      targetId,
      flatten: true,
    });
    await protocol.send(
      'Emulation.setDeviceMetricsOverride',
      { width: 1000, height: 700, deviceScaleFactor: 1, mobile: false },
      sessionId,
    );
    const evaluate = async <T>(expression: string) => {
      const response = await protocol.send<{ result: { value: T }; exceptionDetails?: unknown }>(
        'Runtime.evaluate',
        { expression, returnByValue: true, awaitPromise: true },
        sessionId,
      );
      assert.equal(response.exceptionDetails, undefined);
      return response.result.value;
    };
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate<boolean>("document.documentElement.hasAttribute('data-wppm-ready')"))
        break;
      await delay(20);
    }
    const point = await evaluate<{ left: number; top: number }>(`(async () => {
      const history = document.getElementById('history');
      history.innerHTML = '<div class="message-in" style="position:relative;margin:0;padding:0;height:1000px;border-radius:0;background:repeating-linear-gradient(black 0px 2px,white 2px 4px)"><img data-testid="image-thumb" style="position:absolute;top:10px;left:10px;width:64px;height:64px"><div data-testid="video-thumb" style="position:absolute;top:10px;left:100px;width:64px;height:64px;background:repeating-linear-gradient(black 0px 2px,white 2px 4px)"></div></div>';
      const image = history.querySelector('img');
      image.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><pattern id="p" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="black"/><rect y="2" width="4" height="2" fill="white"/></pattern></defs><rect width="64" height="64" fill="url(#p)"/></svg>');
      await image.decode();
      await chrome.storage.local.set({ settings: { blurChat: false } });
      history.scrollTop = 0;
      const box = history.getBoundingClientRect();
      return { left: box.left, top: box.top };
    })()`);
    const screenshot = async () => {
      const response = await protocol.send<{ data: string }>(
        'Page.captureScreenshot',
        { format: 'png' },
        sessionId,
      );
      return Buffer.from(response.data, 'base64');
    };
    const original = await screenshot();
    await evaluate(
      'chrome.storage.local.set({ settings: { blurChat: true, visibleArea: 40, blurImages: false, alwaysBlurMedia: false } })',
    );
    const protectedImage = await screenshot();
    const crop = (buffer: Buffer, x: number, y: number) =>
      sharp(buffer).extract({
        left: Math.round(point.left + x),
        top: Math.round(point.top + y),
        width: 40,
        height: 40,
      });
    const baseline = await sharp(await crop(original, 220, 30).toBuffer()).stats();
    const hidden = await sharp(await crop(protectedImage, 220, 30).toBuffer()).stats();
    assert.ok(
      hidden.channels[0].stdev < baseline.channels[0].stdev * 0.3,
      `Protected pixels must actually blur: ${hidden.channels[0].stdev} / ${baseline.channels[0].stdev}`,
    );
    assert.deepEqual(
      await crop(protectedImage, 220, 185).raw().toBuffer(),
      await crop(original, 220, 185).raw().toBuffer(),
      'Pixels in the readable area must remain unchanged',
    );
    assert.deepEqual(
      await crop(protectedImage, 20, 20).raw().toBuffer(),
      await crop(original, 20, 20).raw().toBuffer(),
      'Exempt photo pixels must remain unchanged',
    );
    const video = await sharp(await crop(protectedImage, 110, 20).toBuffer()).stats();
    assert.ok(
      video.channels[0].stdev < baseline.channels[0].stdev * 0.3,
      'Exempt photos must not expose selected video pixels',
    );
    await evaluate(`(async () => {
      document.querySelector('#history img').setAttribute('data-testid', 'video-thumb');
      await Promise.resolve();
    })()`);
    const recycled = await screenshot();
    const recycledVideo = await sharp(await crop(recycled, 20, 20).toBuffer()).stats();
    assert.ok(
      recycledVideo.channels[0].stdev < baseline.channels[0].stdev * 0.3,
      'Recycled media must lose its previous photo exemption before painting',
    );
    await evaluate(`(() => {
      const history = document.getElementById('history');
      history.scrollTop = 400;
      history.dispatchEvent(new Event('scroll'));
    })()`);
    const scrolled = await screenshot();
    const scrolledTop = await sharp(await crop(scrolled, 220, 30).toBuffer()).stats();
    assert.ok(scrolledTop.channels[0].stdev < baseline.channels[0].stdev * 0.3);
    assert.deepEqual(
      await crop(scrolled, 220, 185).raw().toBuffer(),
      await crop(original, 220, 185).raw().toBuffer(),
      'Scrolling old content into the readable area must keep it sharp',
    );
  } finally {
    const closed = new Promise<void>((resolve) => browser.once('close', () => resolve()));
    try {
      await protocol.send('Browser.close');
    } catch {
      browser.kill();
    }
    await closed;
    await rm(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}, 20000);
