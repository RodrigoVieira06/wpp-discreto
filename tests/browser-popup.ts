export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, condition: unknown) => results.push({ name, pass: !!condition });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 70));
  const byId = <T extends HTMLElement = HTMLInputElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing test element: ${id}`);
    return element as T;
  };
  const change = (id: string, value: string | boolean) => {
    const element = byId(id);
    if (element.type === 'checkbox') element.checked = Boolean(value);
    else element.value = String(value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const submit = (original: string, alias: string) => {
    byId('original-name').value = original;
    byId('alias-name').value = alias;
    byId('alias-form').dispatchEvent(new Event('submit', { cancelable: true }));
  };
  try {
    await wait();
    const logo = document.querySelector('header img.brand-icon');
    check(
      'approved logo loads',
      logo instanceof HTMLImageElement && logo.complete && logo.naturalWidth > 0,
    );
    check(
      'browser locale selection works',
      document.documentElement.lang === window.expectedLanguage,
    );
    check(
      'no slogan or persistent ready message',
      !document.querySelector('[data-i18n="brandTagline"]') && byId('status').textContent === '',
    );
    check(
      'redundant always-blur media control is removed',
      !document.getElementById('always-blur-media'),
    );
    check(
      'localized author credit is present in the footer',
      document.querySelector('footer [data-i18n="developerCredit"]')?.textContent ===
        window.expectedMessages.developerCredit && !!window.expectedMessages.developerCredit,
    );
    check('settings hidden initially', byId('settings-panel').hidden);
    document.querySelector('footer')?.scrollIntoView({ block: 'end' });
    check(
      'local-only notice is translated and visible',
      document.querySelector('footer [data-i18n="localOnlyNotice"]')?.textContent ===
        window.expectedMessages.localOnlyNotice &&
        (document.querySelector('footer')?.getBoundingClientRect().height ?? 0) > 0 &&
        (document.querySelector('footer')?.getBoundingClientRect().bottom ?? Infinity) <=
          window.innerHeight,
    );
    check(
      'media protection starts opt-in',
      !stored.settings.blurImages && !stored.settings.blurVideos && !stored.settings.blurStickers,
    );
    change('advanced-blur', true);
    await wait();
    check(
      'advanced blur enables chat protection and all media settings',
      stored.settings.blurChat &&
        stored.settings.blurImages &&
        stored.settings.blurVideos &&
        stored.settings.blurStickers,
    );
    change('advanced-blur', false);
    await wait();
    check(
      'advanced blur can clear media settings without disabling text protection',
      stored.settings.blurChat &&
        !stored.settings.blurImages &&
        !stored.settings.blurVideos &&
        !stored.settings.blurStickers,
    );
    change('advanced-blur', true);
    await wait();
    check(
      'advanced blur help is localized',
      byId('media-help').getAttribute('aria-describedby') === 'advanced-blur-help' &&
        byId('advanced-blur-help').textContent === window.expectedMessages.advancedBlurHelp,
    );
    byId('media-help').focus();
    check(
      'advanced help tooltip is available on keyboard focus',
      getComputedStyle(byId('advanced-blur-help')).display !== 'none',
    );
    byId('media-help').click();
    check(
      'media help opens settings and focuses individual choices',
      !byId('settings-panel').hidden && document.activeElement?.id === 'blur-images',
    );
    byId('settings-toggle').click();
    byId('settings-toggle').click();
    check('visible area has an explicit twenty percent minimum', byId('visible-area').min === '20');
    change('full-blur', true);
    await wait();
    check(
      'full blur is explicit and retains the readable percentage',
      stored.settings.fullBlur &&
        byId('visible-area').disabled &&
        stored.settings.visibleArea === 40,
    );
    change('full-blur', false);
    await wait();
    check(
      'leaving full blur restores the percentage control',
      !stored.settings.fullBlur && !byId('visible-area').disabled,
    );
    check(
      'settings button opens the panel accessibly',
      !byId('settings-panel').hidden &&
        byId('settings-toggle').getAttribute('aria-expanded') === 'true',
    );
    change('language', 'pt_BR');
    await wait();
    check(
      'Portuguese override updates static text and document language',
      document.documentElement.lang === 'pt-BR' &&
        byId('alias-form').querySelector('button')?.textContent === 'Salvar apelido',
    );
    change('language', 'en');
    await wait();
    check(
      'English override persists and updates dynamic controls',
      stored.settings.language === 'en' &&
        document.documentElement.lang === 'en' &&
        byId('alias-list').querySelector('.remove')?.textContent === 'Remove',
    );
    change('language', 'auto');
    await wait();
    check(
      'automatic language restores browser preference',
      document.documentElement.lang === window.expectedLanguage &&
        byId('alias-form').querySelector('button')?.textContent === window.expectedSaveLabel,
    );
    check(
      'placeholder and list accessibility translated',
      byId('original-name').placeholder === window.expectedMessages.originalPlaceholder &&
        byId('alias-list').getAttribute('aria-label') === window.expectedMessages.savedAliases,
    );

    change('visible-area', '60');
    await wait();
    change('blur-strength', '14');
    await wait();
    check(
      'settings sliders persist',
      stored.settings.visibleArea === 60 &&
        stored.settings.blurStrength === 14 &&
        byId('strength-label').value === '14 px',
    );
    change('blur-images', false);
    await wait();
    check(
      'individual media choices persist and update the advanced shortcut',
      !stored.settings.blurImages &&
        stored.settings.blurVideos &&
        stored.settings.blurStickers &&
        !byId('advanced-blur').checked,
    );
    change('extension-enabled', false);
    await wait();
    check(
      'master off retains preferences and saved aliases',
      !stored.settings.enabled &&
        stored.settings.blurChat &&
        stored.settings.visibleArea === 60 &&
        stored.aliases.length === 1,
    );
    check(
      'master off disables feature controls',
      byId<HTMLFieldSetElement>('feature-controls').disabled &&
        byId<HTMLFieldSetElement>('alias-controls').disabled,
    );
    change('extension-enabled', true);
    await wait();
    change('aliases-enabled', false);
    await wait();
    check(
      'alias feature disabled without deleting entries',
      !stored.settings.aliasesEnabled &&
        stored.aliases.length === 1 &&
        byId<HTMLFieldSetElement>('alias-controls').disabled,
    );
    change('aliases-enabled', true);
    await wait();

    byId('fetch-chats').click();
    await wait();
    const suggestions = byId('chat-suggestions').querySelectorAll('button');
    check('fetch shows only ten names', suggestions.length === 10);
    suggestions[1]?.click();
    check(
      'choosing a suggestion fills the original name',
      byId('original-name').value === 'Grupo Novo',
    );
    submit('Grupo Novo', '<script>alert(1)</script>');
    await wait();
    check(
      'alias is saved as safe text',
      stored.aliases.length === 2 &&
        !byId('alias-list').querySelector('script') &&
        byId('alias-list').textContent.includes('<script>alert(1)</script>'),
    );
    check(
      'known name is not marked missing',
      !byId('alias-list').lastElementChild?.classList.contains('alias-invalid'),
    );
    const remove = byId('alias-list').lastElementChild?.querySelector('.remove');
    check(
      'dynamic accessible label translated and interpolated',
      remove?.getAttribute('aria-label') ===
        window.expectedMessages.removeAliasLabel.replace('$ALIAS$', '<script>alert(1)</script>'),
    );

    submit('Missing name', 'Apelido');
    await wait();
    const missing = byId('alias-list').lastElementChild;
    const warning = missing?.querySelector<HTMLElement>('.alias-warning');
    check(
      'missing name shows warning color class and tooltip',
      missing?.classList.contains('alias-invalid') &&
        warning?.title === window.expectedMessages.aliasNotFound &&
        warning.tabIndex === 0,
    );
    window.availableChats.push('Missing name');
    byId('fetch-chats').click();
    await wait();
    check(
      'refresh clears warning when original name is loaded',
      !byId('alias-list').lastElementChild?.classList.contains('alias-invalid'),
    );
    byId('alias-list').lastElementChild?.querySelector<HTMLButtonElement>('.edit')?.click();
    submit('Contato 1', 'Outro nome');
    await wait();
    check(
      'editing the original replaces the previous mapping',
      !stored.aliases.some((entry) => entry.original === 'Missing name') &&
        stored.aliases.some((entry) => entry.original === 'Contato 1'),
    );
    byId('alias-list').lastElementChild?.querySelector<HTMLButtonElement>('.remove')?.click();
    await wait();
    check('remove persists', stored.aliases.length === 2);

    window.rejectChats = true;
    byId('fetch-chats').click();
    await wait();
    check(
      'unavailable WhatsApp is not treated as invalid aliases',
      !byId('alias-list').querySelector('.alias-invalid') &&
        byId('chat-status').textContent === window.expectedMessages.chatsUnavailable,
    );
    window.rejectChats = false;
    const aliasCount = stored.aliases.length;
    const beforeReset = JSON.stringify(stored.settings);
    byId('restore-defaults').click();
    await wait();
    check(
      'restore requires confirmation before writing settings',
      byId<HTMLDialogElement>('reset-dialog').open &&
        JSON.stringify(stored.settings) === beforeReset,
    );
    byId('reset-cancel').click();
    await wait();
    check(
      'cancel leaves settings and aliases intact',
      JSON.stringify(stored.settings) === beforeReset &&
        stored.aliases.length === aliasCount &&
        !byId<HTMLDialogElement>('reset-dialog').open,
    );
    byId('restore-defaults').click();
    byId('reset-confirm').click();
    await wait();
    check(
      'restore defaults resets settings and preserves aliases',
      stored.settings.enabled &&
        stored.settings.aliasesEnabled &&
        !stored.settings.blurChat &&
        !stored.settings.blurPreviews &&
        stored.settings.language === 'auto' &&
        stored.settings.visibleArea === 40 &&
        stored.settings.blurStrength === 8 &&
        !stored.settings.blurImages &&
        !stored.settings.blurVideos &&
        !stored.settings.blurStickers &&
        !stored.settings.fullBlur &&
        stored.aliases.length === aliasCount,
    );
    window.failNextSave = true;
    change('blur-chat', true);
    await wait();
    check(
      'failed write restores previous state with a localized error',
      !stored.settings.blurChat &&
        !byId('blur-chat').checked &&
        byId('status').textContent === window.expectedMessages.statusSaveFailed &&
        byId('status').dataset.error === 'true',
    );
    await chrome.storage.local.set({
      settings: {
        enabled: true,
        aliasesEnabled: true,
        language: 'auto',
        blurChat: true,
        blurPreviews: true,
        visibleArea: 70,
        blurStrength: 10,
      },
    });
    check(
      'external settings updates refresh controls',
      byId('visible-area').value === '70' && byId('blur-previews').checked,
    );
    byId('settings-toggle').click();
    check('settings panel closes', byId('settings-panel').hidden);
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
