import { type MessageKey, message } from '../src/i18n';

/** One styled, nonmodal help surface shared by static and dynamically rendered controls. */
export class InfoPopover {
  private trigger: HTMLElement | null = null;
  private pinned = false;
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
    this.panel.textContent = message(trigger.dataset.info as MessageKey);
    trigger.setAttribute('aria-describedby', this.panel.id);
    if (!this.panel.matches(':popover-open')) this.panel.showPopover();
    const anchor = trigger.getBoundingClientRect();
    const box = this.panel.getBoundingClientRect();
    const left = Math.max(12, Math.min(anchor.left, innerWidth - box.width - 12));
    const below = anchor.bottom + 8;
    const top =
      below + box.height <= innerHeight - 12 ? below : Math.max(12, anchor.top - box.height - 8);
    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }

  private deferClose() {
    clearTimeout(this.timer);
    if (!this.pinned) this.timer = setTimeout(() => this.close(), 150);
  }

  close() {
    clearTimeout(this.timer);
    this.trigger?.removeAttribute('aria-describedby');
    this.trigger = null;
    this.pinned = false;
    if (this.panel.matches(':popover-open')) this.panel.hidePopover();
  }
}
