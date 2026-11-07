export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const check = (name: string, condition: unknown) => {
    results.push({ name, pass: !!condition });
  };
  const filter = (node: Element) => getComputedStyle(node).filter;
  const mask = () => document.querySelector<HTMLElement>('[data-wppm-screen]');
  const history = document.getElementById('history') as HTMLElement;
  try {
    history.scrollTop = history.scrollHeight;
    await wait();
    check('conversation uses a viewport mask', !!mask());
    check(
      'message text stays unchanged beneath the visual mask',
      filter(history.firstElementChild as HTMLElement) === 'none',
    );
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
      !mask() &&
        document.querySelectorAll('[data-wppm-alias]').length === 0 &&
        filter(history.firstElementChild as HTMLElement) === 'none' &&
        filter(document.querySelector('[data-testid="chat-subtitle"]') as HTMLElement) === 'none',
    );
    await chrome.storage.local.set({ settings: { ...activeSettings, aliasesEnabled: false } });
    check(
      'aliases disabled independently from message protection',
      document.querySelectorAll('[data-wppm-alias]').length === 0 && !!mask(),
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

    const unreadRow = document.createElement('div');
    unreadRow.setAttribute('role', 'row');
    unreadRow.innerHTML =
      '<div role="gridcell"><span data-testid="cell-frame-title"><span data-testid="unread-count" class="sr-only">6 mensagens não lidas</span><span dir="auto">Nome do Grupo</span></span></div>';
    pane?.prepend(unreadRow);
    for (const listener of messageListeners)
      listener(
        { type: 'wpp-mask:chat-context', names: ['Nome do Grupo'] },
        { id: 'test-extension' },
        (response) => {
          chatContext = response as typeof chatContext;
        },
      );
    check(
      'unread badge is excluded from discovered names and validation',
      chatContext?.chats[0] === 'Nome do Grupo' && chatContext.found.includes('Nome do Grupo'),
    );
    await chrome.storage.local.set({ aliases: [{ original: 'Nome do Grupo', alias: 'Equipe' }] });
    check(
      'alias decorates only the title and preserves unread badge',
      unreadRow.querySelector('[dir="auto"]')?.getAttribute('data-wppm-alias') === 'Equipe' &&
        unreadRow.querySelector('[data-testid="unread-count"]')?.textContent ===
          '6 mensagens não lidas',
    );
    await chrome.storage.local.set({
      aliases: [{ original: 'Família Silva', alias: 'Meu pessoal' }],
    });

    const nestedTitleRow = document.createElement('div');
    nestedTitleRow.setAttribute('role', 'row');
    nestedTitleRow.innerHTML =
      '<div role="gridcell"><span title="Example Contact"><span style="font-size:17px">Example Contact</span></span></div>';
    pane?.prepend(nestedTitleRow);
    await chrome.storage.local.set({
      aliases: [{ original: 'Example Contact', alias: 'Example alias' }],
    });
    const originalChild = nestedTitleRow.querySelector<HTMLElement>('span[title] > span');
    const originalStyle = originalChild ? getComputedStyle(originalChild) : null;
    check(
      'nested original title is visually hidden instead of appended to alias',
      !!originalStyle &&
        (originalStyle.fontSize === '0px' ||
          originalStyle.clipPath !== 'none' ||
          originalStyle.visibility === 'hidden' ||
          originalStyle.display === 'none'),
    );
    check(
      'alias replacement retains original text for WhatsApp',
      nestedTitleRow.querySelector('[title]')?.textContent === 'Example Contact' &&
        nestedTitleRow.querySelector('[data-wppm-alias]')?.getAttribute('data-wppm-alias') ===
          'Example alias',
    );
    await chrome.storage.local.set({
      aliases: [{ original: 'Família Silva', alias: 'Meu pessoal' }],
    });

    const newMessage = document.createElement('div');
    newMessage.className = 'message-in';
    newMessage.textContent = 'Nova mensagem';
    const boundary = mask()?.getBoundingClientRect().bottom;
    history.append(newMessage);
    await wait();
    check(
      'new messages do not move the screen boundary',
      mask()?.getBoundingClientRect().bottom === boundary,
    );
    newMessage.textContent = 'Conteúdo reciclado para outra conversa';
    await wait();
    check(
      'recycling does not introduce message reveal exceptions',
      !document.querySelector('[data-wppm-reveal]'),
    );
    history.scrollTop = 0;
    history.dispatchEvent(new Event('scroll'));
    check(
      'scrolling history keeps the readable area available',
      mask()?.getBoundingClientRect().bottom === boundary,
    );
    history.scrollTop = history.scrollHeight;
    history.dispatchEvent(new Event('scroll'));
    await wait();
    check(
      'returning to the bottom keeps the same screen boundary',
      mask()?.getBoundingClientRect().bottom === boundary,
    );

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
    await chrome.storage.local.set({ settings: { blurChat: true, visibleArea: 0 } });
    check(
      'nested message structure does not change full-screen protection',
      mask()?.getBoundingClientRect().height === history.clientHeight,
    );

    // Remove #main to emulate navigating to the WhatsApp home screen.
    document.getElementById('main')?.remove();
    await wait();
    check('navigation clears detached message references', !mask());
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
