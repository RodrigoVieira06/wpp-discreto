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

const draftAssetSelector =
  'img:not(.emoji):not([data-testid="emoji"] *), video, canvas, [style*="background-image"]';
const draftEditableSelector = '[contenteditable="true"], textarea';
const draftControlSelector = 'button, [role="button"], [data-icon]';
interface MediaPasteState {
  previousAssets: WeakSet<Element>;
  previousEditors: WeakMap<Element, Element | null>;
  previousControls: WeakSet<Element>;
  expires: number;
  bound: boolean;
}
const mediaPastes = new WeakMap<Document, MediaPasteState>();

/** Remember DOM references, never clipboard bytes, while WhatsApp mounts a pasted-media draft. */
export function noteMediaPaste(document: Document) {
  if (mediaPastes.get(document)?.bound && clipboardComposerRoots(document).length) return;
  mediaPastes.set(document, {
    previousAssets: new WeakSet(document.querySelectorAll(draftAssetSelector)),
    previousEditors: new WeakMap(
      [...document.querySelectorAll(draftEditableSelector)].map((node) => [
        node,
        node.parentElement,
      ]),
    ),
    previousControls: new WeakSet(document.querySelectorAll(draftControlSelector)),
    expires: Date.now() + 5000,
    bound: false,
  });
}

function clipboardComposerRoots(document: Document): HTMLElement[] {
  const state = mediaPastes.get(document);
  if (!state) return [];
  if (!state.bound && Date.now() > state.expires) {
    mediaPastes.delete(document);
    return [];
  }
  const excluded = `#pane-side, #side, header, ${conversationMessageSelector}`;
  const assets = [...document.querySelectorAll<HTMLElement>(draftAssetSelector)].filter(
    (node) => !state.previousAssets.has(node) && !node.closest(excluded) && visibleComposer(node),
  );
  const editors = [...document.querySelectorAll<HTMLElement>(draftEditableSelector)].filter(
    (node) =>
      !node.closest(`#pane-side, #side, ${conversationMessageSelector}`) && visibleComposer(node),
  );
  const controls = [...document.querySelectorAll<HTMLElement>(draftControlSelector)].filter(
    (node) => !state.previousControls.has(node) && !node.closest(excluded) && visibleComposer(node),
  );
  const primary = state.bound
    ? assets[0]
    : assets.find((node) => {
        const box = node.getBoundingClientRect();
        return box.width >= 96 && box.height >= 64;
      });
  if (primary) {
    for (const editor of editors) {
      for (
        let scope = primary.parentElement;
        scope && !scope.matches('body, html');
        scope = scope.parentElement
      ) {
        if (!scope.contains(editor)) continue;
        const unchangedCaption =
          state.previousEditors.has(editor) &&
          state.previousEditors.get(editor) === editor.parentElement;
        if (unchangedCaption) {
          const viewer = primary.closest(
            `${infoPanelSelector}, ${mediaViewerSelector}, [role="dialog"]`,
          );
          if (viewer && !viewer.contains(editor)) continue;
          if (!state.bound && !controls.some((control) => scope.contains(control))) continue;
        }
        // Some paste editors share only #main with their caption and thumbnail footer.
        // Exempt the new draft assets themselves, not the enclosing chat or received messages.
        const roots = [
          ...assets.filter((node) => scope.contains(node)),
          ...editors.filter((node) => scope.contains(node)),
        ];
        state.bound = true;
        return roots;
      }
    }
  }
  if (state.bound) mediaPastes.delete(document);
  return [];
}

/** Identify outgoing drafts without exempting ordinary chat composers or received viewers. */
export function mediaComposerRoots(document: Document): HTMLElement[] {
  const roots = new Set<HTMLElement>(clipboardComposerRoots(document));
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
