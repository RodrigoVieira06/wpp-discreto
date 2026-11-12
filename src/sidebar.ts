const previewSelector = '[data-testid="last-msg-status"], [data-testid="chat-subtitle"]';
const counterSelector =
  '[data-testid*="unread-count"], [data-testid="unread-message-count"], [data-icon="unread-count"]';
const numericCount = /^\d+\+?$/;

function greenCounter(node: HTMLElement): boolean {
  const style = getComputedStyle(node);
  const channels = style.backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
  const box = node.getBoundingClientRect();
  return (
    channels.length >= 3 &&
    (channels.length < 4 || channels[3] > 0) &&
    channels[1] > channels[0] * 1.05 &&
    channels[1] > channels[2] * 1.05 &&
    parseFloat(style.borderTopLeftRadius) > 0 &&
    box.width > 0 &&
    box.width <= 80 &&
    box.height <= 40
  );
}

/** Split preview effects from unread counters without wrapping or replacing React-owned text. */
export function annotateSidebar(document: Document) {
  for (const node of document.querySelectorAll<HTMLElement>(
    '[data-wppd-preview], [data-wppd-preview-text], [data-wppd-unread-counter], [data-wppd-sidebar-exempt]',
  )) {
    for (const name of ['preview', 'preview-text', 'unread-counter', 'sidebar-exempt'])
      node.removeAttribute(`data-wppd-${name}`);
    node.style.removeProperty('--wppd-sidebar-color');
  }
  for (const row of document.querySelectorAll<HTMLElement>(
    '#pane-side [role="row"], #pane-side [role="listitem"]',
  )) {
    const counters = new Set<HTMLElement>();
    for (const marker of row.querySelectorAll<HTMLElement>(counterSelector)) {
      if (!marker.matches('[role="row"], [role="listitem"], [role="gridcell"]'))
        counters.add(marker);
    }
    for (const marker of row.querySelectorAll<HTMLElement>('[aria-label]')) {
      if (
        /(unread|não lid[ao])/i.test(marker.getAttribute('aria-label') ?? '') &&
        numericCount.test(marker.textContent?.trim() ?? '')
      )
        counters.add(marker);
    }
    for (const leaf of row.querySelectorAll<HTMLElement>('[role="gridcell"]:nth-child(2) span')) {
      if (!numericCount.test(leaf.textContent?.trim() ?? '')) continue;
      for (
        let node: HTMLElement | null = leaf;
        node && row.contains(node);
        node = node.parentElement
      ) {
        if (!numericCount.test(node.textContent?.trim() ?? '')) break;
        if (greenCounter(node)) {
          counters.add(node);
          break;
        }
      }
    }
    const exemptions = new Set<HTMLElement>([
      ...counters,
      ...row.querySelectorAll<HTMLElement>('time'),
    ]);
    for (const node of exemptions) {
      node.style.setProperty('--wppd-sidebar-color', getComputedStyle(node).color);
      node.setAttribute('data-wppd-sidebar-exempt', '');
      if (counters.has(node)) node.setAttribute('data-wppd-unread-counter', '');
    }
    const candidates = [
      ...new Set(
        row.querySelectorAll<HTMLElement>(`${previewSelector}, [role="gridcell"]:nth-child(2)`),
      ),
    ];
    const roots = candidates.filter(
      (node) => !candidates.some((parent) => parent !== node && parent.contains(node)),
    );
    const visit = (node: HTMLElement) => {
      if ([...exemptions].some((exempt) => exempt === node || exempt.contains(node))) return;
      const color = getComputedStyle(node).color;
      const split =
        [...exemptions].some((exempt) => node.contains(exempt)) ||
        (!node.matches(previewSelector) && !!node.querySelector(previewSelector));
      if (!split) {
        node.style.setProperty('--wppd-sidebar-color', color);
        node.setAttribute('data-wppd-preview', '');
        return;
      }
      for (const child of node.children) if (child instanceof HTMLElement) visit(child);
      if (
        [...node.childNodes].some(
          (child) => child.nodeType === Node.TEXT_NODE && !!child.textContent?.trim(),
        )
      ) {
        node.style.setProperty('--wppd-sidebar-color', color);
        node.setAttribute('data-wppd-preview-text', '');
      }
    };
    for (const node of roots) visit(node);
  }
}
