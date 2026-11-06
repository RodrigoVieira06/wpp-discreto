import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = path.join(root, 'dist/extension');
const manifest = JSON.parse(await readFile(path.join(source, 'manifest.json'), 'utf8'));
const files: string[] = [
  'manifest.json',
  manifest.action.default_popup,
  'popup/popup.css',
  'popup/popup.js',
  ...(Object.values(manifest.icons) as string[]),
  ...manifest.content_scripts.flatMap((entry: { js: string[]; css: string[] }) => [
    ...entry.js,
    ...entry.css,
  ]),
];
const entries: Record<string, Uint8Array> = {};
for (const file of new Set(files)) entries[file] = await readFile(path.join(source, file));
await mkdir(path.join(root, 'dist'), { recursive: true });
const output = path.join(root, 'dist', `wpp-mask-${manifest.version}.zip`);
await writeFile(output, zipSync(entries));
console.log(output);
