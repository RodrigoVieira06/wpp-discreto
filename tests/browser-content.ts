export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const check = (name: string, condition: unknown) => {
    results.push({ name, pass: !!condition });
  };
  const filter = (node: Element) => getComputedStyle(node).filter;
  const visible = () => document.querySelectorAll('[data-wppm-reveal]').length;
  const history = document.getElementById('history') as HTMLElement;
  try {
    history.scrollTop = history.scrollHeight;
    await wait();
    check('only four recent messages revealed', visible() === 4);
    check(
      'oldest message blurred',
      filter(history.firstElementChild as HTMLElement) === 'blur(8px)',
    );
    check('latest message readable', filter(history.lastElementChild as HTMLElement) === 'none');
    check(
      'sidebar preview blurred',
      filter(document.querySelector('[data-testid="chat-subtitle"]') as HTMLElement) ===
        'blur(8px)',
    );
    check(
      'alias applied to header and sidebar',
      document.querySelectorAll('[data-wppm-alias="Meu pessoal"]').length === 2,
    );
    check(
      'original DOM text preserved',
      document.querySelector<HTMLElement>('#main header span')?.textContent === 'Família Silva',
    );

    const activeSettings = { ...stored.settings };
    await chrome.storage.local.set({ settings: { ...activeSettings, enabled: false } });
    check(
      'master switch removes every visual effect',
      visible() === 0 &&
        document.querySelectorAll('[data-wppm-alias]').length === 0 &&
        filter(history.firstElementChild as HTMLElement) === 'none' &&
        filter(document.querySelector('[data-testid="chat-subtitle"]') as HTMLElement) === 'none',
    );
    await chrome.storage.local.set({ settings: { ...activeSettings, aliasesEnabled: false } });
    check(
      'aliases disabled independently from message protection',
      document.querySelectorAll('[data-wppm-alias]').length === 0 &&
        filter(history.firstElementChild as HTMLElement) === 'blur(8px)',
    );
    await chrome.storage.local.set({ settings: activeSettings });
    check(
      'reenabling restores saved aliases',
      document.querySelectorAll('[data-wppm-alias="Meu pessoal"]').length === 2,
    );

    const pane = document.getElementById('pane-side');
    for (let index = 1; index <= 12; index++) {
      const row = document.createElement('div');
      row.setAttribute('role', 'row');
      row.innerHTML = `<div role="gridcell"><span title="Contato ${index}">Contato ${index}</span></div><div role="gridcell"><span title="Preview">Preview</span></div>`;
      pane?.append(row);
    }
    let chatContext: { available: boolean; chats: string[]; found: string[] } | undefined;
    for (const listener of messageListeners)
      listener(
        { type: 'wpp-mask:chat-context', names: ['Família Silva', 'Contato 12', 'Missing'] },
        { id: 'test-extension' },
        (response) => {
          chatContext = response as typeof chatContext;
        },
      );
    check(
      'chat lookup exposes only ten original conversation names',
      chatContext?.chats.length === 10 &&
        chatContext.chats[0] === 'Família Silva' &&
        !chatContext.chats.includes('Preview'),
    );
    check(
      'alias validation checks loaded names beyond suggestions',
      chatContext?.found.includes('Contato 12') && !chatContext.found.includes('Missing'),
    );

    const newMessage = document.createElement('div');
    newMessage.className = 'message-in';
    newMessage.textContent = 'Nova mensagem';
    history.append(newMessage);
    check('new messages blurred before observer updates', filter(newMessage) === 'blur(8px)');
    history.scrollTop = history.scrollHeight;
    await wait();
    check(
      'new arrival maintains recent count',
      visible() === 4 && newMessage.hasAttribute('data-wppm-reveal'),
    );

    newMessage.textContent = 'Conteúdo reciclado para outra conversa';
    await Promise.resolve();
    check(
      'recycled message content masked before deferred render',
      !newMessage.hasAttribute('data-wppm-reveal') && filter(newMessage) === 'blur(8px)',
    );
    await wait();

    history.scrollTop = 0;
    history.dispatchEvent(new Event('scroll'));
    check('scroll immediately masks history', visible() === 0);
    await wait();
    check('history stays masked away from bottom', visible() === 0);
    history.scrollTop = history.scrollHeight;
    history.dispatchEvent(new Event('scroll'));
    await wait();
    check('returning to bottom restores recent messages', visible() === 4);

    for (const count of [0, 3, 12]) {
      await chrome.storage.local.set({
        settings: { blurPreviews: true, blurChat: true, visibleCount: count, blurStrength: 12 },
      });
      check(`level ${count} respected`, visible() === Math.min(count, history.children.length));
    }
    await chrome.storage.local.set({
      aliases: [{ original: 'Família Silva', alias: '<img src=x onerror=alert(1)>' }],
    });
    check(
      'alias safely displayed as plain text',
      !document.querySelector('#main header img') &&
        document.querySelector<HTMLElement>('#main header span')?.dataset.wppmAlias ===
          '<img src=x onerror=alert(1)>',
    );

    const recycled = document.querySelector<HTMLElement>('#pane-side [title]');
    if (!recycled) throw new Error('Missing chat row in fixture');
    recycled.title = 'Outro grupo';
    recycled.textContent = 'Outro grupo';
    await wait();
    check('recycled rows lose previous alias', !recycled.hasAttribute('data-wppm-alias'));
    await chrome.storage.local.set({ aliases: [] });
    check(
      'deleting aliases restores all titles',
      document.querySelectorAll('[data-wppm-alias]').length === 0,
    );

    await chrome.storage.local.set({ settings: { blurPreviews: false, blurChat: false } });
    check(
      'disabling restores messages',
      [...history.children].every((node) => filter(node) === 'none'),
    );
    check(
      'disabling restores previews',
      filter(document.querySelector('[data-testid="chat-subtitle"]') as HTMLElement) === 'none',
    );

    const nested = document.createElement('div');
    nested.dataset.testid = 'msg-container';
    nested.innerHTML = '<div class="message-in">Mensagem aninhada</div>';
    history.replaceChildren(nested);
    await chrome.storage.local.set({ settings: { blurChat: true, visibleCount: 1 } });
    check(
      'nested message counted once and readable',
      visible() === 1 && filter(nested.firstElementChild as HTMLElement) === 'none',
    );
    await chrome.storage.local.set({ settings: { blurChat: true, visibleCount: 0 } });
    check(
      'nested message masked with zero exceptions',
      filter(nested.firstElementChild as HTMLElement) === 'blur(8px)',
    );

    // Remove #main to emulate navigating to the WhatsApp home screen.
    document.getElementById('main')?.remove();
    await wait();
    check('navigation clears detached message references', visible() === 0);
  } catch (error) {
    results.push({
      name: error instanceof Error ? (error.stack ?? error.message) : String(error),
      pass: false,
    });
  }
  const report = document.createElement('pre');
  report.id = 'test-results';
  report.textContent = JSON.stringify(results);
  document.body.append(report);
})();
