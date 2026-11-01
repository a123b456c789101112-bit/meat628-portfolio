/* 貼圖首圖／原創對話框：固定互動範圍、首次需要時載入、原生垂直動畫。 */
"use strict";
window.createStickerCollection = ({ root, settings, artworks, reduceMotion }) => {
  const source = path => window.portfolioEmbeddedAssets?.[path] || path;
  const mouseAvailable = matchMedia('(hover: hover) and (pointer: fine)');
  const entries = [];
  let visible = false, inView = false, active = null;
  root.style.setProperty('--sticker-zoom', settings.zoom);
  root.style.setProperty('--sticker-ms', `${settings.zoomMs}ms`);

  function loadCover(entry) {
    if (!visible || entry.cover.hasAttribute('src')) return;
    entry.cover.dataset.loaded='loading';
    entry.cover.src = source(entry.art.src);
    entry.cover.decode().then(() => { entry.cover.dataset.loaded = 'true'; }).catch(() => {
      entry.cover.dataset.loaded = 'error';
      console.error('貼圖首圖讀取失敗', entry.art.id);
    });
  }
  function sync() {
    for (const entry of entries) {
      const show = visible && inView && entry === active && entry.ready;
      entry.slot.dataset.active = String(show);
      entry.control.setAttribute('aria-expanded', String(show));
      entry.bubble.hidden = !show;
      if (entry.animation) {
        if (show && !document.hidden && !reduceMotion.matches) entry.animation.play();
        else entry.animation.pause();
      }
    }
  }
  function measure(entry) {
    if (!entry.ready || !entry.window.clientWidth) return;
    // 兩份相同長條接續；往下移動 -一張高度 → 0，銜接時畫面相同。
    // 把每一輪的容器高度對齊實體像素，避免兩份長圖在循環時採樣到不同的半像素。
    // 圖片用 contain 保持原比例，最多只多出不到一個實體像素的白邊，不裁圖或拉伸。
    const density = devicePixelRatio || 1;
    const height = Math.ceil(entry.window.getBoundingClientRect().width * entry.art.previewHeight / entry.art.previewWidth * density) / density;
    if (Math.abs(height - (entry.height || 0)) < .1) return;
    const phase = entry.animation && entry.duration ? Number(entry.animation.currentTime) / entry.duration % 1 : 0;
    entry.animation?.cancel(); entry.height = height;
    for (const image of entry.track.children) image.style.height = `${height}px`;
    entry.duration = height / settings.pixelsPerSecond * 1000;
    entry.animation = entry.track.animate([
      { transform: `translateY(-${height}px)` }, { transform: 'translateY(0)' },
    ], { duration: entry.duration, iterations: Infinity, easing: 'linear' });
    entry.animation.currentTime = reduceMotion.matches ? entry.duration : phase * entry.duration;
    sync();
  }
  function prepare(entry) {
    if (entry.preparing || entry.ready) return;
    entry.preparing = true;
    entry.track.replaceChildren();
    entry.frame.src = source(settings.dialog);
    const copies = [0, 1].map(copy => {
      const image = new Image(); image.width = entry.art.previewWidth; image.height = entry.art.previewHeight;
      image.alt = copy ? '' : `${entry.art.alt}縮圖預覽`; image.decoding = 'async'; image.draggable = false;
      if (copy) image.setAttribute('aria-hidden', 'true');
      image.src = source(entry.art.preview); entry.track.append(image); return image;
    });
    Promise.all([entry.frame.decode(), ...copies.map(image => image.decode())]).then(() => {
      entry.ready = true; entry.bubble.dataset.loaded = 'true'; measure(entry); sync();
    }).catch(() => {
      entry.preparing=false;entry.bubble.dataset.loaded = 'error'; console.error('貼圖預覽讀取失敗', entry.art.id);
    });
  }
  function select(entry) {
    active = entry;
    if (entry) { loadCover(entry); prepare(entry); }
    sync();
  }

  const nearby = new IntersectionObserver(changes => {
    if(!visible) return;
    for (const change of changes) if (change.isIntersecting) {
      const entry=entries.find(entry => entry.slot === change.target);loadCover(entry);prepare(entry);
    }
  }, { rootMargin: `${settings.preloadPixels}px 0px` });

  for (const art of artworks) {
    const slot = document.createElement('div'); slot.className = 'sticker-slot'; slot.dataset.sticker = art.id;
    let purchase = null;
    try { const url = new URL(art.url); if (url.protocol === 'https:' || url.protocol === 'http:') purchase = url.href; } catch {}
    const control = document.createElement(purchase ? 'a' : 'button'); control.className = 'sticker-control';
    if (purchase) { control.href = purchase; control.target = '_blank'; control.rel = 'noopener noreferrer'; }
    else control.type = 'button';
    control.setAttribute('aria-label', art.alt); control.setAttribute('aria-expanded', 'false');
    control.setAttribute('aria-controls', `sticker-preview-${art.id}`);
    const disc = document.createElement('span'); disc.className = 'sticker-disc';
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    circle.setAttribute('viewBox', '0 0 100 100'); circle.setAttribute('aria-hidden', 'true'); circle.classList.add('ink-circle');
    const use = document.createElementNS(circle.namespaceURI, 'use'); use.setAttribute('href', '#ink-circle'); circle.append(use);
    const cover = new Image(); cover.width = cover.height = 2048; cover.alt = ''; cover.decoding = 'async'; cover.draggable = false;
    disc.append(circle, cover); control.append(disc);
    const bubble = document.createElement('div'); bubble.id = `sticker-preview-${art.id}`; bubble.className = 'sticker-bubble'; bubble.hidden = true;
    const frame = new Image(); frame.className = 'sticker-bubble-frame'; frame.alt = ''; frame.width = frame.height = 2048; frame.decoding = 'async'; frame.draggable = false;
    const window = document.createElement('div'); window.className = 'sticker-preview-window';
    const track = document.createElement('div'); track.className = 'sticker-preview-track'; window.append(track); bubble.append(window, frame);
    slot.append(control, bubble); root.append(slot);
    const entry = { art, slot, control, cover, frame, bubble, window, track }; entries.push(entry);
    slot.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse' && mouseAvailable.matches) select(entry); });
    slot.addEventListener('pointerleave', () => { if (active === entry && !control.matches(':focus-visible')) select(null); });
    control.addEventListener('focus', () => { if (control.matches(':focus-visible')) select(entry); });
    control.addEventListener('blur', () => { if (active === entry && !slot.matches(':hover')) select(null); });
    // 觸控新操作尚待使用者決定，這次不加入輕點預覽行為。
    new ResizeObserver(() => measure(entry)).observe(window);
    nearby.observe(slot);
  }
  new IntersectionObserver(changes => {
    inView = changes[0].isIntersecting && changes[0].intersectionRatio >= .001;
    if (!inView) active = null;
    sync();
  }, { threshold: .001 }).observe(root);
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { select(null); event.target.blur(); } });
  document.addEventListener('visibilitychange', sync);
  reduceMotion.addEventListener('change', () => {
    for (const entry of entries) if (entry.animation && reduceMotion.matches) entry.animation.currentTime = entry.duration;
    sync();
  });
  return { preload() { if(visible) for(const entry of entries) {loadCover(entry);prepare(entry);} }, setVisible(show) {
    visible = show;
    if (!show) active = null;
    else for (const entry of entries) {
      const box = entry.slot.getBoundingClientRect();
      if (box.height && box.bottom > -settings.preloadPixels && box.top < innerHeight + settings.preloadPixels) { loadCover(entry);prepare(entry); }
    }
    sync();
  } };
};
