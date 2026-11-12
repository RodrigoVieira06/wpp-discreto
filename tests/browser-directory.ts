export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: unknown) => results.push({ name, pass: !!pass });
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const request = (input: Record<string, unknown>) =>
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
    let clicks = 0;
    pane.addEventListener('click', () => {
      clicks++;
    });
    const render = () => {
      const first = Math.floor(pane.scrollTop / 20);
      spacer.replaceChildren(
        ...Array.from({ length: Math.min(11, 60 - first) }, (_, index) => {
          const number = first + index + 1;
          const row = document.createElement('div');
          row.setAttribute('role', 'row');
          row.style.cssText = `position:absolute;top:${(number - 1) * 20}px;height:20px;padding:0`;
          row.innerHTML = `<div role="gridcell"><span data-testid="cell-frame-title"><span class="sr-only" data-testid="unread-count">6 mensagens não lidas</span><span dir="auto">Diretório ${number}</span></span></div><div role="gridcell"><span title="Preview">Private preview</span></div>`;
          return row;
        }),
      );
    };
    pane.addEventListener('scroll', render);
    pane.scrollTop = 160;
    render();
    await wait(30);
    const saved = JSON.stringify(stored);
    const [context, concurrent] = await Promise.all([
      request({ scan: true, names: ['Diretório 60'] }),
      request({ scan: true, names: ['Diretório 59'] }),
    ]);
    const names = context.chats as string[];
    check(
      'scan collects every virtualized sidebar row',
      names.filter((name) => name.startsWith('Diretório ')).length === 60 &&
        context.scanComplete === true,
    );
    check(
      'concurrent requests share the scan and validate their own names',
      (concurrent.found as string[]).includes('Diretório 59'),
    );
    check(
      'unread counts and message previews are excluded',
      !names.some((name) => name.includes('mensagens') || name.includes('Preview')),
    );
    check('scanning deduplicates names', new Set(names).size === names.length);
    check('scan restores the original scroll position', pane.scrollTop === 160);
    check(
      'scan does not open chats or persist discovered names',
      clicks === 0 && JSON.stringify(stored) === saved,
    );
    const snapshot = await request({ names: ['Diretório 60'] });
    check(
      'offscreen names remain available in page memory',
      (snapshot.chats as string[]).includes('Diretório 60') &&
        (snapshot.found as string[]).includes('Diretório 60'),
    );
    spacer.replaceChildren();
    const loadingSnapshot = await request({ names: ['Diretório 60'] });
    check(
      'temporary empty rendering retains discovered names',
      loadingSnapshot.available === true &&
        (loadingSnapshot.chats as string[]).includes('Diretório 60'),
    );
    render();
    pane.scrollTop = 240;
    render();
    const canceled = request({ scan: true });
    await wait(150);
    await request({ type: 'wpp-discreto:cancel-chat-scan' });
    const partial = await canceled;
    check(
      'cancellation reports partial results and restores scroll',
      partial.scanComplete === false && pane.scrollTop === 240,
    );
    const interrupted = request({ scan: true });
    await wait(150);
    pane.scrollTop = 340;
    pane.dispatchEvent(new WheelEvent('wheel', { deltaY: 20 }));
    const stopped = await interrupted;
    check(
      'user scrolling interrupts without moving the sidebar back',
      stopped.scanComplete === false && pane.scrollTop === 340,
    );
    const other = document.createElement('aside');
    other.id = 'pane-side';
    other.innerHTML =
      '<div role="row"><div role="gridcell"><span title="Outra lista">Outra lista</span></div></div>';
    pane.replaceWith(other);
    const replaced = await request({ names: ['Diretório 60'] });
    check(
      'replacing the sidebar clears the previous directory',
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
