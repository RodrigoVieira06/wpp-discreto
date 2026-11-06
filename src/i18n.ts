import english from '../_locales/en/messages.json';
import portuguese from '../_locales/pt_BR/messages.json';
import type { LanguagePreference } from './settings';

export type MessageKey = keyof typeof portuguese;
let preference: LanguagePreference = 'auto';

export function setLanguage(language: LanguagePreference) {
  preference = language;
}

function currentLocale() {
  return preference === 'auto' ? getUiLocale() : preference === 'en' ? 'en' : 'pt-BR';
}

export function getUiLocale(language = chrome.i18n.getUILanguage()): 'pt-BR' | 'en' {
  return /^en(?:[-_]|$)/i.test(language) ? 'en' : 'pt-BR';
}

/** Catalog lookup supports a saved language override without changing Chrome's own UI language. */
export function message(key: MessageKey, substitutions?: string | string[]): string {
  const entry = (currentLocale() === 'en' ? english : portuguese)[key] as {
    message: string;
    placeholders?: Record<string, { content: string }>;
  };
  const values = typeof substitutions === 'string' ? [substitutions] : (substitutions ?? []);
  return entry.message.replace(/\$([a-z_]+)\$/gi, (token, name: string) => {
    const placeholder = entry.placeholders?.[name.toLowerCase()];
    return placeholder
      ? placeholder.content.replace(
          /\$(\d+)/g,
          (_, index: string) => values[Number(index) - 1] ?? '',
        )
      : token;
  });
}

export function translateDocument(document: Document) {
  document.documentElement.lang = currentLocale();
  document.documentElement.dir = 'ltr';
  for (const node of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    node.textContent = message(node.dataset.i18n as MessageKey);
  }
  for (const attribute of ['placeholder', 'aria-label', 'title'] as const) {
    for (const node of document.querySelectorAll<HTMLElement>(`[data-i18n-${attribute}]`)) {
      const key = node.getAttribute(`data-i18n-${attribute}`) as MessageKey;
      node.setAttribute(attribute, message(key));
    }
  }
}
