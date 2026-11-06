import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { expect, test } from '@jest/globals';

const root = path.resolve(__dirname, '..');

test('terminal help exposes development and release workflows', () => {
  const result = spawnSync('make', ['help'], { cwd: root, encoding: 'utf8' });
  expect(result.status).toBe(0);
  for (const command of ['dev', 'check', 'test', 'package', 'deploy']) {
    expect(result.stdout).toContain(command);
  }
});

test('deploy preparation requires quality checks, tests and packaging', () => {
  const result = spawnSync('make', ['--dry-run', 'deploy'], { cwd: root, encoding: 'utf8' });
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('pnpm check');
  expect(result.stdout).toContain('pnpm test');
  expect(result.stdout).toContain('pnpm package');
  expect(result.stdout).toContain('manual');
});

test('commit validation accepts Conventional Commits and rejects an invalid subject', () => {
  const executable = path.join(root, 'node_modules/.bin/commitlint');
  const valid = spawnSync(executable, [], {
    cwd: root,
    encoding: 'utf8',
    input: 'feat: add local group aliases\n',
  });
  const invalid = spawnSync(executable, [], {
    cwd: root,
    encoding: 'utf8',
    input: 'random changes\n',
  });
  expect(valid.status).toBe(0);
  expect(invalid.status).toBe(1);
});
