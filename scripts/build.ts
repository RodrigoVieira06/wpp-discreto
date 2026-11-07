import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { compile } from 'sass';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist/extension');
await mkdir(path.join(output, 'src'), { recursive: true });
await mkdir(path.join(output, 'popup'), { recursive: true });

await build({
  absWorkingDir: root,
  entryPoints: { 'src/content': 'src/content.ts', 'popup/popup': 'popup/popup.ts' },
  outdir: output,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  charset: 'utf8',
});

for (const entry of ['src/content', 'popup/popup']) {
  const result = compile(path.join(root, `${entry}.scss`), { style: 'expanded' });
  await writeFile(path.join(output, `${entry}.css`), result.css);
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
await cp(path.join(root, '_locales'), path.join(output, '_locales'), { recursive: true });
await cp(path.join(root, 'popup/popup.html'), path.join(output, 'popup/popup.html'));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
await writeFile(path.join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('Extension built in dist/extension');

await build({
  absWorkingDir: root,
  entryPoints: [
    'tests/browser-content.ts',
    'tests/browser-popup.ts',
    'tests/browser-media.ts',
    'tests/browser-screen.ts',
  ],
  outdir: path.join(root, 'dist/test-runtime'),
  bundle: true,
  format: 'iife',
  target: 'chrome120',
});
