import {
  headerTitles,
  infoTitles,
  readChatContext,
  sidebarTitles,
  unavailableContext,
} from './chats';
import { annotateMessages } from './messages';
import { ScreenProtection } from './screen';
import * as model from './settings';

(() => {
  let config = model.settings();
  let aliases: model.Alias[] = [];
  let scheduled = false;
  let loaded = false;
  let storageFailed = false;
  let stopped = false;
  const screen = new ScreenProtection();
  const decorated = new Set<HTMLElement>();
  const root = () => document.documentElement;

  function schedule() {
    if (scheduled || stopped) return;
    scheduled = true;
    // A timer also runs when Chrome throttles animation frames in an inactive tab.
    setTimeout(() => {
      scheduled = false;
      render();
    }, 16);
  }

  const observer = new MutationObserver((records) => {
    if (
      records.every(
        (record) => record.target instanceof Element && record.target.closest('[data-wppd-screen]'),
      )
    )
      return;
    // Classify new/recycled media in the observer microtask, before its first paint.
    observer.disconnect();
    try {
      if (config.enabled && config.blurChat) {
        annotateMessages(document);
        screen.update(config);
      }
    } finally {
      observe();
    }
    schedule();
  });
  function observe() {
    observer.observe(document, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        'title',
        'data-id',
        'aria-selected',
        'aria-hidden',
        'hidden',
        'src',
        'srcset',
        'poster',
        'class',
        'style',
        'data-testid',
        'data-icon',
      ],
    });
  }

  function updateAliases() {
    // Restore the original presentation before measuring nested title fonts.
    for (const node of decorated) {
      node.removeAttribute('data-wppd-alias');
      node.style.removeProperty('--wppd-name-size');
    }
    decorated.clear();
    const byName = new Map(aliases.map(({ original, alias }) => [original, alias]));
    const candidates =
      config.enabled && config.aliasesEnabled
        ? [...sidebarTitles(document), ...headerTitles(document), ...infoTitles(document)]
        : [];
    const active = new Set<HTMLElement>();
    for (const node of candidates) {
      if (!(node instanceof HTMLElement) || node.closest('[role="gridcell"]:nth-child(2)'))
        continue;
      const original = model.normalizeName(node.getAttribute('title') || node.textContent);
      // Restrict to title elements whose own text is exactly the stored group name.
      if (model.normalizeName(node.textContent) !== original) continue;
      const alias = byName.get(original);
      if (!alias) continue;
      if (!node.hasAttribute('data-wppd-alias')) {
        node.style.setProperty('--wppd-name-size', getComputedStyle(node).fontSize);
      }
      node.setAttribute('data-wppd-alias', alias);
      active.add(node);
    }
    for (const node of active) decorated.add(node);
  }

  function render() {
    if (!root() || stopped) return;
    observer.disconnect();
    try {
      // Keep masking while the initial settings are unavailable.
      root().setAttribute(
        'data-wppd-chat',
        String(storageFailed || (config.enabled && config.blurChat)),
      );
      root().setAttribute(
        'data-wppd-previews',
        String(storageFailed || (config.enabled && config.blurPreviews)),
      );
      root().style.setProperty('--wppd-blur', `${config.blurStrength}px`);
      for (const [kind, selected] of [
        ['images', config.blurImages],
        ['videos', config.blurVideos],
        ['stickers', config.blurStickers],
      ] as const)
        root().setAttribute(`data-wppd-${kind}`, String(selected));
      root().setAttribute(
        'data-wppd-media-any',
        String(config.blurImages || config.blurVideos || config.blurStickers),
      );
      annotateMessages(document);
      screen.update(config);
      updateAliases();
      if (loaded) root().setAttribute('data-wppd-ready', '');
    } finally {
      observe();
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) {
      config = model.settings(changes.settings.newValue);
      // A new explicit setting supersedes a failed initial storage read.
      storageFailed = false;
      loaded = true;
    }
    if (changes.aliases) aliases = model.aliases(changes.aliases.newValue);
    render();
  });

  chrome.runtime.onMessage.addListener((request: unknown, sender, respond) => {
    if (sender.id !== chrome.runtime.id || !request || typeof request !== 'object') return false;
    const input = request as Record<string, unknown>;
    if (input.type !== 'wpp-discreto:chat-context') return false;
    respond(
      loaded && config.enabled ? readChatContext(document, input.names) : unavailableContext(),
    );
    return false;
  });

  chrome.storage.local
    .get(['settings', 'aliases'])
    .then((data) => {
      config = model.settings(data.settings);
      aliases = model.aliases(data.aliases);
      loaded = true;
      render();
    })
    .catch(() => {
      storageFailed = true;
      console.warn('Wpp Discreto: could not load settings. Reload the extension and this page.');
      render();
    });

  document.addEventListener(
    'scroll',
    (event) => {
      if (!(event.target instanceof Element)) return;
      // Update the physical mask in the scroll event, including media exemptions.
      observer.disconnect();
      try {
        screen.update(config);
      } finally {
        observe();
      }
    },
    { capture: true, passive: true },
  );

  for (const event of ['load', 'loadedmetadata']) document.addEventListener(event, schedule, true);
  window.addEventListener('resize', schedule);

  window.addEventListener('pagehide', () => {
    stopped = true;
    observer.disconnect();
    screen.update({ ...config, enabled: false });
  });
  window.addEventListener('pageshow', () => {
    stopped = false;
    render();
  });
  observe();
  schedule();
})();
