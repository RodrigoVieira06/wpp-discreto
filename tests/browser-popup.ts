export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, condition: unknown) => results.push({ name, pass: !!condition });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 40));
  const byId = <T extends HTMLElement = HTMLInputElement>(id: string) =>
    document.getElementById(id) as T;
  const change = (id: string, value: string | boolean) => {
    const input = byId(id);
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = String(value);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const submit = (original: string, alias: string) => {
    byId('original-name').value = original;
    byId('alias-name').value = alias;
    byId('alias-form').dispatchEvent(new Event('submit', { cancelable: true }));
  };
  try {
    await wait();
    check(
      'popup loads persisted settings',
      byId('blur-chat').checked && byId('visible-count').value === '4',
    );
    check('popup loads saved aliases', byId('alias-list').children.length === 1);
    change('blur-previews', false);
    await wait();
    check('preview toggle persisted', stored.settings.blurPreviews === false);
    change('visible-count', '3');
    await wait();
    check(
      'recent count persisted and labelled',
      stored.settings.visibleCount === 3 && byId('visible-label').value === '3',
    );
    change('blur-strength', '14');
    await wait();
    check(
      'blur strength persisted and labelled',
      stored.settings.blurStrength === 14 && byId('strength-label').value === '14 px',
    );

    submit('Grupo Novo', '<script>alert(1)</script>');
    await wait();
    check('new alias persisted', stored.aliases.length === 2);
    check(
      'popup does not interpret alias HTML',
      !byId('alias-list').querySelector('script') &&
        byId('alias-list').textContent.includes('<script>alert(1)</script>'),
    );
    submit(' Grupo Novo ', 'Novo apelido');
    await wait();
    check(
      'saving existing name updates without duplicate',
      stored.aliases.length === 2 &&
        stored.aliases.find((entry) => entry.original === 'Grupo Novo')?.alias === 'Novo apelido',
    );
    byId('alias-list').lastElementChild?.querySelector('button')?.click();
    await wait();
    check(
      'remove alias persisted',
      stored.aliases.length === 1 && byId('alias-list').children.length === 1,
    );

    window.failNextSave = true;
    change('blur-chat', false);
    await wait();
    check('failed save keeps original persisted settings', stored.settings.blurChat === true);
    check(
      'failed save restores controls and shows error',
      byId('blur-chat').checked &&
        byId('status').dataset.error === 'true' &&
        !byId<HTMLFieldSetElement>('controls').disabled,
    );

    change('blur-chat', false);
    await wait();
    check(
      'chat disabled independently of previews',
      stored.settings.blurChat === false && stored.settings.blurPreviews === false,
    );
    check('count control disabled when chat protection off', byId('visible-count').disabled);

    await chrome.storage.local.set({
      settings: { blurPreviews: true, blurChat: true, visibleCount: 7, blurStrength: 10 },
    });
    check(
      'external storage update refreshes popup',
      byId('visible-count').value === '7' && byId('blur-previews').checked,
    );
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
