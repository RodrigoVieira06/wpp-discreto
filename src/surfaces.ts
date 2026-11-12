/** WhatsApp integration points: keep these selectors narrow and independent of CSS classes. */
export const infoPanelSelector =
  '[data-testid="drawer-right"], [data-testid="contact-info-drawer"], [data-testid="group-info-drawer"], [data-testid="contact-info"], [data-testid="group-info"], [data-animate-drawer]';
export const mediaViewerSelector =
  '[data-testid="media-viewer"], [data-testid^="media-viewer-"], [data-testid="media-modal"]';
export const mediaPanelSelector = `${infoPanelSelector}, [data-testid="media-gallery"], [data-testid="media-panel"], [data-testid="media-collection"], ${mediaViewerSelector}, [role="dialog"]`;
export const audioSelector =
  '[data-testid="audio-player"], [data-testid="ptt-audio-player"], [data-testid="audio-message"], [data-testid="ptt-message"], [data-testid="ptt"]';

/** Include sibling history strips when only the main image has a viewer marker. */
export function mediaViewerRoots(document: Document): HTMLElement[] {
  const roots = new Set(document.querySelectorAll<HTMLElement>(mediaViewerSelector));
  for (const marked of roots) {
    for (let parent = marked.parentElement; parent; parent = parent.parentElement) {
      if (
        parent.matches('body, html, #app, #main, #pane-side, #side') ||
        parent.querySelector('#main, #pane-side, #side')
      )
        break;
      const box = parent.getBoundingClientRect();
      if (
        box.width >= innerWidth * 0.7 &&
        box.height >= innerHeight * 0.7 &&
        (/fixed|absolute/.test(getComputedStyle(parent).position) ||
          parent.matches('[role="dialog"]'))
      ) {
        roots.add(parent);
        break;
      }
    }
  }
  return [...roots];
}

/** A visible full-screen viewer replaces the chat viewport as the active media surface. */
export function hasOpenMediaViewer(document: Document): boolean {
  return [
    ...document.querySelectorAll<HTMLElement>(`${mediaViewerSelector}, [role="dialog"]`),
  ].some((viewer) => {
    if (viewer.closest('[hidden], [aria-hidden="true"]') || viewer.matches(infoPanelSelector))
      return false;
    const box = viewer.getBoundingClientRect();
    const style = getComputedStyle(viewer);
    if (
      box.width <= 0 ||
      box.height <= 0 ||
      style.display === 'none' ||
      style.visibility === 'hidden'
    )
      return false;
    return (
      viewer.matches(mediaViewerSelector) ||
      (box.width >= innerWidth * 0.7 &&
        box.height >= innerHeight * 0.7 &&
        !!viewer.querySelector('img, video, canvas'))
    );
  });
}

const mediaComposerSelector =
  '[data-testid="media-editor"], [data-testid="media-composer"], [data-testid="media-attachment-preview"]';
const sendControlSelector =
  '[data-icon="send"], [data-icon="wds-ic-send-filled"], [data-testid="send"], button[aria-label="Enviar"], button[aria-label="Send"], [role="button"][aria-label="Enviar"], [role="button"][aria-label="Send"]';
const editorControlSelector =
  '[data-testid="media-editor-toolbar"], [data-icon="crop"], [data-icon="draw"], [data-icon="rotate"]';
const conversationMessageSelector =
  '.message-in, .message-out, [data-testid="msg-container"], [data-id^="true_"], [data-id^="false_"]';
const composerBoundarySelector = `body, html, #app, #main, #pane-side, #side, ${conversationMessageSelector}`;

function visibleComposer(node: HTMLElement): boolean {
  if (node.closest('[hidden], [aria-hidden="true"]')) return false;
  const box = node.getBoundingClientRect();
  const style = getComputedStyle(node);
  return (
    box.width > 0 &&
    box.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

/** Identify outgoing drafts without exempting ordinary chat composers or received viewers. */
export function mediaComposerRoots(document: Document): HTMLElement[] {
  const roots = new Set<HTMLElement>();
  const enclosingEditor = (anchor: HTMLElement): HTMLElement | undefined => {
    for (let node: HTMLElement | null = anchor; node; node = node.parentElement) {
      if (
        node.matches(composerBoundarySelector) ||
        node.querySelector(`#main, #pane-side, #side, ${conversationMessageSelector}`)
      )
        break;
      if (node.matches('header, footer')) continue;
      const preview = node.querySelector(
        'img:not(.emoji):not([data-testid="emoji"] *):not([contenteditable="true"] *), video, canvas, [data-testid="media-preview"]',
      );
      if (
        preview &&
        node.querySelector(sendControlSelector) &&
        node.querySelector(`[contenteditable="true"], ${editorControlSelector}`) &&
        visibleComposer(node)
      )
        return node;
    }
    return undefined;
  };
  for (const marker of document.querySelectorAll<HTMLElement>(mediaComposerSelector)) {
    if (
      !visibleComposer(marker) ||
      marker.matches(composerBoundarySelector) ||
      marker.closest(conversationMessageSelector)
    )
      continue;
    roots.add(enclosingEditor(marker) ?? marker);
  }
  for (const send of document.querySelectorAll<HTMLElement>(sendControlSelector)) {
    if (!visibleComposer(send.closest<HTMLElement>('button, [role="button"]') ?? send)) continue;
    const editor = enclosingEditor(send);
    if (editor) roots.add(editor);
  }
  return [...roots];
}

export function audioElements(main: Element): HTMLElement[] {
  const elements = [...main.querySelectorAll<HTMLElement>(audioSelector)];
  for (const control of main.querySelectorAll<HTMLElement>(
    'audio, [data-icon="audio-play"], [data-icon="ptt-play"], [data-icon="audio-pause"], [data-icon="ptt-pause"]',
  )) {
    if (control.closest(audioSelector)) continue;
    const bubble = control.closest<HTMLElement>(
      '.message-in, .message-out, [data-testid="msg-container"]',
    );
    const player =
      bubble && !bubble.querySelector('.selectable-text') ? bubble : control.parentElement;
    if (player) elements.push(player);
  }
  return [...new Set(elements)];
}
