export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: unknown) => results.push({ name, pass: !!pass });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const blurred = (node: Element | null) => !!node && getComputedStyle(node).filter !== 'none';
  const pixel =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect width="50" height="50" fill="red"/%3E%3C/svg%3E';
  const selected = {
    blurChat: true,
    blurImages: true,
    blurVideos: true,
    blurStickers: true,
    alwaysBlurMedia: true,
    visibleArea: 40,
  };
  try {
    await wait();
    const history = document.getElementById('history') as HTMLElement;
    history.innerHTML = `<div class="message-in"><div id="album"><div id="first-video" style="width:50px;height:50px;background-image:url('${pixel}')"><span data-icon="video-play"></span></div><img id="second-photo" data-testid="image-thumb" src="${pixel}"></div></div>`;
    const audio = document.createElement('div');
    audio.className = 'message-in';
    audio.innerHTML =
      '<div data-testid="audio-player"><button><span data-icon="audio-play"></span></button><canvas width="120" height="30"></canvas></div>';
    history.append(audio);
    const info = document.createElement('aside');
    info.dataset.testid = 'drawer-right';
    info.innerHTML = `<span dir="auto">Família Silva</span><div data-testid="media-carousel"><img id="carousel-photo" data-testid="image-thumb" src="${pixel}"><div id="carousel-video" data-testid="video-thumb" style="width:50px;height:50px;background-image:url('${pixel}')"></div></div>`;
    document.body.append(info);
    const gallery = document.createElement('section');
    gallery.dataset.testid = 'media-gallery';
    gallery.innerHTML = `<div role="grid"><img id="gallery-photo" src="${pixel}" data-testid="image-thumb"></div>`;
    document.body.append(gallery);
    const viewer = document.createElement('div');
    viewer.setAttribute('role', 'dialog');
    viewer.dataset.testid = 'media-viewer';
    viewer.innerHTML = `<img id="opened-photo" data-testid="image-thumb" src="${pixel}"><video id="opened-video" poster="${pixel}"></video>`;
    document.body.append(viewer);
    const sidebarAvatar = document.createElement('img');
    sidebarAvatar.src = pixel;
    document.getElementById('pane-side')?.append(sidebarAvatar);
    await chrome.storage.local.set({ settings: selected });
    check(
      'first album tile with a background video thumbnail is blurred',
      blurred(document.getElementById('first-video')),
    );
    check('second album photo is blurred', blurred(document.getElementById('second-photo')));
    check(
      'info card uses the saved alias',
      info.querySelector('[dir="auto"]')?.getAttribute('data-wppd-alias') === 'Meu pessoal',
    );
    check(
      'info card preserves the original React-owned name',
      info.querySelector('[dir="auto"]')?.textContent === 'Família Silva',
    );
    for (const id of [
      'carousel-photo',
      'carousel-video',
      'gallery-photo',
      'opened-photo',
      'opened-video',
    ])
      check(
        `${id} is protected outside the conversation viewport`,
        blurred(document.getElementById(id)),
      );
    check(
      'audio waveform is not classified as protected media',
      !blurred(audio.querySelector('canvas')) && !audio.querySelector('[data-wppd-media]'),
    );
    check('sidebar avatars are outside media protection', !blurred(sidebarAvatar));
    await chrome.storage.local.set({ settings: { ...selected, alwaysBlurMedia: false } });
    check(
      'legacy always-blur false cannot disable selected panel media',
      blurred(document.getElementById('carousel-photo')) &&
        blurred(document.getElementById('opened-video')),
    );
    await chrome.storage.local.set({ settings: { ...selected, blurImages: false } });
    check(
      'photo exemptions apply to carousels and opened media independently of videos',
      !blurred(document.getElementById('carousel-photo')) &&
        !blurred(document.getElementById('opened-photo')) &&
        blurred(document.getElementById('opened-video')),
    );
    const lazy = document.createElement('img');
    lazy.src = pixel;
    lazy.dataset.testid = 'image-thumb';
    gallery.append(lazy);
    await chrome.storage.local.set({ settings: selected });
    await wait();
    check('new gallery media receives protection', blurred(lazy));
    await chrome.storage.local.set({ settings: { ...selected, aliasesEnabled: false } });
    check(
      'aliases switch also restores info card names',
      !info.querySelector('[data-wppd-alias]') && blurred(lazy),
    );
    await chrome.storage.local.set({ settings: { ...selected, enabled: false } });
    check(
      'master off restores every media surface',
      !blurred(lazy) &&
        !blurred(document.getElementById('first-video')) &&
        !blurred(document.getElementById('opened-video')),
    );
    await chrome.storage.local.set({ settings: { ...selected, blurChat: false } });
    check(
      'media-only protection covers panels and viewers',
      blurred(document.getElementById('carousel-photo')) &&
        blurred(document.getElementById('opened-photo')) &&
        blurred(document.getElementById('opened-video')) &&
        !document.querySelector('[data-wppd-screen]'),
    );
    const latePreview = document.createElement('img');
    latePreview.dataset.testid = 'image-thumb';
    latePreview.src = pixel;
    viewer.append(latePreview);
    await wait();
    check('new viewer thumbnails stay hidden in media-only mode', blurred(latePreview));
    check('media-only mode still exempts audio', !blurred(audio.querySelector('canvas')));
    info.remove();
    gallery.remove();
    viewer.remove();
    await wait();
    check(
      'closing panels clears their alias decorations',
      !info.querySelector('[data-wppd-alias]'),
    );
  } catch (error) {
    check(error instanceof Error ? (error.stack ?? error.message) : String(error), false);
  }
  const report = document.createElement('pre');
  report.id = 'test-results';
  report.textContent = JSON.stringify(results);
  document.body.append(report);
})();
