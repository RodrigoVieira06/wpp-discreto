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

test('rendered screen mask covers chat media and suspends behind the media viewer', async () => {
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
      history.innerHTML = '<div class="message-in" style="position:relative;margin:0;padding:0;height:1000px;border-radius:0;background:repeating-linear-gradient(black 0px 2px,white 2px 4px)"><img data-testid="image-thumb" style="position:absolute;z-index:2147483647;top:10px;left:10px;width:64px;height:240px"><div data-testid="video-thumb" style="position:absolute;top:10px;left:100px;width:64px;height:64px;background:repeating-linear-gradient(black 0px 2px,white 2px 4px)"></div></div>';
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
      'chrome.storage.local.set({ settings: { blurChat: true, visibleArea: 40, blurImages: false, blurVideos: true, alwaysBlurMedia: false } })',
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
    const photoTop = await sharp(await crop(protectedImage, 20, 20).toBuffer()).stats();
    const originalPhoto = await sharp(await crop(original, 20, 20).toBuffer()).stats();
    assert.ok(
      photoTop.channels[0].stdev < originalPhoto.channels[0].stdev * 0.3,
      'Allowed photos must still blur inside the protected screen area',
    );
    assert.deepEqual(
      await crop(protectedImage, 20, 185).raw().toBuffer(),
      await crop(original, 20, 185).raw().toBuffer(),
      'Only the part of an allowed photo below the screen boundary becomes readable',
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
    const recycledVideo = await sharp(await crop(recycled, 20, 185).toBuffer()).stats();
    assert.ok(
      recycledVideo.channels[0].stdev < baseline.channels[0].stdev * 0.3,
      'Selected video pixels must stay blurred in the readable area, even with a legacy false always flag',
    );
    await evaluate(`(async () => {
      document.querySelector('#history img').setAttribute('data-testid', 'image-thumb');
      const viewer = document.createElement('div');
      viewer.dataset.testid = 'media-viewer';
      viewer.style.cssText = 'position:fixed;inset:0;background:#111;z-index:1000';
      viewer.innerHTML = '<img style="width:100%;height:100%">';
      viewer.querySelector('img').src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><defs><pattern id="p" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="black"/><rect y="2" width="4" height="2" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#p)"/></svg>');
      document.body.append(viewer);
      await viewer.querySelector('img').decode();
      await chrome.storage.local.set({ settings: { blurChat: false } });
    })()`);
    const viewerOriginal = await screenshot();
    await evaluate(
      'chrome.storage.local.set({ settings: { blurChat: true, visibleArea: 40, blurImages: false, blurVideos: true } })',
    );
    const viewerAllowed = await screenshot();
    for (const y of [30, 185, 380]) {
      assert.ok(
        (await crop(viewerAllowed, 220, y).raw().toBuffer()).equals(
          await crop(viewerOriginal, 220, y).raw().toBuffer(),
        ),
        'An allowed opened image must be clear across the entire viewer',
      );
    }
    assert.equal(await evaluate("!!document.querySelector('[data-wppm-screen]')"), false);
    await evaluate(
      'chrome.storage.local.set({ settings: { blurChat: true, blurImages: true, alwaysBlurMedia: false } })',
    );
    const viewerHidden = await screenshot();
    for (const y of [30, 185, 380]) {
      const before = await sharp(await crop(viewerOriginal, 220, y).toBuffer()).stats();
      const after = await sharp(await crop(viewerHidden, 220, y).toBuffer()).stats();
      assert.ok(
        after.channels[0].stdev < before.channels[0].stdev * 0.3,
        'A selected opened image must blur entirely, not just the previous chat rectangle',
      );
    }
    await evaluate(`(async () => {
      document.querySelector('[data-testid="media-viewer"]').remove();
      await chrome.storage.local.set({ settings: { blurChat: true, visibleArea: 40 } });
    })()`);
    assert.equal(await evaluate("!!document.querySelector('[data-wppm-screen]')"), true);
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
    const regions = await evaluate<{
      audio: { left: number; top: number };
      panel: { left: number; top: number };
      background: { left: number; top: number };
    }>(`(async () => {
      const history = document.getElementById('history');
      history.scrollTop = 0;
      history.innerHTML = '<div class="message-in" style="height:1000px;margin:0;padding:0;background:none"><div data-testid="audio-player" style="width:180px;height:70px;background:repeating-linear-gradient(black 0px 2px,white 2px 4px)"><canvas width="180" height="70"></canvas></div><div id="background-tile" style="width:180px;height:70px;background-image:repeating-linear-gradient(black 0px 2px,white 2px 4px)"><span data-icon="video-play"></span></div></div>';
      const panel = document.createElement('aside');
      panel.dataset.testid = 'drawer-right';
      panel.style.cssText = 'position:fixed;left:850px;top:100px;width:120px;height:160px';
      panel.innerHTML = '<div data-testid="image-thumb" style="height:70px;background-image:repeating-linear-gradient(black 0px 2px,white 2px 4px)"></div>';
      document.body.append(panel);
      await chrome.storage.local.set({ settings: { blurChat: false } });
      const point = (element) => { const rect = element.getBoundingClientRect(); return { left: rect.left + 15, top: rect.top + 15 }; };
      return { audio: point(history.querySelector('[data-testid="audio-player"]')), panel: point(panel.firstElementChild), background: point(document.getElementById('background-tile')) };
    })()`);
    const surfaceOriginal = await screenshot();
    await evaluate(
      'chrome.storage.local.set({ settings: { blurChat: true, fullBlur: true, blurImages: true, blurVideos: true, blurStickers: true, alwaysBlurMedia: true } })',
    );
    const surfaceProtected = await screenshot();
    const extract = (buffer: Buffer, region: { left: number; top: number }) =>
      sharp(buffer).extract({
        left: Math.round(region.left),
        top: Math.round(region.top),
        width: 40,
        height: 40,
      });
    const audioOriginal = await extract(surfaceOriginal, regions.audio).raw().toBuffer();
    const audioProtected = await extract(surfaceProtected, regions.audio).raw().toBuffer();
    const meanDifference =
      audioOriginal.reduce(
        (sum, value, index) => sum + Math.abs(value - audioProtected[index]),
        0,
      ) / audioOriginal.length;
    // A composited backdrop layer can round color channels by a few values.
    assert.ok(
      meanDifference < 2,
      `Audio controls must remain sharp; mean pixel difference: ${meanDifference}`,
    );
    for (const name of ['panel', 'background'] as const) {
      const sharpPixels = await sharp(
        await extract(surfaceOriginal, regions[name]).toBuffer(),
      ).stats();
      const maskedPixels = await sharp(
        await extract(surfaceProtected, regions[name]).toBuffer(),
      ).stats();
      assert.ok(
        maskedPixels.channels[0].stdev < sharpPixels.channels[0].stdev * 0.3,
        `${name} media pixels must actually blur`,
      );
    }
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
