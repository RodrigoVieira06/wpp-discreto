import { messageSelector } from './messages';
import type { Settings } from './settings';
import { audioElements, hasOpenMediaViewer } from './surfaces';

const namespace = 'http://www.w3.org/2000/svg';
const maskId = 'wppm-screen-audio-mask';

/** A viewport mask also covers partial messages and albums taller than the screen. */
export class ScreenProtection {
  private overlay?: HTMLDivElement;
  private viewport?: HTMLElement;
  private main?: HTMLElement;
  private config?: Settings;
  private resize = new ResizeObserver(() => {
    if (this.config) this.update(this.config);
  });

  update(config: Settings) {
    this.config = config;
    const main = document.querySelector<HTMLElement>('#main');
    if (!main || !config.enabled || !config.blurChat || hasOpenMediaViewer(document)) {
      this.resize.disconnect();
      this.viewport = undefined;
      this.main = undefined;
      this.overlay?.remove();
      this.overlay = undefined;
      return;
    }
    const message = main.querySelector<HTMLElement>(messageSelector);
    let viewport = main;
    for (
      let node = message?.parentElement;
      node && main.contains(node);
      node = node.parentElement
    ) {
      if (/auto|scroll/.test(getComputedStyle(node).overflowY)) {
        viewport = node;
        break;
      }
    }
    if (this.viewport !== viewport || this.main !== main) {
      this.resize.disconnect();
      this.resize.observe(main);
      this.resize.observe(viewport);
      this.viewport = viewport;
      this.main = main;
    }
    const rect = viewport.getBoundingClientRect();
    let top = Math.max(0, rect.top + viewport.clientTop);
    let bottom = Math.min(innerHeight, rect.top + viewport.clientTop + viewport.clientHeight);
    if (viewport === main) {
      const header = main.querySelector('header')?.getBoundingClientRect();
      const footer = main.querySelector('footer')?.getBoundingClientRect();
      if (header) top = Math.max(top, header.bottom);
      if (footer) bottom = Math.min(bottom, footer.top);
    }
    // Ancestor clipping can make a nested conversation viewport smaller than its box.
    for (let node = viewport.parentElement; node; node = node.parentElement) {
      if (/auto|scroll|hidden|clip/.test(getComputedStyle(node).overflowY)) {
        const ancestor = node.getBoundingClientRect();
        top = Math.max(top, ancestor.top + node.clientTop);
        bottom = Math.min(bottom, ancestor.top + node.clientTop + node.clientHeight);
      }
    }
    const left = Math.max(0, rect.left + viewport.clientLeft);
    const width = Math.max(
      0,
      Math.min(innerWidth, rect.left + viewport.clientLeft + viewport.clientWidth) - left,
    );
    const height = Math.max(0, bottom - top) * (config.fullBlur ? 1 : 1 - config.visibleArea / 100);
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.setAttribute('data-wppm-screen', '');
      this.overlay.setAttribute('aria-hidden', 'true');
      this.overlay.style.maskImage = `url("${document.URL.split('#')[0]}#${maskId}")`;
      document.documentElement.append(this.overlay);
    }
    Object.assign(this.overlay.style, {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    });

    // Audio controls remain readable. Media never creates holes in the screen mask.
    const svg = document.createElementNS(namespace, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    const mask = document.createElementNS(namespace, 'mask');
    mask.id = maskId;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', '0');
    mask.setAttribute('y', '0');
    mask.setAttribute('width', String(width));
    mask.setAttribute('height', String(height));
    const rectangle = (x: number, y: number, w: number, h: number, fill: string) => {
      const node = document.createElementNS(namespace, 'rect');
      for (const [key, value] of Object.entries({ x, y, width: w, height: h, fill }))
        node.setAttribute(key, String(value));
      mask.append(node);
    };
    rectangle(0, 0, width, height, 'white');
    for (const asset of audioElements(main)) {
      const box = asset.getBoundingClientRect();
      const x = Math.max(0, box.left - left);
      const y = Math.max(0, box.top - top);
      const w = Math.min(width, box.right - left) - x;
      const h = Math.min(height, box.bottom - top) - y;
      if (w > 0 && h > 0) rectangle(x, y, w, h, 'black');
    }
    svg.append(mask);
    this.overlay.replaceChildren(svg);
  }
}
