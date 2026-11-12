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
    if (byId('alias-editor').hidden) byId('add-alias').click();
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
        window.expectedMessages.developerCredit &&
        !!window.expectedMessages.developerCredit &&
        document.querySelector('footer .author-credit strong')?.textContent === 'Rodrigo Lima',
    );
    check('settings hidden initially', byId('settings-panel').hidden);
    const contrast = (foreground: string, background: string) => {
      const luminance = (color: string) => {
        const channels = (color.match(/[\d.]+/g) ?? [])
          .slice(0, 3)
          .map(Number)
          .map((value) => value / 255)
          .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
      };
      const a = luminance(foreground),
        b = luminance(background);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const checkThemeContrast = (name: string) => {
      const rootStyle = getComputedStyle(document.documentElement);
      const fieldStyle = getComputedStyle(byId('original-name'));
      check(
        `${name} has readable text and visible field borders`,
        contrast(rootStyle.color, rootStyle.backgroundColor) >= 4.5 &&
          contrast(fieldStyle.color, fieldStyle.backgroundColor) >= 4.5 &&
          contrast(fieldStyle.borderTopColor, fieldStyle.backgroundColor) >= 3,
      );
    };

    check(
      'theme follows the system by default',
      byId('theme').value === 'auto' &&
        document.documentElement.dataset.theme ===
          (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    );
    const wasDark = document.documentElement.dataset.theme === 'dark';
    byId('theme-toggle').focus();
    byId('theme-toggle').click();
    await wait();
    const override = wasDark ? 'light' : 'dark';
    check(
      'header theme control saves an override with an accessible next action',
      stored.settings.theme === override &&
        document.documentElement.dataset.theme === override &&
        byId('theme-toggle').getAttribute('aria-label') ===
          window.expectedMessages[wasDark ? 'switchToDark' : 'switchToLight'],
    );
    window.setSystemTheme(wasDark);
    check(
      'explicit theme ignores system changes',
      document.documentElement.dataset.theme === override,
    );
    byId('settings-toggle').click();
    change('theme', 'auto');
    await wait();
    window.setSystemTheme(true);
    check(
      'automatic theme responds to system dark mode',
      stored.settings.theme === 'auto' &&
        document.documentElement.dataset.theme === 'dark' &&
        getComputedStyle(document.documentElement).colorScheme === 'dark',
    );
    checkThemeContrast('dark theme');
    window.setSystemTheme(false);
    check(
      'automatic theme responds to system light mode',
      document.documentElement.dataset.theme === 'light' &&
        getComputedStyle(document.documentElement).colorScheme === 'light',
    );
    checkThemeContrast('light theme');
    byId('settings-back').click();

    check(
      'alias editor starts collapsed with saved aliases first',
      byId('alias-editor').hidden &&
        !!(
          byId('alias-list').compareDocumentPosition(byId('alias-editor')) &
          Node.DOCUMENT_POSITION_FOLLOWING
        ),
    );
    byId('add-alias').click();
    check(
      'adding an alias opens a focused editor',
      !byId('alias-editor').hidden && document.activeElement?.id === 'original-name',
    );
    byId('original-name').value = 'Unsaved name';
    byId('alias-name').value = 'Draft';
    byId('settings-toggle').click();
    byId('settings-back').click();
    check(
      'settings navigation retains an unsaved alias draft',
      !byId('alias-editor').hidden &&
        byId('original-name').value === 'Unsaved name' &&
        byId('alias-name').value === 'Draft',
    );
    window.failNextSave = true;
    byId('alias-form').dispatchEvent(new Event('submit', { cancelable: true }));
    await wait();
    check(
      'failed alias save retains the editable draft',
      !byId('alias-editor').hidden &&
        byId('alias-name').value === 'Draft' &&
        stored.aliases.length === 1,
    );

    byId('cancel-alias').click();
    check(
      'canceling clears the draft without changing saved aliases',
      byId('alias-editor').hidden &&
        !byId('original-name').value &&
        stored.aliases.length === 1 &&
        document.activeElement?.id === 'add-alias',
    );
    window.scrollTo(0, 100);
    const homeScroll = window.scrollY;
    byId('settings-toggle').click();
    check(
      'settings is a separate view with a visible back action',
      byId('feature-controls').hidden &&
        byId('master-control').hidden &&
        !byId('settings-back').hidden &&
        !byId('settings-panel').hidden,
    );
    check(
      'settings has four named groups',
      byId('settings-panel').querySelectorAll('.settings-group').length === 4,
    );
    byId('settings-back').click();
    check(
      'back restores main scroll and focus',
      byId('settings-panel').hidden &&
        !byId('feature-controls').hidden &&
        Math.abs(window.scrollY - homeScroll) <= 1 &&
        document.activeElement?.id === 'settings-toggle',
    );

    check(
      'lookup help is an icon inside the lookup button',
      byId('fetch-chats').contains(byId('chat-lookup-help')) &&
        !byId('chat-lookup-help').textContent.trim() &&
        !!byId('chat-lookup-help').querySelector('svg') &&
        !byId('chat-lookup-help').matches('button') &&
        byId('fetch-chats').dataset.info === 'chatLookupHelp',
    );
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
    change('blur-chat', false);
    await wait();
    check('unread counter protection starts disabled', !byId('blur-unread-counts').checked);
    change('blur-previews', false);
    await wait();
    change('blur-unread-counts', true);
    await wait();
    check(
      'unread counter setting persists independently',
      stored.settings.blurUnreadCounts && !stored.settings.blurPreviews,
    );
    change('blur-unread-counts', false);
    await wait();
    change('blur-previews', true);
    await wait();
    change('advanced-blur', true);
    await wait();
    check(
      'advanced blur selects all media without enabling chat protection',
      !stored.settings.blurChat &&
        byId('advanced-blur').checked &&
        stored.settings.blurImages &&
        stored.settings.blurVideos &&
        stored.settings.blurStickers,
    );
    change('advanced-blur', false);
    await wait();
    check(
      'advanced blur clears media without changing disabled chat protection',
      !stored.settings.blurChat &&
        !stored.settings.blurImages &&
        !stored.settings.blurVideos &&
        !stored.settings.blurStickers,
    );
    change('blur-chat', true);
    await wait();
    change('advanced-blur', true);
    await wait();
    check('advanced blur retains enabled chat protection', stored.settings.blurChat);
    check(
      'advanced blur help is localized',
      !byId('media-help').hasAttribute('title') &&
        byId('media-help').dataset.info === 'advancedBlurHelp',
    );
    byId('media-help').focus();
    check(
      'advanced help tooltip is available on keyboard focus',
      byId('info-popover').matches(':popover-open') &&
        byId('info-popover').textContent === window.expectedMessages.advancedBlurHelp,
    );
    byId('media-help').click();
    check(
      'media help opens settings and focuses individual choices',
      !byId('settings-panel').hidden && document.activeElement?.id === 'blur-images',
    );
    byId('settings-back').click();
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
        byId('strength-label').value.includes('14 px') &&
        byId('strength-label').value.includes(window.expectedMessages.strengthStrong),
    );
    change('blur-images', false);
    await wait();
    check(
      'individual media choices persist and update the advanced shortcut',
      !stored.settings.blurImages &&
        stored.settings.blurVideos &&
        stored.settings.blurStickers &&
        !byId('advanced-blur').checked &&
        byId('advanced-blur').indeterminate &&
        byId('advanced-blur').getAttribute('aria-checked') === 'mixed' &&
        byId('media-summary').textContent.includes(window.expectedMessages.mediaVideos),
    );
    byId('settings-back').click();
    byId('advanced-blur').click();
    await wait();
    check(
      'activating mixed media selects all without changing chat blur',
      byId('advanced-blur').checked &&
        !byId('advanced-blur').indeterminate &&
        stored.settings.blurImages &&
        stored.settings.blurVideos &&
        stored.settings.blurStickers &&
        stored.settings.blurChat,
    );
    byId('advanced-blur').click();
    await wait();
    check(
      'activating selected media clears all types',
      !byId('advanced-blur').checked &&
        !byId('advanced-blur').indeterminate &&
        !stored.settings.blurImages &&
        !stored.settings.blurVideos &&
        !stored.settings.blurStickers,
    );
    byId('settings-toggle').click();
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

    byId('settings-back').click();
    const originalSend = chrome.tabs.sendMessage;
    let finishLookup: (value: unknown) => void = () => {};
    const pendingLookup = new Promise<unknown>((resolve) => {
      finishLookup = resolve;
    });
    chrome.tabs.sendMessage = (() => pendingLookup) as typeof chrome.tabs.sendMessage;
    byId('fetch-chats').click();
    await Promise.resolve();
    await Promise.resolve();
    check(
      'lookup visibly reports loading while its request is pending',
      byId('fetch-chats').getAttribute('aria-busy') === 'true' &&
        byId('fetch-chats').textContent.includes(window.expectedMessages.chatsLoading) &&
        !byId('chat-loading').hidden,
    );
    finishLookup({
      available: true,
      chats: window.availableChats,
      found: stored.aliases.map((entry) => entry.original),
    });
    await wait();
    chrome.tabs.sendMessage = originalSend;
    check(
      'lookup clears its loading state when finished',
      byId('fetch-chats').getAttribute('aria-busy') === 'false' && byId('chat-loading').hidden,
    );
    const help = byId('fetch-chats');
    help.scrollIntoView({ block: 'center' });
    help.focus();
    await wait();
    check(
      'lookup scope uses the shared localized informational popover',
      byId('info-popover').matches(':popover-open') &&
        byId('info-popover').querySelector('strong')?.textContent ===
          window.expectedMessages.chatLookupHelpLabel &&
        byId('info-popover').querySelector('p')?.textContent ===
          window.expectedMessages.chatLookupHelp &&
        help.getAttribute('aria-describedby') === 'info-popover',
    );
    check(
      'help has a brief pop entrance',
      byId('info-popover')
        .getAnimations()
        .some(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.getTiming().duration === 200 &&
            animation.effect
              .getKeyframes()
              .some((frame) => String(frame.transform).includes('scale')),
        ),
    );
    const motion = getComputedStyle(byId('info-popover'));
    check(
      'help entrance uses a fast opacity transition',
      motion.transitionProperty.includes('opacity') &&
        motion.transitionDuration
          .split(',')
          .some((duration) => parseFloat(duration) > 0 && parseFloat(duration) <= 0.15),
    );
    check(
      'interactive colors have a short transition',
      getComputedStyle(byId('fetch-chats')).transitionProperty.includes('background-color'),
    );
    const box = byId('info-popover').getBoundingClientRect();
    check(
      'informational popover fits the popup viewport',
      box.left >= 8 && box.right <= innerWidth - 8 && box.top >= 8 && box.bottom <= innerHeight - 8,
    );
    help.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    check(
      'Escape closes help and retains trigger focus',
      !byId('info-popover').matches(':popover-open') && document.activeElement === help,
    );
    help.dispatchEvent(new MouseEvent('mouseenter'));
    check('hover reopens help', byId('info-popover').matches(':popover-open'));
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    check('outside click dismisses help', !byId('info-popover').matches(':popover-open'));
    help.blur();
    help.dispatchEvent(new MouseEvent('mouseenter'));
    check('pointer can reveal help', byId('info-popover').matches(':popover-open'));
    document.dispatchEvent(new Event('scroll'));
    check(
      'scroll dismisses stale informational popovers',
      !byId('info-popover').matches(':popover-open'),
    );
    check(
      'informational native title tooltips have been replaced',
      !document.querySelector('[title], [data-i18n-title]'),
    );
    const suggestions = byId('chat-suggestions').querySelectorAll('button');
    check('fetch shows all discovered names', suggestions.length === window.availableChats.length);
    const search = byId('chat-search');
    search.value = 'CONTATO 12';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    check(
      'search finds names beyond the original ten',
      byId('chat-suggestions').querySelectorAll('button').length === 1 &&
        byId('chat-suggestions').textContent.includes('Contato 12'),
    );
    byId('chat-suggestions').querySelector<HTMLButtonElement>('button')?.click();
    check(
      'filtered names open the alias editor',
      byId('original-name').value === 'Contato 12' &&
        !byId('alias-editor').hidden &&
        document.activeElement?.id === 'alias-name',
    );
    search.value = 'familia';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    check(
      'search ignores accents and case',
      byId('chat-suggestions').querySelectorAll('button').length === 1 &&
        byId('chat-suggestions').textContent.includes('Família Silva'),
    );
    search.value = 'not a conversation';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    check('empty search results are explained', !byId('chat-search-empty').hidden);
    search.value = '';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    byId('chat-suggestions').querySelectorAll('button')[1]?.click();
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
      'successful save closes and clears the editor',
      byId('alias-editor').hidden && !byId('original-name').value,
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
        warning?.dataset.info === 'aliasNotFound' &&
        !warning.hasAttribute('title') &&
        warning.tabIndex === 0,
    );
    warning?.focus();
    check(
      'dynamic alias warning uses the shared popover',
      byId('info-popover').matches(':popover-open') &&
        byId('info-popover').textContent === window.expectedMessages.aliasNotFound,
    );
    warning?.blur();
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
    const removeLast = () =>
      byId('alias-list').lastElementChild?.querySelector<HTMLButtonElement>('.remove')?.click();
    removeLast();
    check(
      'removal requires confirmation',
      byId<HTMLDialogElement>('delete-dialog').open && stored.aliases.length === 3,
    );
    byId('delete-dont-ask').checked = true;
    byId('delete-cancel').click();
    check(
      'cancel retains alias and confirmation preference',
      stored.aliases.length === 3 && stored.settings.confirmAliasRemoval !== false,
    );
    removeLast();
    check('new confirmation starts unchecked', !byId('delete-dont-ask').checked);
    byId('delete-confirm').click();
    await wait();
    check('confirmed removal persists', stored.aliases.length === 2);
    submit('Contato 2', 'Temporary alias');
    await wait();
    removeLast();
    byId('delete-dont-ask').checked = true;
    window.failNextSave = true;
    byId('delete-confirm').click();
    await wait();
    check(
      'failed removal keeps the alias, preference, and dialog',
      stored.aliases.length === 3 &&
        stored.settings.confirmAliasRemoval !== false &&
        byId<HTMLDialogElement>('delete-dialog').open,
    );
    byId('delete-confirm').click();
    await wait();
    check(
      'confirmed opt-out persists with the deletion',
      stored.aliases.length === 2 && stored.settings.confirmAliasRemoval === false,
    );
    removeLast();
    await wait();
    check(
      'future removals skip the dialog after opt-out',
      stored.aliases.length === 1 && !byId<HTMLDialogElement>('delete-dialog').open,
    );
    change('confirm-alias-removal', true);
    await wait();
    check(
      'confirmation can be reenabled in settings',
      stored.settings.confirmAliasRemoval === true,
    );

    window.rejectChats = true;
    byId('fetch-chats').click();
    await wait();
    check(
      'unavailable WhatsApp is not treated as invalid aliases',
      byId('chat-loading').hidden &&
        byId('fetch-chats').getAttribute('aria-busy') === 'false' &&
        !byId('alias-list').querySelector('.alias-invalid') &&
        byId('chat-status').textContent === window.expectedMessages.chatsUnavailable,
    );
    window.rejectChats = false;
    const aliasCount = stored.aliases.length;
    const beforeReset = JSON.stringify(stored.settings);
    byId('settings-toggle').click();
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
        stored.settings.confirmAliasRemoval &&
        !stored.settings.blurChat &&
        !stored.settings.blurPreviews &&
        !stored.settings.blurUnreadCounts &&
        stored.settings.language === 'auto' &&
        stored.settings.theme === 'auto' &&
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
    byId('settings-back').click();
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
