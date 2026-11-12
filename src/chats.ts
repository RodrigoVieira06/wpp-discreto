import { normalizeName } from './settings';
import { infoPanelSelector } from './surfaces';

export interface ChatContext {
  available: boolean;
  chats: string[];
  found: string[];
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
  return [...new Set(titles)].sort(
    (left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top,
  );
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
    chats: mergeSidebarOrder(cached, sidebar),
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
  };
}

/** Keep known relative order, replacing each observed block with its current visual order. */
export function mergeSidebarOrder(
  previous: readonly string[],
  visible: readonly string[],
): string[] {
  const current = [...new Set(visible)];
  const observed = new Set(current);
  let index = previous.length;
  for (const name of current) {
    const position = previous.indexOf(name);
    if (position >= 0) index = Math.min(index, position);
  }
  return [
    ...previous.slice(0, index).filter((name) => !observed.has(name)),
    ...current,
    ...previous.slice(index).filter((name) => !observed.has(name)),
  ];
}
