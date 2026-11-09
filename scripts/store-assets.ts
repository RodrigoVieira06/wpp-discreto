import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Readable, Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { strToU8, zipSync } from 'fflate';
import sharp from 'sharp';
import { PipeClient } from './lib/cdp.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'store');
await mkdir(output, { recursive: true });
const profile = await mkdtemp(path.join(os.tmpdir(), 'wppd-store-'));
const demoDir = path.join(profile, 'extension');
await cp(path.join(root, 'dist/extension'), demoDir, { recursive: true });
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
    '--enable-unsafe-extension-debugging',
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] },
);
if (!browser.stdio[3] || !browser.stdio[4]) throw new Error('Chrome debugging pipe unavailable.');
const protocol = new PipeClient(browser.stdio[3] as Writable, browser.stdio[4] as Readable);
const pngUrl = (data: Buffer) => `data:image/png;base64,${data.toString('base64')}`;
const evaluate = async <T = unknown>(session: string, expression: string): Promise<T> => {
  const result = await protocol.send<{ result: { value: T }; exceptionDetails?: unknown }>(
    'Runtime.evaluate',
    { expression, returnByValue: true, awaitPromise: true },
    session,
  );
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
};
async function target(url: string, width: number, height: number) {
  const { targetId } = await protocol.send<{ targetId: string }>('Target.createTarget', { url });
  const { sessionId } = await protocol.send<{ sessionId: string }>('Target.attachToTarget', {
    targetId,
    flatten: true,
  });
  await protocol.send(
    'Emulation.setDeviceMetricsOverride',
    { width, height, deviceScaleFactor: 1, mobile: false },
    sessionId,
  );
  await delay(180);
  return sessionId;
}
async function capture(session: string) {
  await delay(200);
  const { data } = await protocol.send<{ data: string }>(
    'Page.captureScreenshot',
    { format: 'png', captureBeyondViewport: false },
    session,
  );
  return Buffer.from(data, 'base64');
}
async function document(session: string, html: string) {
  const { frameTree } = await protocol.send<{ frameTree: { frame: { id: string } } }>(
    'Page.getFrameTree',
    {},
    session,
  );
  await protocol.send('Page.setDocumentContent', { frameId: frameTree.frame.id, html }, session);
}
async function exportPng(name: string, image: Buffer) {
  await sharp(image).removeAlpha().png().toFile(path.join(output, name));
}
const aliases = [{ original: 'Equipe Criativa', alias: 'Meu trabalho' }];
const baseSettings = {
  enabled: true,
  aliasesEnabled: true,
  language: 'pt_BR',
  blurChat: true,
  blurPreviews: true,
  visibleArea: 40,
  blurStrength: 8,
  blurImages: false,
  blurVideos: false,
  blurStickers: false,
  fullBlur: false,
};
try {
  const { id } = await protocol.send<{ id: string }>('Extensions.loadUnpacked', {
    path: demoDir,
  });
  const popupUrl = `chrome-extension://${id}/popup/popup.html`;
  const popup = await target(popupUrl, 380, 600);
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(popup, "document.getElementById('controls')?.disabled === false")) break;
    await delay(30);
  }
  await evaluate(
    popup,
    `chrome.storage.local.set(${JSON.stringify({ settings: baseSettings, aliases })})`,
  );
  await evaluate(
    popup,
    `chrome.tabs.query=async()=>[{id:1}];chrome.tabs.sendMessage=async()=>({available:true,chats:['Equipe Criativa','Família Ribeiro','Clara Almeida'],found:['Equipe Criativa']});`,
  );
  await evaluate(popup, `document.getElementById('fetch-chats').click()`);
  await delay(120);
  await evaluate(popup, "document.getElementById('chat-suggestions').hidden=true");
  const popupMain = await capture(popup);
  await evaluate(popup, "document.getElementById('settings-toggle').click();window.scrollTo(0,0)");
  const popupSettings = await capture(popup);
  await evaluate(
    popup,
    "document.getElementById('settings-toggle').click();document.getElementById('original-name').value='Equipe Criativa';document.getElementById('alias-name').value='Meu trabalho';document.getElementById('alias-list').scrollIntoView({block:'center'})",
  );
  const popupAliases = await capture(popup);

  // Synthetic landscapes contain no external or personal photos.
  const photo = async (sky: string, hill: string) =>
    sharp(
      Buffer.from(
        `<svg width="250" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="250" height="180" fill="${sky}"/><circle cx="185" cy="45" r="20" fill="#f5d59b"/><path d="M0 150 85 65 170 150 230 90 250 120V180H0Z" fill="${hill}"/><path d="M0 170 110 125 250 160V180H0Z" fill="#365c4d"/></svg>`,
      ),
    )
      .png()
      .toBuffer();
  let fixture = await readFile(path.join(root, 'scripts/store/conversation.html'), 'utf8');
  fixture = fixture
    .replace('__PHOTO_ONE__', pngUrl(await photo('#86b4b8', '#728a6c')))
    .replace('__PHOTO_TWO__', pngUrl(await photo('#bbbaa1', '#627d76')));
  const contentCss = await readFile(path.join(root, 'dist/extension/src/content.css'), 'utf8');
  await writeFile(
    path.join(demoDir, 'store-demo.html'),
    fixture
      .replace('</head>', `<style>${contentCss}</style></head>`)
      .replace('</body>', '<script src="src/content.js"></script></body>'),
  );
  const conversation = await target(`chrome-extension://${id}/store-demo.html`, 900, 650);
  await delay(160);
  await evaluate(conversation, "document.querySelector('.history').scrollTop=9999");
  await delay(120);
  const effects = await evaluate<{ overlay: boolean; alias: string | null }>(
    conversation,
    "({overlay:!!document.querySelector('[data-wppd-screen]'),alias:document.querySelector('#main header [title]').getAttribute('data-wppd-alias')})",
  );
  if (!effects.overlay || effects.alias !== 'Meu trabalho')
    throw new Error('Real extension effects did not initialize on the fixture.');
  const chat = await capture(conversation);
  await evaluate(
    popup,
    `chrome.storage.local.set({settings:${JSON.stringify({ ...baseSettings, blurImages: true, blurVideos: true, blurStickers: true })}})`,
  );
  await delay(200);
  const photoBlur = await evaluate<string>(
    conversation,
    "getComputedStyle(document.querySelector('.photos img')).filter",
  );
  if (!photoBlur.includes('blur')) throw new Error('Media protection did not apply.');
  const media = await capture(conversation);
  await evaluate(
    popup,
    "document.getElementById('settings-toggle').click();document.getElementById('blur-images').scrollIntoView({block:'center'})",
  );
  const popupMedia = await capture(popup);
  const stageCss = `*{box-sizing:border-box}body{margin:0;background:#111a19;color:#e8eeec;font:16px/1.5 Arial,sans-serif}header{height:120px;padding:24px 38px;border-bottom:1px solid #33453b}h1{font-size:29px;margin:0 0 6px;font-weight:600}p{margin:0;color:#aebfb6;font-size:16px}.layout{height:650px;display:flex;align-items:flex-start;gap:22px;padding:20px 30px}.chat{width:836px;height:604px;object-fit:fill;border:1px solid #33453b;border-radius:9px}.popup{width:350px;height:553px;object-fit:fill;border:1px solid #33453b;border-radius:9px}.note{position:absolute;bottom:12px;left:38px;color:#aebfb6;font-size:12px}.settings-layout{display:flex;gap:34px;padding:24px 42px}.intro{width:340px;padding-top:80px}.intro h2{font-size:27px;line-height:1.25;margin:0 0 24px}.intro p{margin-bottom:20px;font-size:17px}.settings-layout img{width:350px;height:553px;border:1px solid #33453b;border-radius:9px}`;
  async function screenshot(name: string, title: string, subtitle: string, body: string) {
    const stage = await target('about:blank', 1280, 800);
    await document(
      stage,
      `<!doctype html><html lang="pt-BR"><meta charset="UTF-8"><style>${stageCss}</style><header><h1>${title}</h1><p>${subtitle}</p></header>${body}<div class="note">Wpp Discreto · Demonstração com conversas fictícias</div></html>`,
    );
    await evaluate(
      stage,
      'Promise.all([...document.images].map(image=>image.decode())).then(()=>window.scrollTo(0,0))',
    );
    await exportPng(name, await capture(stage));
  }
  await screenshot(
    'screenshot-01-conversation.png',
    'Escolha a área da conversa que fica visível',
    'Desfoque as prévias da lista e mantenha a parte inferior da conversa legível.',
    `<div class="layout"><img class="chat" src="${pngUrl(chat)}"><img class="popup" src="${pngUrl(popupMain)}"></div>`,
  );
  await screenshot(
    'screenshot-02-media.png',
    'Fotos, vídeos e figurinhas sob seu controle',
    'Os tipos selecionados ficam embaçados por inteiro, inclusive na área legível.',
    `<div class="layout"><img class="chat" src="${pngUrl(media)}"><img class="popup" src="${pngUrl(popupMedia)}"></div>`,
  );
  await screenshot(
    'screenshot-03-settings-aliases.png',
    'Ajuste o desfoque e use apelidos locais',
    'Suas escolhas ficam neste navegador. Os dados originais do WhatsApp continuam iguais.',
    `<div class="settings-layout"><div class="intro"><h2>Configurações e apelidos</h2><p>Defina a intensidade e a área visível da conversa.</p><p>Escolha as mídias que quer embaçar.</p><p>Renomeie grupos e contatos para você.</p></div><img src="${pngUrl(popupSettings)}"><img src="${pngUrl(popupAliases)}"></div>`,
  );
  await sharp(path.join(root, 'assets/logo.png'))
    .trim({ background: '#00000000', threshold: 10 })
    .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 16,
      bottom: 16,
      left: 16,
      right: 16,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(output, 'store-icon-128.png'));
  const names = [
    'store-icon-128.png',
    'screenshot-01-conversation.png',
    'screenshot-02-media.png',
    'screenshot-03-settings-aliases.png',
    'promo-small-440x280.png',
    'promo-marquee-1400x560.png',
    'listing.pt-BR.txt',
  ];
  const entries: Record<string, Uint8Array> = {
    'README.txt': strToU8(
      'Wpp Discreto store listing assets. Screenshots use synthetic conversations with the actual extension code. Upload the extension ZIP separately.\n',
    ),
  };
  for (const name of names) {
    try {
      entries[name] = await readFile(path.join(output, name));
    } catch (error) {
      if (!name.startsWith('promo-')) throw error;
    }
  }
  await mkdir(path.join(root, 'dist'), { recursive: true });
  await writeFile(path.join(root, 'dist/wpp-discreto-store-assets.zip'), zipSync(entries));
  console.log('Store screenshots, icon, and upload bundle generated.');
} finally {
  const closed = new Promise((resolve) => browser.once('close', resolve));
  try {
    await protocol.send('Browser.close');
  } catch {
    browser.kill();
  }
  await closed;
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
