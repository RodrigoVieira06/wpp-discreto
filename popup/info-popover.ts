import { type MessageKey, message } from '../src/i18n';

/** One styled, nonmodal help surface shared by static and dynamically rendered controls. */
export class InfoPopover {
  private trigger: HTMLElement | null = null;
  private pinned = false;
  private entrance: Animation | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly panel: HTMLElement) {
    panel.addEventListener('mouseenter', () => clearTimeout(this.timer));
    panel.addEventListener('mouseleave', () => this.deferClose());
    document.addEventListener('pointerdown', (event) => {
      if (
        event.target instanceof Node &&
        !panel.contains(event.target) &&
        !this.trigger?.contains(event.target)
      )
        this.close();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && panel.matches(':popover-open')) {
        this.close();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });
    document.addEventListener(
      'scroll',
      (event) => {
        if (event.target === panel) return;
        // Focusing a help button can scroll its ancestor after the focus event.
        // Keep keyboard help attached instead of immediately dismissing it.
        const trigger = this.trigger;
        const box = trigger?.getBoundingClientRect();
        if (
          trigger &&
          document.activeElement === trigger &&
          box &&
          box.top >= 0 &&
          box.bottom <= innerHeight
        )
          this.show(trigger);
        else this.close();
      },
      { capture: true, passive: true },
    );
    window.addEventListener('resize', () => this.close());
  }

  bind(trigger: HTMLElement) {
    trigger.addEventListener('mouseenter', () => this.show(trigger));
    trigger.addEventListener('mouseleave', () => this.deferClose());
    trigger.addEventListener('focus', () => this.show(trigger));
    trigger.addEventListener('blur', () => this.close());
    trigger.addEventListener('click', () => {
      if (trigger.dataset.infoAction) {
        this.close();
        return;
      }
      if (this.trigger === trigger && this.pinned) this.close();
      else {
        this.show(trigger);
        this.pinned = true;
      }
    });
  }

  private show(trigger: HTMLElement) {
    clearTimeout(this.timer);
    if (trigger.matches(':disabled')) return;
    if (this.trigger !== trigger) this.close();
    this.trigger = trigger;
    const opening = !this.panel.matches(':popover-open');
    const text = message(trigger.dataset.info as MessageKey);
    if (trigger.dataset.infoTitle) {
      const title = document.createElement('strong');
      title.textContent = message(trigger.dataset.infoTitle as MessageKey);
      const body = document.createElement('p');
      body.textContent = text;
      this.panel.replaceChildren(title, body);
    } else this.panel.textContent = text;
    trigger.setAttribute('aria-describedby', this.panel.id);
    if (!this.panel.matches(':popover-open')) this.panel.showPopover();
    const anchor = trigger.getBoundingClientRect();
    const box = { width: this.panel.offsetWidth, height: this.panel.offsetHeight };
    const left = Math.max(12, Math.min(anchor.left, innerWidth - box.width - 12));
    const below = anchor.bottom + 8;
    const top =
      below + box.height <= innerHeight - 12 ? below : Math.max(12, anchor.top - box.height - 8);
    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
    this.panel.style.transformOrigin = below === top ? 'center top' : 'center bottom';
    if (opening && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.entrance?.cancel();
      this.entrance = this.panel.animate(
        [
          { transform: 'scale(.96) translateY(3px)', offset: 0 },
          { transform: 'scale(1.012) translateY(0)', offset: 0.7 },
          { transform: 'scale(1)', offset: 1 },
        ],
        { duration: 200, easing: 'cubic-bezier(.2,.8,.3,1)' },
      );
    }
  }

  private deferClose() {
    clearTimeout(this.timer);
    if (!this.pinned) this.timer = setTimeout(() => this.close(), 150);
  }

  close() {
    this.entrance?.cancel();
    this.entrance = null;
    clearTimeout(this.timer);
    this.trigger?.removeAttribute('aria-describedby');
    this.trigger = null;
    this.pinned = false;
    if (this.panel.matches(':popover-open')) this.panel.hidePopover();
  }
}
