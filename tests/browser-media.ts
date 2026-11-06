export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: unknown) => results.push({ name, pass: !!pass });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const history = document.getElementById('history') as HTMLElement;
  const pixel =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Cpath fill="red" d="M0 0h40v40H0z"/%3E%3C/svg%3E';
  const blurred = (element: Element | null) => {
    for (let node = element; node && node.id !== 'main'; node = node.parentElement) {
      if (getComputedStyle(node).filter !== 'none') return true;
    }
    return false;
  };
  const settings = {
    enabled: true,
    aliasesEnabled: true,
    language: 'auto',
    blurChat: true,
    blurPreviews: true,
    visibleCount: 3,
    blurStrength: 8,
    blurImages: true,
    blurVideos: true,
    blurStickers: true,
    alwaysBlurMedia: true,
  };
  try {
    await wait();
    const group = document.createElement('div');
    group.dataset.testid = 'msg-container';
    for (let index = 0; index < 10; index++) {
      const row = document.createElement('div');
      row.dataset.id = `false_test_${index}`;
      row.className = index % 2 ? 'message-in' : 'message-out';
      row.innerHTML = `<span class="selectable-text">Message ${index}</span>`;
      group.append(row);
    }
    const album = document.createElement('div');
    album.className = 'message-in';
    album.dataset.id = 'false_test_album';
    album.innerHTML = `<div data-testid="album" role="grid"><img id="photo" data-testid="image-thumb" src='${pixel}'><div data-testid="video-message"><img id="video-preview" src='${pixel}'><span data-icon="video-play"></span><video id="video" poster='${pixel}'></video></div><div data-testid="sticker"><img id="sticker" src='${pixel}'></div><div id="background-photo" data-testid="album-image" style="width:40px;height:40px;background-image:url('${pixel}')"></div></div><span class="selectable-text">Caption</span>`;
    group.append(album);
    history.replaceChildren(group);
    history.scrollTop = history.scrollHeight;
    await chrome.storage.local.set({ settings });
    check(
      'grouped container never reveals every message at the bottom',
      blurred(group.firstElementChild) &&
        document.querySelectorAll('[data-wppm-reveal]').length === 3,
    );
    for (const id of ['photo', 'video-preview', 'video', 'sticker', 'background-photo'])
      check(
        `recent album ${id} stays protected in always mode`,
        blurred(document.getElementById(id)),
      );

    for (let iteration = 0; iteration < 5; iteration++) {
      album.querySelector('img')?.setAttribute('src', `${pixel}#${iteration}`);
      album.style.height = `${180 + iteration * 20}px`;
      history.scrollTop = history.scrollHeight;
      history.dispatchEvent(new Event('scroll'));
      await wait();
      check(
        `media remains masked through load and bottom-scroll round ${iteration}`,
        blurred(document.getElementById('photo')) && blurred(group.firstElementChild),
      );
    }

    await chrome.storage.local.set({ settings: { ...settings, alwaysBlurMedia: false } });
    history.scrollTop = history.scrollHeight;
    await wait();
    check(
      'recent media follows the visible-message rule when always mode is off',
      !blurred(document.getElementById('photo')) &&
        !blurred(document.getElementById('video')) &&
        !blurred(document.getElementById('sticker')),
    );
    await chrome.storage.local.set({
      settings: { ...settings, alwaysBlurMedia: false, visibleCount: 0 },
    });
    check(
      'zero recent messages protects the full album',
      blurred(document.getElementById('photo')) &&
        blurred(document.getElementById('video')) &&
        blurred(document.getElementById('sticker')),
    );
    await chrome.storage.local.set({
      settings: { ...settings, visibleCount: 0, blurImages: false },
    });
    check(
      'photo exemption does not exempt video previews or stickers',
      !blurred(document.getElementById('photo')) &&
        !blurred(document.getElementById('background-photo')) &&
        blurred(document.getElementById('video-preview')) &&
        blurred(document.getElementById('sticker')),
    );
    check(
      'album caption remains protected when photos are exempt',
      blurred(album.querySelector('.selectable-text')),
    );
    const unknown = document.createElement('img');
    unknown.src = pixel;
    album.querySelector('[data-testid="album"]')?.append(unknown);
    await wait();
    check(
      'unidentified media stays protected rather than inheriting an exemption',
      blurred(unknown),
    );
    await chrome.storage.local.set({
      settings: { ...settings, visibleCount: 0, blurVideos: false },
    });
    check(
      'video exemption includes the video thumbnail',
      !blurred(document.getElementById('video')) &&
        !blurred(document.getElementById('video-preview')) &&
        blurred(document.getElementById('photo')),
    );
    await chrome.storage.local.set({
      settings: { ...settings, visibleCount: 0, blurStickers: false },
    });
    check(
      'stickers can be exempted independently',
      !blurred(document.getElementById('sticker')) && blurred(document.getElementById('photo')),
    );
    await chrome.storage.local.set({ settings });
    const inserted = document.createElement('img');
    inserted.src = pixel;
    album.querySelector('[data-testid="album"]')?.append(inserted);
    check('new album tiles are masked before the next render', blurred(inserted));
    await wait();
    check('new album tiles stay masked after classification', blurred(inserted));
    history.scrollTop = 0;
    history.dispatchEvent(new Event('scroll'));
    await wait();
    check(
      'scrolling into history masks text and selected media',
      blurred(group.lastElementChild?.querySelector('.selectable-text') ?? null) &&
        blurred(inserted),
    );
    await chrome.storage.local.set({ settings: { ...settings, enabled: false } });
    check(
      'master off restores media and text',
      !blurred(inserted) && !blurred(group.firstElementChild),
    );
    await chrome.storage.local.set({ settings: { ...settings, blurChat: false } });
    check(
      'chat protection off restores all media types',
      !blurred(document.getElementById('photo')) &&
        !blurred(document.getElementById('video')) &&
        !blurred(document.getElementById('sticker')),
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
