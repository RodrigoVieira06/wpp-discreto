import { execFileSync, spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import type { Readable, Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { strToU8, zipSync } from 'fflate';
import sharp from 'sharp';
import { PipeClient } from './lib/cdp.ts';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const output = path.join(root, 'store');
const sources = path.join(output, 'sources');
const work = path.join(root, '.local/store-render');
await mkdir(sources, { recursive: true });
await mkdir(work, { recursive: true });
await cp(path.join(root, 'dist/extension'), path.join(work, 'extension'), { recursive: true });

const base = {
  enabled: true,
  aliasesEnabled: true,
  confirmAliasRemoval: true,
  language: 'pt_BR',
  theme: 'dark',
  fontSize: 15,
  blurChat: true,
  blurPreviews: true,
  blurUnreadCounts: false,
  visibleArea: 40,
  blurStrength: 8,
  fullBlur: false,
  blurImages: false,
  blurVideos: false,
  blurStickers: false,
};
const aliases = [{ original: 'Equipe Criativa', alias: 'Meu trabalho' }];
const mock = (settings: object, savedAliases = aliases) => `<script>
const stored = ${JSON.stringify({ settings, aliases: savedAliases })};
const listeners = new Set();
window.chrome = {
  runtime:{id:'store-demo',onMessage:{addListener:()=>{}}},
  i18n:{getUILanguage:()=> 'pt-BR'},
  storage:{local:{get:async()=>structuredClone(stored),set:async next=>{
    const changes={}; for(const [key,value] of Object.entries(next)){changes[key]={newValue:value};stored[key]=value;}
    listeners.forEach(listener=>listener(changes,'local'));
  }},onChanged:{addListener:listener=>listeners.add(listener)}},
  tabs:{query:async()=>[{id:1}],sendMessage:async()=>({available:true,chats:['Equipe Criativa','Família Ribeiro','Clara Almeida'],found:['Equipe Criativa']})}
};
</script>`;
const popupHtml = await readFile(path.join(root, 'popup/popup.html'), 'utf8');
async function popup(name: string, settings: object, action = '', savedAliases = aliases) {
  const ready = `<script>window.addEventListener('load',()=>{
    let attempts=0; const timer=setInterval(()=>{
      if(++attempts>100){clearInterval(timer);throw new Error('Popup not initialized');}
      if(document.getElementById('controls').disabled)return;
      clearInterval(timer);${action};document.activeElement?.blur();
    },20);
  });</script>`;
  await writeFile(
    path.join(work, `extension/popup/${name}.html`),
    popupHtml
      .replace('<head>', `<head>${mock(settings, savedAliases)}`)
      .replace('</body>', `${ready}</body>`),
  );
  return `../.local/store-render/extension/popup/${name}.html`;
}
const mainDark = await popup('main-dark', base, '', []);
const mainLight = await popup('main-light', { ...base, theme: 'light' }, '', []);
const mediaSettings = {
  ...base,
  blurChat: false,
  blurImages: true,
  blurVideos: true,
  blurStickers: true,
};
const media = await popup(
  'media',
  mediaSettings,
  "document.getElementById('settings-toggle').click();document.getElementById('blur-images').closest('fieldset').scrollIntoView({block:'start'})",
);
const alias = await popup(
  'aliases',
  { ...base, blurChat: false, blurPreviews: false },
  "document.querySelector('#alias-list .edit').click();document.getElementById('alias-editor').scrollIntoView({block:'start'})",
);
const general =
  "document.getElementById('settings-toggle').click();document.getElementById('font-size').closest('fieldset').scrollIntoView({block:'start'})";
const textDefault = await popup('text-default', { ...base, theme: 'light' }, general);
const textLarge = await popup('text-large', { ...base, theme: 'light', fontSize: 18 }, general);

let fixture = await readFile(path.join(root, 'scripts/store/conversation.html'), 'utf8');
// These existing demonstration illustrations are fictional media, not customer photographs.
const illustration = (sky: string, hill: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg width="250" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="250" height="180" fill="${sky}"/><circle cx="185" cy="45" r="20" fill="#f5d59b"/><path d="M0 150 85 65 170 150 230 90 250 120V180H0Z" fill="${hill}"/><path d="M0 170 110 125 250 160V180H0Z" fill="#365c4d"/></svg>`)}`;
fixture = fixture
  .replace('__PHOTO_ONE__', illustration('#86b4b8', '#728a6c'))
  .replace('__PHOTO_TWO__', illustration('#bbbaa1', '#627d76'));
const contentCss = await readFile(path.join(root, 'dist/extension/src/content.css'), 'utf8');
for (const [name, settings] of [
  ['conversation', base],
  ['media-chat', mediaSettings],
  ['alias-chat', { ...base, blurChat: false, blurPreviews: false }],
] as const) {
  const html = fixture
    .replace('<head>', `<head>${mock(settings, name === 'conversation' ? [] : aliases)}`)
    .replace(
      '</head>',
      `<style>${contentCss}</style><style>html,body{height:100%;overflow:hidden}#app{height:100%}.history{padding:18px 24px}.sender{color:#83d4bd}.preview{display:flex;gap:8px;justify-content:space-between}.preview-copy{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}.unread{display:inline-grid;place-items:center;border-radius:12px;background:#25d366;color:#10251a;min-width:22px;height:22px;font-size:12px;flex-shrink:0}</style></head>`,
    )
    .replace(
      '<div role="gridcell" class="preview">Marina: Podemos seguir com a proposta.</div>',
      '<div role="gridcell" class="preview"><span class="preview-copy">Marina: Podemos seguir com a proposta.</span><span class="unread" data-testid="icon-unread-count">3</span></div>',
    )
    .replace(
      '</body>',
      `<script src="src/content.js"></script><script>window.addEventListener('load',()=>setTimeout(()=>{document.querySelector('.history').scrollTop=9999;},200));</script></body>`,
    );
  await writeFile(path.join(work, `extension/${name}.html`), html);
}

const frame = (src: string, kind = 'popup') =>
  `<div class="frame ${kind}"><iframe title="Demonstração fictícia" src="${src}"></iframe></div>`;
const logo = '../assets/logo.png';
const brand = `<div class="brand"><img src="${logo}" alt=""><span>Wpp Discreto</span></div>`;
const stylesheet = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{font:18px/1.45 system-ui,sans-serif;background:#111a19;color:#e8eeec}header{height:130px;padding:28px;display:flex;align-items:flex-start;justify-content:space-between;gap:24px}h1{font-size:34px;line-height:1.2;margin:0 0 10px;font-weight:650;letter-spacing:-.5px}header p{margin:0;color:#b9c9bf;font-size:18px}.brand{display:flex;align-items:center;gap:10px;white-space:nowrap;font-size:17px;font-weight:650}.brand img{width:40px;height:40px;object-fit:contain}.stage{display:flex;gap:24px;margin:0 28px;align-items:flex-start}.frame{outline:1px solid #607c6b;border-radius:10px;overflow:hidden;flex-shrink:0}.frame iframe{display:block;width:100%;height:100%;border:0}.popup{width:380px;height:600px}.chat{width:820px;height:600px}.footnote{position:absolute;left:28px;bottom:8px;font-size:13px;color:#b9c9bf}.pair{justify-content:center;gap:44px}.pair h2{font-size:19px;font-weight:600;margin:0 0 12px}.pair .popup{height:600px}.media-stage .frame{height:550px}.light{background:#eef5f0;color:#182c22}.light header p,.light .footnote{color:#4a6655}.small{padding:28px;background:#111a19}.small .brand{gap:18px;font-size:29px}.small .brand img{width:80px;height:80px}.small p{font-size:23px;line-height:1.35;margin:28px 0 0;max-width:370px}.small .features{font-size:16px;color:#b9c9bf;margin-top:20px}.marquee{padding:56px;display:flex;justify-content:space-between;gap:40px;align-items:center}.marquee .brand{font-size:46px;gap:20px}.marquee .brand img{width:100px;height:100px}.marquee h1{font-size:32px;line-height:1.35;margin:34px 0 20px;max-width:720px;letter-spacing:0}.marquee p{font-size:22px;color:#b9c9bf;max-width:650px}.marquee .popup{height:430px}`;
interface Job {
  name: string;
  file: string;
  width: number;
  height: number;
}
const jobs: Job[] = [];
async function stage(name: string, title: string, subtitle: string, body: string, light = false) {
  const file = path.join(sources, `${name}.html`);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${stylesheet}</style></head><body class="${light ? 'light' : ''}"><header><div><h1>${title}</h1><p>${subtitle}</p></div>${brand}</header>${body}<div class="footnote">Demonstração com conversas fictícias · Wpp Discreto</div></body></html>`;
  // Source pages live one directory below store; keep every referenced path local.
  await writeFile(
    file,
    html.replaceAll('../.local/', '../../.local/').replaceAll('../assets/', '../../assets/'),
  );
  jobs.push({ name: `${name}.png`, file, width: 1280, height: 800 });
}
const chatPath = (name: string) => `../.local/store-render/extension/${name}.html`;
await stage(
  'screenshot-01-conversation',
  'Ajuste a área legível da conversa',
  'Mantenha de 20% a 100% da parte inferior visível.',
  `<div class="stage">${frame(chatPath('conversation'), 'chat')}${frame(mainDark)}</div>`,
);
await stage(
  'screenshot-02-media',
  'Proteção de mídias com texto legível',
  'Escolha fotos, vídeos e figurinhas nas configurações.',
  `<div class="stage media-stage">${frame(chatPath('media-chat'), 'chat')}${frame(media)}</div>`,
);
await stage(
  'screenshot-03-settings-aliases',
  'Apelidos que só aparecem para você',
  'Os nomes originais continuam iguais no WhatsApp.',
  `<div class="stage">${frame(chatPath('alias-chat'), 'chat')}${frame(alias)}</div>`,
);
await stage(
  'screenshot-04-themes',
  'Escolha entre tema claro e escuro',
  'O modo automático acompanha a preferência do sistema.',
  `<div class="stage pair"><div><h2>Escuro</h2>${frame(mainDark)}</div><div><h2>Claro</h2>${frame(mainLight)}</div></div>`,
  true,
);
await stage(
  'screenshot-05-text-size',
  'Ajuste o tamanho do texto da extensão',
  'Escolha de 14 a 18 px, sem alterar o texto do WhatsApp.',
  `<div class="stage pair"><div><h2>Padrão · 15 px</h2>${frame(textDefault)}</div><div><h2>Maior · 18 px</h2>${frame(textLarge)}</div></div>`,
  true,
);
for (const [name, width, height, html] of [
  [
    'promo-small-440x280',
    440,
    280,
    `<body class="small">${brand}<p>Desfoque e apelidos<br>para o WhatsApp Web</p><div class="features">Temas claro e escuro</div></body>`,
  ],
  [
    'promo-marquee-1400x560',
    1400,
    560,
    `<body class="marquee"><div>${brand}<h1>Desfoque e apelidos<br>para o WhatsApp Web</h1><p>Escolha as mídias, a área legível<br>e o tema da extensão.</p></div>${frame(mainLight)}</body>`,
  ],
] as const) {
  const file = path.join(sources, `${name}.html`);
  await writeFile(
    file,
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Wpp Discreto</title><style>${stylesheet}</style>${html}</html>`
      .replaceAll('../.local/', '../../.local/')
      .replaceAll('../assets/', '../../assets/'),
  );
  jobs.push({ name: `${name}.png`, file, width, height });
}

const renderer = process.env.STORE_SCREENSHOT_RENDERER;
if (renderer) {
  for (const job of jobs) {
    if (process.env.STORE_ASSET_FILTER && !job.name.startsWith(process.env.STORE_ASSET_FILTER))
      continue;
    execFileSync(
      process.execPath,
      [
        renderer,
        '--url',
        job.file,
        '--root',
        root,
        '--w',
        String(job.width),
        '--h',
        String(job.height),
        '--wait',
        '1000',
        '--no-tiles',
        '--out',
        path.join(output, job.name),
      ],
      { stdio: 'inherit', timeout: 600000 },
    );
  }
} else {
  // Portable project renderer; a supplied skill renderer can replace only the capture step.
  const server = createServer(async (request, response) => {
    try {
      const name = path.resolve(
        root,
        `.${decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)}`,
      );
      if (!name.startsWith(`${root}${path.sep}`)) throw new Error('Outside root');
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.png': 'image/png',
      };
      response.setHeader('Content-Type', types[path.extname(name)] ?? 'application/octet-stream');
      response.end(await readFile(name));
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Missing render port');
  const profile = await mkdtemp(path.join(os.tmpdir(), 'wppd-store-'));
  const browser = spawn(
    process.env.CHROME_BIN || '/usr/bin/google-chrome',
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-background-networking',
      '--remote-debugging-pipe',
      `--user-data-dir=${profile}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] },
  );
  const protocol = new PipeClient(browser.stdio[3] as Writable, browser.stdio[4] as Readable);
  try {
    for (const job of jobs) {
      const { targetId } = await protocol.send<{ targetId: string }>('Target.createTarget', {
        url: `http://127.0.0.1:${address.port}/${path.relative(root, job.file).split(path.sep).join('/')}`,
      });
      const { sessionId } = await protocol.send<{ sessionId: string }>('Target.attachToTarget', {
        targetId,
        flatten: true,
      });
      await protocol.send(
        'Emulation.setDeviceMetricsOverride',
        { width: job.width, height: job.height, deviceScaleFactor: 1, mobile: false },
        sessionId,
      );
      await delay(1400);
      const { data } = await protocol.send<{ data: string }>(
        'Page.captureScreenshot',
        { format: 'png', captureBeyondViewport: false },
        sessionId,
      );
      await writeFile(path.join(output, job.name), Buffer.from(data, 'base64'));
      await protocol.send('Target.closeTarget', { targetId });
    }
  } finally {
    const closed = new Promise((resolve) => browser.once('close', resolve));
    try {
      await protocol.send('Browser.close');
    } catch {
      browser.kill();
    }
    await closed;
    server.close();
    await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
const entries: Record<string, Uint8Array> = {};
for (const job of jobs) {
  const file = path.join(output, job.name);
  const image = await sharp(file).removeAlpha().png().toBuffer();
  const metadata = await sharp(image).metadata();
  if (metadata.width !== job.width || metadata.height !== job.height)
    throw new Error(`Invalid image dimensions: ${job.name}`);
  await writeFile(file, image);
  entries[job.name] = image;
}
// Preserve the approved mark and its existing Chrome Web Store padding.
entries['store-icon-128.png'] = await readFile(path.join(output, 'store-icon-128.png'));
entries['README.txt'] = strToU8(
  'Wpp Discreto 0.2.1: five 1280x800 screenshots, 440x280 small promo, 1400x560 marquee, 128x128 approved icon. Screens show the actual bundled UI/content code with mocked Chrome APIs and fictional conversations/media, not authenticated WhatsApp. Upload the extension ZIP separately.\n',
);
await writeFile(path.join(root, 'dist/wpp-discreto-store-assets.zip'), zipSync(entries));
console.log('Generated all five screenshots, both promo tiles, approved icon, and upload ZIP.');
