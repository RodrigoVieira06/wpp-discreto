import { normalizeName } from './settings';
import { infoPanelSelector } from './surfaces';

export interface ChatContext {
  available: boolean;
  chats: string[];
  found: string[];
  scanComplete?: boolean;
}

export const unavailableContext = (): ChatContext => ({ available: false, chats: [], found: [] });

export function sidebarTitles(document: Document): HTMLElement[] {
  const titles: HTMLElement[] = [];
  for (const row of document.querySelectorAll(
    '#pane-side [role="row"], #pane-side [role="listitem"]',
  )) {
    const valid = (node: HTMLElement) =>
      !node.closest('[role="gridcell"]:nth-child(2)') &&
      !node.closest('[data-testid*="unread"], .sr-only, [aria-live]') &&
      Boolean(normalizeName(node.getAttribute('title') || node.textContent));
    // A title container can contain an accessibility-only unread count before the name.
    const title =
      [...row.querySelectorAll<HTMLElement>('[data-testid="cell-frame-title"] [dir="auto"]')].find(
        (node) => !node.querySelector('[dir="auto"]') && valid(node),
      ) ??
      [...row.querySelectorAll<HTMLElement>('span[title]')].find(valid) ??
      [
        ...row.querySelectorAll<HTMLElement>(
          '[data-testid="cell-frame-title"] [dir="auto"], [data-testid="cell-frame-title"] span',
        ),
      ].find((node) => node.childElementCount === 0 && valid(node)) ??
      [...row.querySelectorAll<HTMLElement>('[data-testid="cell-frame-title"]')].find(valid);
    if (title) titles.push(title);
  }
  return [...new Set(titles)];
}

export function headerTitles(document: Document): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(
      '#main > header [title], #main header [data-testid="conversation-info-header-chat-title"]',
    ),
  ];
}

/** Match only the active conversation name; member lists and descriptions retain original text. */
export function infoTitles(document: Document): HTMLElement[] {
  const names = new Set(
    headerTitles(document).map((node) =>
      normalizeName(node.getAttribute('title') || node.textContent),
    ),
  );
  const titles = new Set<HTMLElement>();
  for (const panel of document.querySelectorAll(infoPanelSelector)) {
    for (const node of panel.querySelectorAll<HTMLElement>(
      'h2, h3, [role="heading"], [dir="auto"], span[title]',
    )) {
      if (
        node.closest(
          '[contenteditable="true"], [role="list"], [role="listitem"], [role="grid"], button',
        ) ||
        node.querySelector('[dir="auto"], span[title]')
      )
        continue;
      if (names.has(normalizeName(node.getAttribute('title') || node.textContent)))
        titles.add(node);
    }
  }
  return [...titles];
}

const titleName = (node: HTMLElement) =>
  normalizeName(node.getAttribute('title') || node.textContent);
const namesFrom = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .filter((item): item is string => typeof item === 'string')
            .map(normalizeName)
            .filter(Boolean),
        ),
      ]
    : [];

/** Use original names only; discovered names remain in memory until an alias is saved. */
export function readChatContext(
  document: Document,
  requestedNames: unknown,
  discovered: Iterable<string> = [],
): ChatContext {
  const sidebar = sidebarTitles(document).map(titleName);
  const cached = [...discovered];
  if (!document.getElementById('pane-side') || (sidebar.length === 0 && cached.length === 0))
    return unavailableContext();
  const known = new Set([
    ...sidebar,
    ...cached,
    ...headerTitles(document).map(titleName),
    ...infoTitles(document).map(titleName),
  ]);
  return {
    available: true,
    chats: [...new Set([...sidebar, ...cached])],
    found: namesFrom(requestedNames).filter((name) => known.has(name)),
  };
}

export function parseChatContext(value: unknown): ChatContext {
  if (!value || typeof value !== 'object') return unavailableContext();
  const input = value as Record<string, unknown>;
  if (input.available !== true || !Array.isArray(input.chats) || !Array.isArray(input.found))
    return unavailableContext();
  return {
    available: true,
    chats: namesFrom(input.chats),
    found: namesFrom(input.found),
    ...(typeof input.scanComplete === 'boolean' ? { scanComplete: input.scanComplete } : {}),
  };
}

export interface SidebarScanOptions {
  signal?: AbortSignal;
  shouldContinue?: () => boolean;
  timeoutMs?: number;
}

/** Traverse the rendered sidebar, including recycled rows, without opening conversations. */
export async function collectSidebarNames(
  document: Document,
  options: SidebarScanOptions = {},
): Promise<{ names: string[]; complete: boolean }> {
  const pane = document.getElementById('pane-side');
  const names = new Set<string>();
  const collect = () => {
    for (const title of sidebarTitles(document)) names.add(titleName(title));
  };
  collect();
  if (!pane) return { names: [], complete: false };
  let viewport: HTMLElement | undefined;
  const rowParent = sidebarTitles(document)[0]?.closest<HTMLElement>(
    '[role="row"], [role="listitem"]',
  )?.parentElement;
  for (const candidate of [
    ...(rowParent ? [rowParent] : []),
    pane,
    ...pane.querySelectorAll<HTMLElement>(
      '[role="grid"], [role="list"], [data-testid="chat-list"]',
    ),
  ]) {
    for (
      let node: HTMLElement | null = candidate;
      node && !node.matches('body, html');
      node = node.parentElement
    ) {
      if (node.clientHeight > 0 && /auto|scroll/.test(getComputedStyle(node).overflowY)) {
        viewport = node;
        break;
      }
    }
    if (viewport) break;
  }
  if (!viewport) return { names: [...names], complete: true };
  const originalTop = viewport.scrollTop;
  let interrupted = false;
  let complete = false;
  const interrupt = () => {
    interrupted = true;
  };
  const events = ['wheel', 'pointerdown', 'keydown'] as const;
  for (const event of events) viewport.addEventListener(event, interrupt, { passive: true });
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const active = () =>
    !interrupted &&
    !options.signal?.aborted &&
    pane.isConnected &&
    document.getElementById('pane-side') === pane &&
    (options.shouldContinue?.() ?? true);
  const move = (top: number) => {
    viewport.scrollTop = top;
    viewport.dispatchEvent(new Event('scroll'));
  };
  const deadline = Date.now() + (options.timeoutMs ?? 45000);
  let stable = 0;
  try {
    move(0);
    while (active() && Date.now() < deadline) {
      await wait(120);
      if (!active()) break;
      collect();
      const bottom = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      if (viewport.scrollTop >= bottom - 1) {
        const height = viewport.scrollHeight;
        const count = names.size;
        await wait(350);
        if (!active()) break;
        collect();
        const busy =
          viewport.matches('[aria-busy="true"]') || !!viewport.querySelector('[aria-busy="true"]');
        stable = !busy && height === viewport.scrollHeight && count === names.size ? stable + 1 : 0;
        if (stable >= 3) {
          complete = true;
          break;
        }
      } else {
        stable = 0;
        const next = Math.min(
          bottom,
          viewport.scrollTop + Math.max(1, viewport.clientHeight * 0.8),
        );
        const previous = viewport.scrollTop;
        move(next);
        if (viewport.scrollTop === previous) break;
      }
    }
  } finally {
    for (const event of events) viewport.removeEventListener(event, interrupt);
    if (!interrupted && pane.isConnected && document.getElementById('pane-side') === pane)
      move(originalTop);
  }
  return { names: [...names], complete };
}
