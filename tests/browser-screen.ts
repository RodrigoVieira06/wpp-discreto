export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: unknown) => results.push({ name, pass: !!pass });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const history = document.getElementById('history') as HTMLElement;
  const overlay = () => document.querySelector<HTMLElement>('[data-wppm-screen]');
  const bounds = () => overlay()?.getBoundingClientRect();
  try {
    await wait();
    const viewport = history.getBoundingClientRect();
    check('screen protection exists', !!overlay());
    check(
      'default clear area is the bottom forty percent',
      Math.abs((bounds()?.height ?? 0) - viewport.height * 0.6) < 1,
    );
    check(
      'mask starts below the header and matches conversation width',
      bounds()?.top === viewport.top &&
        bounds()?.left === viewport.left &&
        bounds()?.width === history.clientWidth,
    );
    check(
      'mask uses actual backdrop blur without intercepting clicks',
      getComputedStyle(overlay() as HTMLElement).backdropFilter === 'blur(8px)' &&
        getComputedStyle(overlay() as HTMLElement).pointerEvents === 'none',
    );
    history.scrollTop = history.scrollHeight;
    history.dispatchEvent(new Event('scroll'));
    const bottom = bounds()?.bottom;
    history.scrollTop = 0;
    history.dispatchEvent(new Event('scroll'));
    check(
      'history scrolling preserves the same readable screen area immediately',
      bounds()?.bottom === bottom && history.scrollTop === 0,
    );
    check(
      'no message-count reveal exceptions remain',
      !document.querySelector('[data-wppm-reveal]'),
    );
    await chrome.storage.local.set({ settings: { blurChat: true, visibleArea: 75 } });
    check(
      'percentage changes the physical screen boundary',
      Math.abs((bounds()?.height ?? 0) - viewport.height * 0.25) < 1,
    );
    history.style.height = '320px';
    await wait();
    check(
      'resizing recomputes the protected screen area',
      Math.abs((bounds()?.height ?? 0) - 80) < 1,
    );
    await chrome.storage.local.set({
      settings: { blurChat: true, fullBlur: true, visibleArea: 60 },
    });
    check('explicit full blur protects the entire message viewport', bounds()?.height === 320);
    await chrome.storage.local.set({
      settings: { blurChat: true, fullBlur: false, visibleArea: 10 },
    });
    check(
      'readable area cannot drop below twenty percent',
      Math.abs((bounds()?.height ?? 0) - 256) < 1,
    );
    await chrome.storage.local.set({ settings: { blurChat: true, visibleArea: 100 } });
    check('one hundred leaves the entire text viewport readable', bounds()?.height === 0);
    await chrome.storage.local.set({ settings: { blurChat: true, enabled: false } });
    check('master off removes the screen mask', !overlay());
    await chrome.storage.local.set({ settings: { blurChat: false } });
    check('chat protection off removes the screen mask', !overlay());
    await chrome.storage.local.set({ settings: { blurChat: true } });
    history.remove();
    document.getElementById('main')?.remove();
    await wait();
    check('navigation removes the detached conversation mask', !overlay());
  } catch (error) {
    check(error instanceof Error ? (error.stack ?? error.message) : String(error), false);
  }
  const report = document.createElement('pre');
  report.id = 'test-results';
  report.textContent = JSON.stringify(results);
  document.body.append(report);
})();
