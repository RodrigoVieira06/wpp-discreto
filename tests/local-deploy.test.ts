import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@jest/globals';

const root = path.resolve(__dirname, '..');

test('local deployment builds and launches an isolated test session', () => {
  const result = spawnSync('make', ['--dry-run', 'deploy-local'], { cwd: root, encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('pnpm build');
  expect(result.stdout).toContain('pnpm deploy:local');
});

test('Chrome loads the actual extension and initializes its popup', () => {
  const result = spawnSync(process.execPath, ['scripts/deploy-local.ts', '--smoke-test'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 25000,
    env: process.env,
  });
  expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: '' });
  const report = JSON.parse(result.stdout.trim());
  expect(report.extensionId).toMatch(/^[a-p]{32}$/);
  expect(report.popupReady).toBe(true);
  expect(report.popupLayout).toEqual(
    [160, 600].map((height) => ({
      height,
      controlsExpanded: true,
      widthPreserved: true,
      noHorizontalOverflow: true,
      helpContained: true,
      switchTargetsAccessible: true,
      switchesAligned: true,
      masterReachable: true,
      saveReachable: true,
      footerReachable: true,
      settingsReachable: true,
      headerPinned: true,
      settingsScrolled: true,
    })),
  );
});
