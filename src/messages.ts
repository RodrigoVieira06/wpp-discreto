import {
  audioElements,
  hasOpenMediaViewer,
  mediaComposerRoots,
  mediaPanelSelector,
  mediaViewerRoots,
  mediaViewerSelector,
} from './surfaces';

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
  // A large displayed image is a photo; small unmarked preview tiles remain unknown.
  if (
    node.tagName === 'IMG' &&
    node.closest(`${mediaViewerSelector}, [role="dialog"]`) &&
    hasOpenMediaViewer(document)
  ) {
    const box = node.getBoundingClientRect();
    if (box.width >= innerWidth * 0.2 || box.height >= innerHeight * 0.3) return 'images';
  }
  return 'unknown';
}

/** Classify actual assets, including background thumbnails, across all supported surfaces. */
export function annotateMessages(document: Document) {
  for (const old of document.querySelectorAll(
    '[data-wppd-media], [data-wppd-media-ignore], [data-wppd-media-panel], [data-wppd-audio], [data-wppd-surface], [data-wppd-composer]',
  )) {
    for (const attribute of [
      'media',
      'media-ignore',
      'media-panel',
      'audio',
      'surface',
      'composer',
    ])
      old.removeAttribute(`data-wppd-${attribute}`);
  }
  const composers = mediaComposerRoots(document);
  for (const composer of composers) composer.setAttribute('data-wppd-composer', '');
  const viewers = new Set(mediaViewerRoots(document));
  const roots = new Set([
    ...document.querySelectorAll<HTMLElement>(`#main, ${mediaPanelSelector}`),
    ...viewers,
    ...composers,
  ]);
  for (const root of roots) {
    if (root.closest('#pane-side, #side')) continue;
    root.setAttribute('data-wppd-surface', viewers.has(root) ? 'viewer' : '');
    for (const audio of audioElements(root)) audio.setAttribute('data-wppd-audio', '');
  }
  const assets = new Set(
    [...roots].flatMap((root) => [
      ...(root.matches(mediaSelector) ? [root] : []),
      ...root.querySelectorAll<HTMLElement>(mediaSelector),
    ]),
  );
  for (const node of assets) {
    const panel = node.closest(`${mediaPanelSelector}, [data-wppd-surface="viewer"]`);
    const background = getComputedStyle(node).backgroundImage !== 'none';
    if (
      node.closest(
        '#pane-side, #side, [contenteditable="true"], [data-testid="emoji"], [data-wppd-audio], [data-wppd-composer]',
      ) ||
      (!panel && node.closest('header, footer')) ||
      node.querySelector(messageSelector) ||
      (!background && node.querySelector(mediaSelector)) ||
      (background && !node.closest(messageSelector) && !panel)
    ) {
      node.setAttribute('data-wppd-media-ignore', '');
      continue;
    }
    node.setAttribute('data-wppd-media', mediaKind(node));
    if (panel) node.setAttribute('data-wppd-media-panel', '');
  }
}
