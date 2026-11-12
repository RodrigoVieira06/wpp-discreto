export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: unknown) => results.push({ name, pass: !!pass });
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const request = (input: Record<string, unknown> = {}) =>
    new Promise<Record<string, unknown>>((resolve) => {
      for (const listener of messageListeners)
        listener(
          { type: 'wpp-discreto:chat-context', ...input },
          { id: 'test-extension' },
          (response) => resolve(response as Record<string, unknown>),
        );
    });
  try {
    await wait(80);
    const pane = document.getElementById('pane-side') as HTMLElement;
    pane.style.cssText = 'height:200px;overflow-y:auto;position:relative;width:260px';
    const spacer = document.createElement('div');
    spacer.style.cssText = 'height:1200px;position:relative';
    pane.replaceChildren(spacer);
    const render = () => {
      const first = Math.floor(pane.scrollTop / 20);
      const rows = Array.from({ length: Math.min(11, 60 - first) }, (_, index) => {
        const number = first + index + 1;
        const row = document.createElement('div');
        row.setAttribute('role', 'row');
        row.style.cssText = `position:absolute;top:${(number - 1) * 20}px;height:20px;padding:0`;
        row.innerHTML = `<div role="gridcell"><span data-testid="cell-frame-title"><span class="sr-only" data-testid="unread-count">6 mensagens não lidas</span><span dir="auto">Diretório ${number}</span></span></div><div role="gridcell"><span title="Preview">Private preview</span></div>`;
        return row;
      });
      // A virtualized list can recycle DOM nodes in a different order from their screen positions.
      spacer.replaceChildren(...rows.reverse());
    };
    pane.addEventListener('scroll', render);
    pane.scrollTop = 160;
    render();
    await wait(40);
    let scrollEvents = 0;
    let clicks = 0;
    pane.addEventListener('scroll', () => {
      scrollEvents++;
    });
    pane.addEventListener('click', () => {
      clicks++;
    });
    const saved = JSON.stringify(stored);
    const children = [...spacer.children];
    const first = await request({ scan: true, names: ['Diretório 60'] });
    const names = first.chats as string[];
    check(
      'lookup never scrolls even for a legacy scan request',
      pane.scrollTop === 160 && scrollEvents === 0,
    );
    check(
      'lookup never reorders native list nodes',
      children.every((node, index) => spacer.children[index] === node),
    );
    check(
      'results preserve WhatsApp visual order',
      JSON.stringify(names.filter((name) => name.startsWith('Diretório '))) ===
        JSON.stringify(Array.from({ length: 11 }, (_, index) => `Diretório ${index + 9}`)),
    );
    check('unloaded names are not invented or force-loaded', !names.includes('Diretório 60'));
    check(
      'unread counters and previews are excluded',
      !names.some((name) => name.includes('mensagens') || name.includes('Preview')),
    );
    check(
      'lookup does not click chats or write storage',
      clicks === 0 && JSON.stringify(stored) === saved,
    );
    // Only the test's simulated user scroll loads another batch.
    pane.scrollTop = 980;
    render();
    await wait(40);
    await request();
    pane.scrollTop = 160;
    render();
    await wait(40);
    const remembered = await request({ names: ['Diretório 60'] });
    check(
      'names loaded by user scrolling stay searchable in page memory',
      (remembered.chats as string[]).includes('Diretório 60') &&
        (remembered.found as string[]).includes('Diretório 60'),
    );
    const order = (remembered.chats as string[]).filter((name) => name.startsWith('Diretório '));
    check(
      'cached names keep their relative sidebar sequence',
      order.indexOf('Diretório 9') < order.indexOf('Diretório 60'),
    );
    spacer.replaceChildren();
    const empty = await request();
    check(
      'temporary empty rendering keeps the directory',
      empty.available === true && (empty.chats as string[]).includes('Diretório 60'),
    );
    const other = document.createElement('aside');
    other.id = 'pane-side';
    other.innerHTML =
      '<div role="row"><div role="gridcell"><span title="Outra lista">Outra lista</span></div></div>';
    pane.replaceWith(other);
    const replaced = await request();
    check(
      'replacing the sidebar clears its previous names',
      !(replaced.chats as string[]).includes('Diretório 60'),
    );
  } catch (error) {
    check(error instanceof Error ? (error.stack ?? error.message) : String(error), false);
  }
  const report = document.createElement('pre');
  report.id = 'test-results';
  report.textContent = JSON.stringify(results);
  document.body.append(report);
})();
