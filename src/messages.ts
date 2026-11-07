export const messageSelector =
  '.message-in, .message-out, [data-testid="msg-container"], [data-id^="true_"], [data-id^="false_"]';
export const mediaSelector =
  'img:not(.emoji):not([data-testid="emoji"] *), video, canvas, [data-testid="sticker"], [data-testid="album"], [data-testid="media-grid"], [data-testid="album-image"], [data-testid="album-video"], [data-testid="media-cell"], [data-testid="image-thumb"], [data-testid="video-thumb"], [role="grid"] [style*="background-image"]';

type MediaKind = 'images' | 'videos' | 'stickers' | 'unknown';

function mediaKind(node: HTMLElement): MediaKind {
  if (
    node.closest('[data-testid*="sticker"], [data-icon*="sticker"]') ||
    node.matches('img[alt="Sticker"], img[alt="Figurinha"]')
  )
    return 'stickers';
  if (node.tagName === 'VIDEO' || node.closest('[data-testid*="video"]')) return 'videos';
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (parent.matches('[role="grid"], [data-testid="album"]')) break;
    if (parent.querySelector('[data-icon="video-play"], [data-icon="media-play"], video'))
      return 'videos';
    if (parent.matches(messageSelector)) break;
  }
  if (
    node.closest('[data-testid*="image"], [data-testid*="photo"]') ||
    node.matches('img[alt="Photo"], img[alt="Foto"], img[alt="Imagem"]')
  )
    return 'images';
  return 'unknown';
}

/** Annotate visual leaves, not whole grids, so a photo exemption cannot expose a video. */
export function annotateMessages(document: Document) {
  const main = document.querySelector('#main');
  if (!main) return;
  for (const old of main.querySelectorAll('[data-wppm-media], [data-wppm-media-ignore]')) {
    old.removeAttribute('data-wppm-media');
    old.removeAttribute('data-wppm-media-ignore');
  }
  for (const node of main.querySelectorAll<HTMLElement>(mediaSelector)) {
    if (
      node.closest('header, footer, [contenteditable="true"], [data-testid="emoji"]') ||
      node.querySelector(mediaSelector) ||
      node.querySelector(messageSelector)
    ) {
      node.setAttribute('data-wppm-media-ignore', '');
      continue;
    }
    node.setAttribute('data-wppm-media', mediaKind(node));
  }
}
