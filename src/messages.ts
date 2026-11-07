import { audioElements, mediaPanelSelector } from './surfaces';

export const messageSelector =
  '.message-in, .message-out, [data-testid="msg-container"], [data-id^="true_"], [data-id^="false_"]';
export const mediaSelector =
  'img:not(.emoji):not([data-testid="emoji"] *), video, canvas, [data-testid="sticker"], [data-testid="album"], [data-testid="media-grid"], [data-testid="album-image"], [data-testid="album-video"], [data-testid="media-cell"], [data-testid="image-thumb"], [data-testid="video-thumb"], [style*="background-image"]';

type MediaKind = 'images' | 'videos' | 'stickers' | 'unknown';
const videoIndicator = '[data-icon="video-play"], [data-icon="media-play"], video';

function mediaKind(node: HTMLElement): MediaKind {
  if (
    node.closest('[data-testid*="sticker"], [data-icon*="sticker"]') ||
    node.matches('img[alt="Sticker"], img[alt="Figurinha"]')
  )
    return 'stickers';
  if (
    node.tagName === 'VIDEO' ||
    node.closest('[data-testid*="video"]') ||
    node.querySelector(videoIndicator)
  )
    return 'videos';
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (
      parent.matches(
        `[role="grid"], [data-testid="album"], ${messageSelector}, ${mediaPanelSelector}`,
      ) ||
      parent.querySelectorAll(mediaSelector).length > 1
    )
      break;
    if (parent.querySelector(videoIndicator)) return 'videos';
  }
  if (
    node.closest('[data-testid*="image"], [data-testid*="photo"]') ||
    node.matches('img[alt="Photo"], img[alt="Foto"], img[alt="Imagem"]')
  )
    return 'images';
  return 'unknown';
}

/** Classify actual assets, including background thumbnails, across all supported surfaces. */
export function annotateMessages(document: Document) {
  for (const old of document.querySelectorAll(
    '[data-wppm-media], [data-wppm-media-ignore], [data-wppm-media-panel], [data-wppm-audio], [data-wppm-surface]',
  )) {
    for (const attribute of ['media', 'media-ignore', 'media-panel', 'audio', 'surface'])
      old.removeAttribute(`data-wppm-${attribute}`);
  }
  const roots = document.querySelectorAll<HTMLElement>(`#main, ${mediaPanelSelector}`);
  for (const root of roots) {
    if (root.closest('#pane-side, #side')) continue;
    root.setAttribute('data-wppm-surface', '');
    for (const audio of audioElements(root)) audio.setAttribute('data-wppm-audio', '');
  }
  const assets = new Set(
    [...roots].flatMap((root) => [...root.querySelectorAll<HTMLElement>(mediaSelector)]),
  );
  for (const node of assets) {
    const panel = node.closest(mediaPanelSelector);
    const background = getComputedStyle(node).backgroundImage !== 'none';
    if (
      node.closest(
        '#pane-side, #side, [contenteditable="true"], [data-testid="emoji"], [data-wppm-audio]',
      ) ||
      (!panel && node.closest('header, footer')) ||
      node.querySelector(messageSelector) ||
      (!background && node.querySelector(mediaSelector)) ||
      (background && !node.closest(messageSelector) && !panel)
    ) {
      node.setAttribute('data-wppm-media-ignore', '');
      continue;
    }
    node.setAttribute('data-wppm-media', mediaKind(node));
    if (panel) node.setAttribute('data-wppm-media-panel', '');
  }
}
