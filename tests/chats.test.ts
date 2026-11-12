import assert from 'node:assert/strict';
import { test } from '@jest/globals';
import { mergeSidebarOrder } from '../src/chats';

test('remembered conversation order follows observed sidebar blocks without alphabetical sorting', () => {
  assert.deepEqual(mergeSidebarOrder(['Zoe', 'Ana', 'Bruno'], ['Ana', 'Bruno', 'Clara']), [
    'Zoe',
    'Ana',
    'Bruno',
    'Clara',
  ]);
  assert.deepEqual(mergeSidebarOrder(['Ana', 'Bruno', 'Clara'], ['Clara', 'Ana']), [
    'Clara',
    'Ana',
    'Bruno',
  ]);
  assert.deepEqual(mergeSidebarOrder(['Bruno', 'Clara'], ['Zoe', 'Bruno']), [
    'Zoe',
    'Bruno',
    'Clara',
  ]);
  assert.deepEqual(mergeSidebarOrder(['Zoe', 'Ana'], []), ['Zoe', 'Ana']);
});
