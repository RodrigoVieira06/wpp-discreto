import { normalizeName } from './settings';

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
    const title = [
      ...row.querySelectorAll<HTMLElement>('span[title], [data-testid="cell-frame-title"]'),
    ].find(
      (node) =>
        !node.closest('[role="gridcell"]:nth-child(2)') &&
        normalizeName(node.getAttribute('title') || node.textContent),
    );
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

/** Suggestions are capped at ten; validation only returns requested names already loaded in the DOM. */
export function readChatContext(document: Document, requestedNames: unknown): ChatContext {
  const sidebar = sidebarTitles(document).map(titleName);
  if (sidebar.length === 0) return unavailableContext();
  const known = new Set([...sidebar, ...headerTitles(document).map(titleName)]);
  return {
    available: true,
    chats: [...new Set(sidebar)].slice(0, 10),
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
    chats: namesFrom(input.chats).slice(0, 10),
    found: namesFrom(input.found),
  };
}
