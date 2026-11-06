import { headerTitles, readChatContext, sidebarTitles, unavailableContext } from './chats';
import { annotateMessages, messageUnits } from './messages';
import * as model from './settings';

(() => {
  let config = model.settings();
  let aliases: model.Alias[] = [];
  let scheduled = false;
  let loaded = false;
  let storageFailed = false;
  let stopped = false;
  let revealed = new Set<HTMLElement>();
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
    // Virtualized chats may reuse a revealed bubble for different content.
    // Revoke its exception in the observer microtask, before Chrome paints it.
    for (const node of revealed) {
      if (
        records.some(
          (record) =>
            (record.type !== 'attributes' ||
              ['data-id', 'src', 'srcset', 'poster'].includes(record.attributeName ?? '')) &&
            (node.contains(record.target) ||
              (record.type === 'attributes' && record.target.contains(node))),
        )
      ) {
        node.removeAttribute('data-wppm-reveal');
        revealed.delete(node);
      }
    }
    // Classify new/recycled media in the observer microtask, before its first paint.
    if (config.enabled && config.blurChat) annotateMessages(document);
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

  function atConversationEnd(last: HTMLElement | undefined) {
    // When history is scrolled back, none of the older loaded messages are exposed.
    for (let node = last?.parentElement; node; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (/auto|scroll/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) {
        return node.scrollHeight - node.clientHeight - node.scrollTop <= 24;
      }
      if (node.id === 'main') break;
    }
    return true;
  }

  function updateMessages() {
    const nodes = config.enabled ? messageUnits(document) : [];
    const next = new Set(
      config.blurChat && atConversationEnd(nodes.at(-1)) && config.visibleCount > 0
        ? nodes.slice(-config.visibleCount)
        : [],
    );
    for (const node of revealed) if (!next.has(node)) node.removeAttribute('data-wppm-reveal');
    for (const node of next) node.setAttribute('data-wppm-reveal', '');
    revealed = next;
  }

  function updateAliases() {
    // Restore the original presentation before measuring nested title fonts.
    for (const node of decorated) {
      node.removeAttribute('data-wppm-alias');
      node.style.removeProperty('--wppm-name-size');
    }
    decorated.clear();
    const byName = new Map(aliases.map(({ original, alias }) => [original, alias]));
    const candidates =
      config.enabled && config.aliasesEnabled
        ? [...sidebarTitles(document), ...headerTitles(document)]
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
      if (!node.hasAttribute('data-wppm-alias')) {
        node.style.setProperty('--wppm-name-size', getComputedStyle(node).fontSize);
      }
      node.setAttribute('data-wppm-alias', alias);
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
        'data-wppm-chat',
        String(storageFailed || (config.enabled && config.blurChat)),
      );
      root().setAttribute(
        'data-wppm-previews',
        String(storageFailed || (config.enabled && config.blurPreviews)),
      );
      root().style.setProperty('--wppm-blur', `${config.blurStrength}px`);
      for (const [kind, selected] of [
        ['images', config.blurImages],
        ['videos', config.blurVideos],
        ['stickers', config.blurStickers],
      ] as const)
        root().setAttribute(`data-wppm-${kind}`, String(selected));
      root().setAttribute('data-wppm-media-always', String(config.alwaysBlurMedia));
      root().setAttribute(
        'data-wppm-media-any',
        String(config.blurImages || config.blurVideos || config.blurStickers),
      );
      annotateMessages(document);
      updateMessages();
      updateAliases();
      if (loaded) root().setAttribute('data-wppm-ready', '');
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
    if (input.type !== 'wpp-mask:chat-context') return false;
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
      console.warn('WPP Mask: could not load settings. Reload the extension and this page.');
      render();
    });

  document.addEventListener(
    'scroll',
    (event) => {
      if (
        !(event.target instanceof Element) ||
        !document.querySelector('#main')?.contains(event.target)
      )
        return;
      // Revoke exceptions synchronously so scrolling cannot expose history for a frame.
      for (const node of revealed) node.removeAttribute('data-wppm-reveal');
      revealed.clear();
      schedule();
    },
    { capture: true, passive: true },
  );

  for (const event of ['load', 'loadedmetadata']) document.addEventListener(event, schedule, true);
  window.addEventListener('resize', schedule);

  window.addEventListener('pagehide', () => {
    stopped = true;
    observer.disconnect();
  });
  window.addEventListener('pageshow', () => {
    stopped = false;
    render();
  });
  observe();
  schedule();
})();
