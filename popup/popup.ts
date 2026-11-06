import * as model from '../src/settings';

(() => {
  const byId = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing popup element: ${id}`);
    return element as T;
  };
  let config = model.settings();
  let entries: model.Alias[] = [];
  let queue = Promise.resolve();

  function status(message: string, error = false) {
    byId('status').textContent = message;
    byId('status').dataset.error = String(error);
  }

  function labels() {
    byId<HTMLOutputElement>('visible-label').value = String(config.visibleCount);
    byId<HTMLOutputElement>('strength-label').value = `${config.blurStrength} px`;
    byId<HTMLInputElement>('visible-count').disabled = !config.blurChat;
  }

  function draw() {
    byId<HTMLInputElement>('blur-previews').checked = config.blurPreviews;
    byId<HTMLInputElement>('blur-chat').checked = config.blurChat;
    byId<HTMLInputElement>('visible-count').value = String(config.visibleCount);
    byId<HTMLInputElement>('blur-strength').value = String(config.blurStrength);
    labels();
    byId('alias-count').textContent = String(entries.length);
    byId('empty-state').hidden = entries.length > 0;
    byId('alias-list').replaceChildren(
      ...entries.map((entry) => {
        const item = document.createElement('li');
        const text = document.createElement('div');
        const alias = document.createElement('strong');
        alias.textContent = entry.alias;
        const original = document.createElement('small');
        original.textContent = entry.original;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'remove';
        remove.textContent = 'Remove';
        remove.setAttribute('aria-label', `Remove alias ${entry.alias}`);
        remove.addEventListener('click', () =>
          save({ aliases: entries.filter((e) => e.original !== entry.original) }),
        );
        text.append(alias, original);
        item.append(text, remove);
        return item;
      }),
    );
  }

  function save(data: { settings?: model.Settings; aliases?: model.Alias[] }) {
    byId<HTMLFieldSetElement>('controls').disabled = true;
    status('Saving…');
    queue = queue.then(async () => {
      try {
        await chrome.storage.local.set(data);
        if (data.settings) config = model.settings(data.settings);
        if (data.aliases) entries = model.aliases(data.aliases);
        status('Saved in this browser.');
      } catch {
        status('Could not save. Please try again.', true);
      } finally {
        draw();
        byId<HTMLFieldSetElement>('controls').disabled = false;
      }
    });
    return queue;
  }

  for (const id of ['blur-previews', 'blur-chat', 'visible-count', 'blur-strength']) {
    byId(id).addEventListener('change', () =>
      save({
        settings: model.settings({
          blurPreviews: byId<HTMLInputElement>('blur-previews').checked,
          blurChat: byId<HTMLInputElement>('blur-chat').checked,
          visibleCount: Number(byId<HTMLInputElement>('visible-count').value),
          blurStrength: Number(byId<HTMLInputElement>('blur-strength').value),
        }),
      }),
    );
  }
  byId<HTMLInputElement>('visible-count').addEventListener('input', (event) => {
    byId<HTMLOutputElement>('visible-label').value = (
      event.currentTarget as HTMLInputElement
    ).value;
  });
  byId<HTMLInputElement>('blur-strength').addEventListener('input', (event) => {
    byId<HTMLOutputElement>('strength-label').value =
      `${(event.currentTarget as HTMLInputElement).value} px`;
  });

  byId('alias-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const original = model.normalizeName(byId<HTMLInputElement>('original-name').value);
    const alias = model.normalizeName(byId<HTMLInputElement>('alias-name').value);
    if (!original || !alias) {
      status('Enter the group name and alias.', true);
      return;
    }
    await save({
      aliases: [...entries.filter((entry) => entry.original !== original), { original, alias }],
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) config = model.settings(changes.settings.newValue);
    if (changes.aliases) entries = model.aliases(changes.aliases.newValue);
    draw();
  });

  chrome.storage.local
    .get(['settings', 'aliases'])
    .then((data) => {
      config = model.settings(data.settings);
      entries = model.aliases(data.aliases);
      draw();
      byId<HTMLFieldSetElement>('controls').disabled = false;
      status('Ready to use on WhatsApp Web.');
    })
    .catch(() => status('Could not load settings. Reopen the extension.', true));
})();
