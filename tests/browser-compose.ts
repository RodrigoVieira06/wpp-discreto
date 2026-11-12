export {};

(async () => {
  const results: { name: string; pass: boolean }[] = [];
  const check = (name: string, pass: unknown) => results.push({ name, pass: !!pass });
  const wait = () => new Promise((resolve) => setTimeout(resolve, 80));
  const pixel =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="60" height="60"%3E%3Crect width="60" height="60" fill="red"/%3E%3C/svg%3E';
  const filtered = (element: Element) => {
    for (
      let node: Element | null = element;
      node && node !== document.body;
      node = node.parentElement
    )
      if (getComputedStyle(node).filter !== 'none') return true;
    return false;
  };
  const overlay = () => !!document.querySelector('[data-wppd-screen]');
  const preferences = {
    blurChat: true,
    fullBlur: true,
    blurImages: true,
    blurVideos: true,
    blurStickers: true,
  };
  try {
    await wait();
    const main = document.getElementById('main') as HTMLElement;
    const history = document.getElementById('history') as HTMLElement;
    history.innerHTML = `<div class="message-in"><span class="selectable-text">Received message</span><img data-testid="image-thumb" src='${pixel}'></div>`;
    const received = history.querySelector('img') as HTMLImageElement;
    await chrome.storage.local.set({ settings: preferences });
    check('conversation and received media start protected', overlay() && filtered(received));
    const editor = document.createElement('section');
    editor.dataset.testid = 'media-editor';
    editor.innerHTML = `<div><img data-testid="image-thumb" src='${pixel}'><video></video><canvas width="60" height="60"></canvas><div style="width:60px;height:60px;background-image:url('${pixel}')"></div></div><div contenteditable="true" role="textbox">Draft caption</div><footer><img src='${pixel}'><button><span data-icon="send"></span></button></footer>`;
    main.append(editor);
    await wait();
    check('outgoing editor suspends the viewport mask', !overlay());
    for (const asset of editor.querySelectorAll('img, video, canvas, [style*="background-image"]'))
      check('outgoing preview and thumbnails stay clear', !filtered(asset));
    check('received media remains protected while composing', filtered(received));
    const late = document.createElement('img');
    late.src = pixel;
    editor.append(late);
    check('new draft thumbnails are not briefly blurred', !filtered(late));
    await wait();
    check(
      'draft caption is readable',
      !filtered(editor.querySelector('[contenteditable]') as Element),
    );
    editor.hidden = true;
    await wait();
    check('hiding the editor restores chat protection', overlay() && filtered(received));
    editor.hidden = false;
    await wait();
    check('reopening the editor suspends protection again', !overlay() && !filtered(late));
    editor.setAttribute('aria-hidden', 'true');
    await wait();
    check('aria-hidden drafts do not suspend protection', overlay());
    editor.setAttribute('aria-hidden', 'false');
    await wait();
    editor.removeAttribute('data-testid');
    await wait();
    check(
      'send control and caption identify an unmarked outgoing editor',
      !overlay() && !filtered(late),
    );
    editor.querySelector('[contenteditable]')?.removeAttribute('contenteditable');
    const cropTool = document.createElement('span');
    cropTool.dataset.icon = 'crop';
    editor.append(cropTool);
    await wait();
    check('editing tools identify a draft without a caption field', !overlay() && !filtered(late));
    editor.remove();
    await wait();
    check('canceling the draft restores protection', overlay() && filtered(received));
    await chrome.storage.local.set({ settings: { ...preferences, blurChat: false } });
    main.append(editor);
    await wait();
    check(
      'media-only protection also exempts outgoing drafts',
      !filtered(late) && filtered(received),
    );
    editor.remove();
    const sent = document.createElement('img');
    sent.src = pixel;
    sent.dataset.testid = 'image-thumb';
    history.firstElementChild?.append(sent);
    await wait();
    check('sent media returns to the selected protection rules', filtered(sent));
    const viewer = document.createElement('div');
    viewer.dataset.testid = 'media-viewer';
    viewer.setAttribute('role', 'dialog');
    viewer.innerHTML = `<img data-testid="image-thumb" src='${pixel}'><button><span data-icon="send"></span></button>`;
    main.append(viewer);
    await wait();
    check(
      'a send icon alone does not exempt received media viewers',
      filtered(viewer.querySelector('img') as Element),
    );
    viewer.remove();
    const footer = document.createElement('footer');
    footer.innerHTML = `<div contenteditable="true"><img class="emoji" src='${pixel}'></div><button><span data-icon="send"></span></button>`;
    main.append(footer);
    await chrome.storage.local.set({ settings: preferences });
    await wait();
    check(
      'ordinary text composer does not suspend chat protection',
      overlay() && filtered(received),
    );
    const input = footer.querySelector('[contenteditable]') as HTMLElement;
    const clipboard = new DataTransfer();
    clipboard.items.add(new File(['synthetic image'], 'pasted.png', { type: 'image/png' }));
    input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
    const pastedPreview = document.createElement('div');
    pastedPreview.innerHTML = `<img style="width:180px;height:180px" src='${pixel}'>`;
    const pastedCaption = document.createElement('div');
    pastedCaption.innerHTML =
      '<div contenteditable="true" role="textbox">Caption of pasted image</div>';
    const pastedActions = document.createElement('div');
    pastedActions.innerHTML = `<img style="width:64px;height:64px" src='${pixel}'><button aria-label="Send media"><span data-icon="send-new-version"></span></button>`;
    main.append(pastedPreview, pastedCaption, pastedActions);
    await wait();
    check('clipboard image preview under separate main children suspends the overlay', !overlay());
    check(
      'clipboard preview and strip stay clear with unfamiliar send icons',
      !filtered(pastedPreview.firstElementChild as Element) &&
        !filtered(pastedActions.firstElementChild as Element),
    );
    check('received images outside the pasted draft retain protection', filtered(received));
    const anotherThumbnail = document.createElement('img');
    anotherThumbnail.src = pixel;
    pastedActions.append(anotherThumbnail);
    await wait();
    check('new pasted-draft thumbnails stay clear', !filtered(anotherThumbnail));
    pastedPreview.remove();
    pastedCaption.remove();
    pastedActions.remove();
    await wait();
    check('closing the pasted draft restores chat protection', overlay() && filtered(received));
    const textClipboard = new DataTransfer();
    textClipboard.setData('text/plain', 'ordinary text');
    input.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, clipboardData: textClipboard }),
    );
    await wait();
    check('pasting ordinary text does not suspend protection', overlay());
    document.body.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }),
    );
    main.append(pastedPreview, pastedCaption, pastedActions);
    await wait();
    check(
      'global clipboard paste also recognizes the outgoing draft',
      !overlay() && !filtered(pastedPreview.firstElementChild as Element),
    );
    pastedPreview.remove();
    pastedCaption.remove();
    pastedActions.remove();
    await wait();
    input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
    pastedCaption.replaceChildren(input);
    main.append(pastedPreview, pastedCaption, pastedActions);
    await wait();
    check(
      'a reused caption moved into the pasted editor is recognized',
      !overlay() && !filtered(pastedPreview.firstElementChild as Element),
    );
    footer.append(input);
    pastedPreview.remove();
    pastedCaption.remove();
    pastedActions.remove();
    await wait();
    check('leaving a reused clipboard editor restores protection', overlay());
    input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
    main.append(pastedPreview, pastedActions);
    await wait();
    check(
      'an unchanged caption field with newly mounted draft controls is recognized',
      !overlay() && !filtered(pastedPreview.firstElementChild as Element),
    );
    pastedPreview.remove();
    pastedActions.remove();
    await wait();
    check('closing a draft with an unchanged caption restores protection', overlay());
    input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, clipboardData: clipboard }));
    const receivedViewer = document.createElement('div');
    receivedViewer.setAttribute('role', 'dialog');
    receivedViewer.dataset.testid = 'media-viewer';
    receivedViewer.innerHTML = `<img data-testid="image-thumb" style="width:180px;height:180px" src='${pixel}'><button>Close</button>`;
    main.append(receivedViewer);
    await wait();
    check(
      'a paste hint cannot exempt a received viewer beside the existing caption',
      filtered(receivedViewer.firstElementChild as Element),
    );
    receivedViewer.remove();
  } catch (error) {
    check(error instanceof Error ? (error.stack ?? error.message) : String(error), false);
  }
  const report = document.createElement('pre');
  report.id = 'test-results';
  report.textContent = JSON.stringify(results);
  document.body.append(report);
})();
