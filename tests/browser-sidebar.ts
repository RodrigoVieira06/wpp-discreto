export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: unknown) => results.push({ name, pass: !!pass });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const filtered = (node: Element) => {
    for (
      let current: Element | null = node;
      current && current.id !== 'pane-side';
      current = current.parentElement
    )
      if (getComputedStyle(current).filter !== 'none') return true;
    return false;
  };
  try {
    await wait();
    const pane = document.getElementById('pane-side') as HTMLElement;
    pane.innerHTML = `<div role="row"><div role="gridcell"><span title="Mãe">Mãe</span><time id="sidebar-time">13:05</time></div><div role="gridcell"><div><span id="preview" data-testid="chat-subtitle">Private message preview</span><span id="unread" data-testid="icon-unread-count" style="display:inline-block;background:#25d366;border-radius:12px;color:#111b21;padding:2px 6px">7</span></div></div></div>
      <div role="row"><div role="gridcell"><span title="Equipe">Equipe</span></div><div role="gridcell" data-testid="last-msg-status"><span id="wrapped-preview">Another preview</span><span id="aria-unread" aria-label="2 mensagens não lidas">2</span></div></div>
      <div role="row"><div role="gridcell"><span title="Clara">Clara</span></div><div role="gridcell" id="direct-preview">Direct text preview <span id="direct-unread" aria-label="1 unread message">1</span></div></div>
      <div role="row"><div role="gridcell"><span title="Pedro">Pedro</span></div><div role="gridcell"><span id="numeric-preview">1234</span><span id="plain-unread" style="display:inline-block;background:#25d366;border-radius:12px;width:24px;height:24px">12</span></div></div>`;
    const original = pane.textContent;
    await chrome.storage.local.set({ settings: { blurPreviews: true } });
    for (const id of ['preview', 'wrapped-preview', 'numeric-preview'])
      check(`${id} remains protected`, filtered(document.getElementById(id) as Element));
    for (const id of ['unread', 'aria-unread', 'direct-unread', 'plain-unread', 'sidebar-time'])
      check(`${id} is clear by default`, !filtered(document.getElementById(id) as Element));
    const direct = document.getElementById('direct-preview') as HTMLElement;
    check(
      'direct preview text is visually protected without filtering its counter',
      getComputedStyle(direct).textShadow !== 'none' &&
        getComputedStyle(document.getElementById('direct-unread') as Element).textShadow === 'none',
    );
    check('sidebar text and order remain unchanged', pane.textContent === original);
    await chrome.storage.local.set({ settings: { blurPreviews: false, blurUnreadCounts: true } });
    check(
      'unread counters can be blurred independently',
      filtered(document.getElementById('unread') as Element) &&
        !filtered(document.getElementById('preview') as Element),
    );
    check(
      'timestamps remain clear when counters are protected',
      !filtered(document.getElementById('sidebar-time') as Element),
    );
    const replacement = document.createElement('span');
    replacement.dataset.testid = 'icon-unread-count';
    replacement.textContent = '9';
    document.getElementById('unread')?.replaceWith(replacement);
    await wait();
    check('new unread counters inherit the saved choice', filtered(replacement));
    await chrome.storage.local.set({
      settings: { enabled: false, blurPreviews: true, blurUnreadCounts: true },
    });
    check(
      'master off clears previews and counters',
      !filtered(replacement) &&
        !filtered(document.getElementById('preview') as Element) &&
        getComputedStyle(direct).textShadow === 'none',
    );
    await chrome.storage.local.set({ settings: {} });
    check('default restoration leaves unread counters visible', !filtered(replacement));
  } catch (error) {
    check(error instanceof Error ? (error.stack ?? error.message) : String(error), false);
  }
  const report = document.createElement('pre');
  report.id = 'test-results';
  report.textContent = JSON.stringify(results);
  document.body.append(report);
})();
