import { type ChatContext, parseChatContext, unavailableContext } from '../src/chats';
import { type MessageKey, message, setLanguage, translateDocument } from '../src/i18n';
import * as model from '../src/settings';

(() => {
  const byId = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing popup element: ${id}`);
    return element as T;
  };
  let config = model.settings();
  let entries: model.Alias[] = [];
  let context: ChatContext = unavailableContext();
  let loading = true;
  let saving = false;
  let fetching = false;
  let settingsOpen = false;
  let suggestionsOpen = false;
  let editingOriginal: string | null = null;
  let contextGeneration = 0;
  let statusKey: MessageKey | null = 'statusLoading';
  let statusError = false;
  let chatStatusKey: MessageKey | null = null;

  function edit(entry: model.Alias) {
    editingOriginal = entry.original;
    byId<HTMLInputElement>('original-name').value = entry.original;
    byId<HTMLInputElement>('alias-name').value = entry.alias;
    byId('alias-name').focus();
  }

  function drawAliases() {
    const found = new Set(context.found);
    byId('alias-count').textContent = String(entries.length);
    byId('empty-state').hidden = entries.length > 0;
    byId('alias-list').replaceChildren(
      ...entries.map((entry) => {
        const item = document.createElement('li');
        const invalid = context.available && !found.has(entry.original);
        item.classList.toggle('alias-invalid', invalid);
        const text = document.createElement('div');
        text.className = 'alias-text';
        const alias = document.createElement('strong');
        alias.textContent = entry.alias;
        const original = document.createElement('small');
        original.className = 'alias-original';
        original.textContent = entry.original;
        text.append(alias, original);
        item.append(text);
        if (invalid) {
          const warning = document.createElement('span');
          warning.className = 'alias-warning';
          warning.textContent = '⚠';
          warning.title = message('aliasNotFound');
          warning.setAttribute('aria-label', message('aliasNotFound'));
          warning.setAttribute('role', 'img');
          warning.tabIndex = 0;
          item.append(warning);
        }
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'edit';
        editButton.textContent = message('editAlias');
        editButton.setAttribute('aria-label', message('editAliasLabel', entry.alias));
        editButton.addEventListener('click', () => edit(entry));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove';
        remove.textContent = message('removeAlias');
        remove.setAttribute('aria-label', message('removeAliasLabel', entry.alias));
        remove.addEventListener('click', async () => {
          if (
            await save({ aliases: entries.filter((value) => value.original !== entry.original) })
          ) {
            if (editingOriginal === entry.original) editingOriginal = null;
            await refreshContext();
          }
        });
        item.append(editButton, remove);
        return item;
      }),
    );
  }

  function draw() {
    setLanguage(config.language);
    translateDocument(document);
    byId<HTMLFieldSetElement>('controls').disabled = loading || saving;
    byId<HTMLButtonElement>('settings-toggle').disabled = loading || saving;
    byId('settings-toggle').setAttribute('aria-expanded', String(settingsOpen));
    byId('settings-panel').hidden = !settingsOpen;
    byId<HTMLInputElement>('extension-enabled').checked = config.enabled;
    byId<HTMLInputElement>('aliases-enabled').checked = config.aliasesEnabled;
    byId<HTMLInputElement>('blur-previews').checked = config.blurPreviews;
    byId<HTMLInputElement>('blur-chat').checked = config.blurChat;
    byId<HTMLInputElement>('visible-count').value = String(config.visibleCount);
    byId<HTMLInputElement>('blur-strength').value = String(config.blurStrength);
    byId<HTMLSelectElement>('language').value = config.language;
    byId<HTMLOutputElement>('visible-label').value = String(config.visibleCount);
    byId<HTMLOutputElement>('strength-label').value = `${config.blurStrength} px`;
    byId<HTMLFieldSetElement>('feature-controls').disabled = !config.enabled;
    byId<HTMLFieldSetElement>('alias-controls').disabled =
      !config.enabled || !config.aliasesEnabled;
    byId<HTMLButtonElement>('fetch-chats').disabled = fetching;
    byId('status').textContent = statusKey ? message(statusKey) : '';
    byId('status').dataset.error = String(statusError);
    byId('chat-status').textContent = chatStatusKey ? message(chatStatusKey) : '';
    byId('chat-suggestions').hidden = !suggestionsOpen || !config.enabled || !config.aliasesEnabled;
    byId('chat-suggestions').replaceChildren(
      ...context.chats.map((name) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = name;
        button.addEventListener('click', () =>
          edit(entries.find((entry) => entry.original === name) ?? { original: name, alias: '' }),
        );
        item.append(button);
        return item;
      }),
    );
    drawAliases();
  }

  async function save(data: {
    settings?: model.Settings;
    aliases?: model.Alias[];
  }): Promise<boolean> {
    if (loading || saving) return false;
    saving = true;
    statusKey = 'statusSaving';
    statusError = false;
    draw();
    try {
      await chrome.storage.local.set(data);
      if (data.settings) config = model.settings(data.settings);
      if (data.aliases) entries = model.aliases(data.aliases);
      statusKey = 'statusSaved';
      return true;
    } catch {
      statusKey = 'statusSaveFailed';
      statusError = true;
      return false;
    } finally {
      saving = false;
      draw();
    }
  }

  async function refreshContext(showSuggestions = false) {
    const generation = ++contextGeneration;
    if (!config.enabled || !config.aliasesEnabled) {
      context = unavailableContext();
      fetching = false;
      chatStatusKey = null;
      draw();
      return;
    }
    if (showSuggestions) suggestionsOpen = true;
    fetching = true;
    chatStatusKey = showSuggestions ? 'chatsLoading' : null;
    draw();
    let next = unavailableContext();
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id !== undefined) {
        next = parseChatContext(
          await chrome.tabs.sendMessage(tab.id, {
            type: 'wpp-mask:chat-context',
            names: entries.map((entry) => entry.original),
          }),
        );
      }
    } catch {
      /* A missing receiver is unavailable, not evidence of a nonexistent contact. */
    }
    if (generation !== contextGeneration) return;
    context = next;
    fetching = false;
    chatStatusKey = next.available ? null : 'chatsUnavailable';
    draw();
  }

  const settingFields = {
    'extension-enabled': 'enabled',
    'aliases-enabled': 'aliasesEnabled',
    'blur-previews': 'blurPreviews',
    'blur-chat': 'blurChat',
  } as const;
  for (const [id, key] of Object.entries(settingFields)) {
    byId(id).addEventListener('change', async () => {
      const next = model.settings({ ...config, [key]: byId<HTMLInputElement>(id).checked });
      if (await save({ settings: next })) await refreshContext();
    });
  }
  for (const [id, key] of [
    ['visible-count', 'visibleCount'],
    ['blur-strength', 'blurStrength'],
  ] as const) {
    byId(id).addEventListener('change', () => {
      void save({
        settings: model.settings({ ...config, [key]: Number(byId<HTMLInputElement>(id).value) }),
      });
    });
  }
  byId('visible-count').addEventListener('input', () => {
    byId<HTMLOutputElement>('visible-label').value = byId<HTMLInputElement>('visible-count').value;
  });
  byId('blur-strength').addEventListener('input', () => {
    byId<HTMLOutputElement>('strength-label').value =
      `${byId<HTMLInputElement>('blur-strength').value} px`;
  });
  byId('language').addEventListener('change', () => {
    void save({
      settings: model.settings({ ...config, language: byId<HTMLSelectElement>('language').value }),
    });
  });
  byId('settings-toggle').addEventListener('click', () => {
    settingsOpen = !settingsOpen;
    draw();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && settingsOpen) {
      settingsOpen = false;
      draw();
      byId('settings-toggle').focus();
    }
  });
  byId('restore-defaults').addEventListener('click', async () => {
    if (await save({ settings: { ...model.defaults } })) await refreshContext();
  });
  byId('fetch-chats').addEventListener('click', () => {
    void refreshContext(true);
  });
  byId('alias-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const original = model.normalizeName(byId<HTMLInputElement>('original-name').value);
    const alias = model.normalizeName(byId<HTMLInputElement>('alias-name').value);
    if (!original || !alias) {
      statusKey = 'statusMissingAlias';
      statusError = true;
      draw();
      return;
    }
    const updated = [
      ...entries.filter(
        (entry) => entry.original !== original && entry.original !== editingOriginal,
      ),
      { original, alias },
    ];
    if (await save({ aliases: updated })) {
      editingOriginal = null;
      await refreshContext();
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) config = model.settings(changes.settings.newValue);
    if (changes.aliases) entries = model.aliases(changes.aliases.newValue);
    draw();
    if (!saving && !loading && (changes.settings || changes.aliases)) void refreshContext();
  });
  draw();
  chrome.storage.local
    .get(['settings', 'aliases'])
    .then((data) => {
      config = model.settings(data.settings);
      entries = model.aliases(data.aliases);
      loading = false;
      statusKey = null;
      draw();
      void refreshContext();
    })
    .catch(() => {
      statusKey = 'statusLoadFailed';
      statusError = true;
      draw();
    });
})();
