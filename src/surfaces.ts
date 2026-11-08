/** WhatsApp integration points: keep these selectors narrow and independent of CSS classes. */
export const infoPanelSelector =
  '[data-testid="drawer-right"], [data-testid="contact-info-drawer"], [data-testid="group-info-drawer"], [data-testid="contact-info"], [data-testid="group-info"], [data-animate-drawer]';
export const mediaViewerSelector =
  '[data-testid="media-viewer"], [data-testid^="media-viewer-"], [data-testid="media-modal"]';
export const mediaPanelSelector = `${infoPanelSelector}, [data-testid="media-gallery"], [data-testid="media-panel"], [data-testid="media-collection"], ${mediaViewerSelector}, [role="dialog"]`;
export const audioSelector =
  '[data-testid="audio-player"], [data-testid="ptt-audio-player"], [data-testid="audio-message"], [data-testid="ptt-message"], [data-testid="ptt"]';

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
