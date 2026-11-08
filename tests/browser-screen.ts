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
    const viewer = document.createElement('div');
    viewer.dataset.testid = 'media-viewer';
    viewer.style.cssText = 'position:fixed;inset:0;z-index:9999';
    viewer.hidden = true;
    viewer.innerHTML = '<img data-testid="image-thumb">';
    document.body.append(viewer);
    await wait();
    check('a hidden media viewer does not disable conversation protection', !!overlay());
    viewer.hidden = false;
    await wait();
    check('opening a media viewer removes the conversation mask', !overlay());
    viewer.setAttribute('aria-hidden', 'true');
    await wait();
    check('hiding a mounted viewer restores conversation protection', !!overlay());
    viewer.removeAttribute('aria-hidden');
    await wait();
    check('reopening a mounted viewer removes the mask again', !overlay());
    viewer.remove();
    await wait();
    check(
      'closing the viewer restores the original screen boundary',
      Math.abs((bounds()?.height ?? 0) - viewport.height * 0.6) < 1,
    );
    const standaloneImage = document.createElement('img');
    standaloneImage.dataset.testid = 'media-viewer-img';
    standaloneImage.style.cssText = 'position:fixed;inset:0;width:100%;height:100%';
    standaloneImage.src =
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect width="500" height="500" fill="red"/%3E%3C/svg%3E';
    document.body.append(standaloneImage);
    await chrome.storage.local.set({ settings: { blurChat: true, blurImages: true } });
    await wait();
    check(
      'a standalone viewer image is fully protected when selected',
      getComputedStyle(standaloneImage).filter === 'blur(8px)',
    );
    check('a standalone viewer image also suspends the chat mask', !overlay());
    standaloneImage.remove();
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.style.cssText = 'position:fixed;inset:0';
    modal.innerHTML = '<img data-testid="image-thumb">';
    document.body.append(modal);
    await wait();
    check('a fullscreen media dialog suspends the chat mask without a test id', !overlay());
    modal.style.visibility = 'hidden';
    await wait();
    check('a hidden fullscreen dialog does not disable the chat mask', !!overlay());
    modal.remove();
    await wait();
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
