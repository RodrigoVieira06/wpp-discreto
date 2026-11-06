import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
let building = false;
let pending = false;
let stopping = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let child: ReturnType<typeof spawn> | undefined;

function rebuild() {
  if (stopping) return;
  if (building) {
    pending = true;
    return;
  }
  building = true;
  child = spawn('pnpm', ['build'], { cwd: root, stdio: 'inherit' });
  const complete = () => {
    building = false;
    child = undefined;
    if (pending) {
      pending = false;
      rebuild();
    }
  };
  child.once('error', (error) => {
    console.error(error.message);
  });
  child.once('close', complete);
}

const watchers = ['src', 'popup', 'assets', 'scripts', 'tests', 'manifest.json'].map((entry) =>
  watch(new URL(`../${entry}`, import.meta.url), { recursive: entry !== 'manifest.json' }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 100);
  }),
);

function stop() {
  stopping = true;
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  child?.kill('SIGTERM');
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
console.log(
  'Watching sources. Load dist/extension in Chrome and reload the extension after rebuilding.',
);
rebuild();
