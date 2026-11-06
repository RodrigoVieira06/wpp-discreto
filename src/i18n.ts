import type portuguese from '../_locales/pt_BR/messages.json';

export type MessageKey = keyof typeof portuguese;

export function getUiLocale(language = chrome.i18n.getUILanguage()): 'pt-BR' | 'en' {
  return /^en(?:[-_]|$)/i.test(language) ? 'en' : 'pt-BR';
}

/** Chrome resolves unsupported locales through manifest.default_locale (pt_BR). */
export function message(key: MessageKey, substitutions?: string | string[]): string {
  return chrome.i18n.getMessage(key, substitutions);
}

export function translateDocument(document: Document) {
  document.documentElement.lang = getUiLocale();
  document.documentElement.dir = 'ltr';
  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    node.textContent = message(node.dataset.i18n as MessageKey);
  }
  for (const attribute of ['placeholder', 'aria-label'] as const) {
    for (const node of document.querySelectorAll<HTMLElement>(`[data-i18n-${attribute}]`)) {
      const key = node.getAttribute(`data-i18n-${attribute}`) as MessageKey;
      node.setAttribute(attribute, message(key));
    }
  }
}
