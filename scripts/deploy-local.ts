import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Readable, Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { PipeClient } from './lib/cdp.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const smoke = process.argv.includes('--smoke-test');
const extension = path.join(root, 'dist/extension');
let temporaryProfile: string | undefined;
let browser: ReturnType<typeof spawn> | undefined;
let protocol: PipeClient | undefined;

async function closeBrowser() {
  if (!browser?.pid || browser.exitCode !== null || browser.signalCode !== null) return;
  const exited = new Promise<void>((resolve) => browser?.once('close', () => resolve()));
  const timer = setTimeout(() => browser?.kill('SIGTERM'), 2000);
  try {
    await protocol?.send('Browser.close');
  } catch {
    browser.kill('SIGTERM');
  }
  await exited;
  clearTimeout(timer);
}

async function main() {
  await access(path.join(extension, 'manifest.json'));
  if (smoke) temporaryProfile = await mkdtemp(path.join(os.tmpdir(), 'wppd-local-'));
  const profile = temporaryProfile ?? path.join(root, '.local/chrome-profile');
  await mkdir(profile, { recursive: true });
  browser = spawn(
    process.env.CHROME_BIN || '/usr/bin/google-chrome',
    [
      `--user-data-dir=${profile}`,
      '--remote-debugging-pipe',
      '--enable-unsafe-extension-debugging',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      ...(smoke
        ? ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        : []),
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] },
  );
  let diagnostics = '';
  browser.stderr?.on('data', (chunk) => {
    diagnostics = (diagnostics + String(chunk)).slice(-4000);
  });
  await new Promise<void>((resolve, reject) => {
    browser?.once('spawn', resolve);
    browser?.once('error', reject);
  });
  protocol = new PipeClient(browser.stdio[3] as Writable, browser.stdio[4] as Readable);
  process.once('SIGINT', () => {
    void closeBrowser();
  });
  process.once('SIGTERM', () => {
    void closeBrowser();
  });
  try {
    const result = await protocol.send<{ id: string }>('Extensions.loadUnpacked', {
      path: extension,
    });
    if (smoke) {
      const { targetId } = await protocol.send<{ targetId: string }>('Target.createTarget', {
        url: `chrome-extension://${result.id}/popup/popup.html`,
      });
      const { sessionId } = await protocol.send<{ sessionId: string }>('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
      let popupReady = false;
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline && !popupReady) {
        try {
          const evaluation = await protocol.send<{ result: { value?: boolean } }>(
            'Runtime.evaluate',
            {
              expression: "document.getElementById('controls')?.disabled === false",
              returnByValue: true,
            },
            sessionId,
          );
          popupReady = evaluation.result.value === true;
        } catch (error) {
          // The target can replace its initial blank-page execution context while navigating.
          if (!(error instanceof Error) || !/context/i.test(error.message)) throw error;
        }
        if (!popupReady) await delay(50);
      }
      if (!popupReady) throw new Error('Extension popup failed to initialize.');
      const popupLayout = [];
      for (const [height, fontSize] of [
        [160, 15],
        [600, 15],
        [160, 18],
        [600, 18],
      ]) {
        await protocol.send(
          'Runtime.evaluate',
          {
            expression: `(async () => { const { settings } = await chrome.storage.local.get('settings'); await chrome.storage.local.set({ settings: { ...settings, fontSize: ${fontSize} } }); })()`,
            awaitPromise: true,
          },
          sessionId,
        );
        await delay(40);
        await protocol.send(
          'Emulation.setDeviceMetricsOverride',
          {
            width: 380,
            height,
            deviceScaleFactor: 1,
            mobile: false,
          },
          sessionId,
        );
        const evaluation = await protocol.send<{ result: { value: unknown } }>(
          'Runtime.evaluate',
          {
            expression: `(() => {
              const main = document.querySelector('main');
              const reachable = (selector) => {
                const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
                element.scrollIntoView({ block: 'center' });
                const rect = element.getBoundingClientRect();
                const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
                const visibleTop = Math.max(headerBottom, parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop));
                if (rect.height <= innerHeight - visibleTop) return rect.height > 0 && rect.top >= headerBottom && rect.bottom <= innerHeight;
                // A long paragraph can exceed a short viewport; both ends must remain reachable.
                // Fractional font metrics can round integer scroll offsets by less than one pixel.
                element.scrollIntoView({ block: 'start' });
                const start = element.getBoundingClientRect().top;
                element.scrollIntoView({ block: 'end' });
                const end = element.getBoundingClientRect().bottom;
                return start >= headerBottom && start < innerHeight && end <= innerHeight + 1 && end > headerBottom;
              };
              const controlsExpanded = main.getBoundingClientRect().height > 300;
              const widthPreserved = innerWidth === 380 && document.body.getBoundingClientRect().width <= 380;
              const noHorizontalOverflow = document.documentElement.scrollWidth <= document.documentElement.clientWidth;
              const switchTargetsAccessible = [...document.querySelectorAll('input[role="switch"]')].filter(node => node.getBoundingClientRect().width > 0).every(node => node.getBoundingClientRect().height >= 24);
              const switchesAligned = Math.abs(document.getElementById('advanced-blur').getBoundingClientRect().right - document.getElementById('blur-chat').getBoundingClientRect().right) < 1;
              const masterReachable = reachable('#extension-enabled');
              document.getElementById('add-alias').click();
              const saveReachable = reachable('#alias-form button');
              document.getElementById('cancel-alias').click();
              const footerReachable = [...document.querySelector('footer').children].every(reachable);
              const header = document.querySelector('header').getBoundingClientRect();
              const headerPinned = Math.abs(header.top) < 1 && header.bottom <= innerHeight;
              document.getElementById('settings-toggle').click();
              const panelTop = document.getElementById('settings-panel').getBoundingClientRect().top;
              const headerBottom = document.querySelector('header').getBoundingClientRect().bottom;
              const settingsScrolled = panelTop >= headerBottom && panelTop <= headerBottom + 16;
              const settingsReachable = reachable('#visible-area');
              document.getElementById('settings-back').click();
              document.getElementById('media-help').focus();
              const help = document.getElementById('info-popover').getBoundingClientRect();
              const helpContained = help.width > 0 && help.top >= 0 && help.bottom <= innerHeight && help.left >= 0 && help.right <= innerWidth;
              document.getElementById('media-help').blur();
              window.scrollTo(0, 0);
              return { height: innerHeight, fontSize: parseFloat(getComputedStyle(document.documentElement).fontSize), controlsExpanded, widthPreserved,
                masterReachable, saveReachable, footerReachable, settingsReachable,
                noHorizontalOverflow, helpContained, switchTargetsAccessible, switchesAligned, headerPinned, settingsScrolled };
            })()`,
            returnByValue: true,
          },
          sessionId,
        );
        popupLayout.push(evaluation.result.value);
      }
      console.log(JSON.stringify({ extensionId: result.id, popupReady: true, popupLayout }));
      await closeBrowser();
    } else {
      await protocol.send('Target.createTarget', { url: 'chrome://extensions/' });
      await protocol.send('Target.createTarget', { url: 'https://web.whatsapp.com/' });
      console.log(
        `Wpp Discreto loaded: ${result.id}\nTest profile: ${profile}\nSign in to WhatsApp in this window. Close it or press Ctrl+C to stop.\nAfter rebuilding, close this session and run make deploy-local again.`,
      );
      await new Promise<void>((resolve) => browser?.once('close', () => resolve()));
    }
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n${diagnostics}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `Local deployment failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
} finally {
  await closeBrowser();
  if (temporaryProfile)
    await rm(temporaryProfile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
