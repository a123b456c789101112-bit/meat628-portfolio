/* IP 分區導覽、原創插圖與同頁網格；使用瀏覽器原生動畫與延遲載入。 */
"use strict";
window.createIPPortfolio = ({ root, settings, reduceMotion, navigate }) => {
  const sections = [...root.querySelectorAll('[data-ip-section]')];
  const navigation = [...root.querySelectorAll('[data-section-target]')];
  const gallery = root.querySelector('#ip-gallery');
  const rows = [...gallery.querySelectorAll('.gallery-row')].map((element,index) => ({element,index,track:element.querySelector('.gallery-track'),items:settings.illustrations.map((art,index)=>({art,index})).filter(item=>item.index%2===index),animation:null,cycle:0,duration:0,stagger:0,reduced:null})).filter(row=>{row.element.hidden=!row.items.length;return row.items.length>0;});
  const grid = root.querySelector('#ip-gallery-grid'), toggle = root.querySelector('#gallery-toggle');
  const illustrationSection = root.querySelector('#ip-illustrations');
  const stickers = root.querySelector('#ip-sticker-grid');
  const sources = new WeakMap(), images = [];
  const preload = settings.preloadPixels || 400;
  let visible = false, inView = false, nearView = false, expanded = false;
  let hovered = null, focused = null, touched = null, selected = null, navFrame = 0;
  gallery.style.setProperty('--gallery-zoom', settings.zoom);
  gallery.style.setProperty('--gallery-zoom-ms', `${settings.zoomMs}ms`);
  grid.style.setProperty('--gallery-zoom', settings.zoom);
  grid.style.setProperty('--gallery-zoom-ms', `${settings.zoomMs}ms`);
  const source = path => window.portfolioEmbeddedAssets?.[path] || path;

  const merchandise = [...root.querySelectorAll('[data-merch-source]')];
  function hydrateMerchandise(image) {
    if (!visible || image.dataset.loaded) return;
    const box = image.getBoundingClientRect();
    if (box.bottom < -preload || box.top > innerHeight + preload) return;
    image.dataset.loaded = 'loading'; image.src = source(image.dataset.merchSource);
    image.decode().then(() => { image.dataset.loaded = 'true'; }).catch(error => {
      image.dataset.loaded = 'error'; console.error('周邊照片讀取失敗', error);
    });
  }
  const merchandiseObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) hydrateMerchandise(entry.target);
  }, { rootMargin: `${preload}px 0px` });
  merchandise.forEach(image => merchandiseObserver.observe(image));

  function sizes(image) {
    const card = image.closest('.gallery-card') || image.parentElement;
    return `${Math.ceil(card.getBoundingClientRect().width * (card.closest('#ip-gallery-grid') ? settings.zoom : 1))}px`;
  }
  function hydrate(image) {
    const art = sources.get(image);
    if (!art) return;
    if (image.closest('.gallery-card').getBoundingClientRect().width > 0) image.sizes = sizes(image);
    if (image.dataset.hydrated === 'true') return;
    image.dataset.hydrated = 'true';
    // 已由可見範圍判斷延遲指派，現在確實預載下一小段，避免再被原生 lazy 排程延後。
    image.loading = 'eager';
    // 先設定 sizes/srcset，再給 src，避免先請求錯誤的大尺寸。
    if (art.variants?.length) image.srcset = art.variants.map(v => `${source(v.src)} ${v.width}w`).join(', ');
    else if (art.srcset) image.srcset = art.srcset;
    image.src = source(art.src);
    image.decode().then(() => { image.dataset.loaded = 'true'; }).catch(error => {
      image.dataset.loaded = 'error'; console.error('插圖讀取失敗', art.name || art.alt, error);
    });
  }
  const viewportImages = new IntersectionObserver(entries => {
    if (!visible || !expanded) return;
    for (const entry of entries) if (entry.isIntersecting) hydrate(entry.target);
  }, { rootMargin: `${preload}px 0px` });
  const marqueeImages = new IntersectionObserver(entries => {
    if (!visible || expanded || !nearView) return;
    for (const entry of entries) if (entry.isIntersecting) hydrate(entry.target);
  }, { root: gallery, rootMargin: `0px ${preload}px` });

  function refreshNearby() {
    if (!visible) return;
    if (expanded) {
      for (const image of images) if (image.closest('#ip-gallery-grid')) {
        const b = image.getBoundingClientRect();
        if (b.bottom > -preload && b.top < innerHeight + preload) hydrate(image);
      }
    } else if (nearView && !gallery.hidden) {
      const b = gallery.getBoundingClientRect();
      for (const image of images) if (!image.closest('#ip-gallery-grid')) {
        if (image.dataset.hydrated === 'true') continue;
        const card = image.closest('.gallery-card').getBoundingClientRect();
        if (card.right >= b.left - preload && card.left <= b.right + preload && card.bottom > -preload && card.top < innerHeight + preload) hydrate(image);
      }
    }
  }
  function makeCard(art, index, copy, inGrid) {
    const card = document.createElement(inGrid ? 'button' : 'figure');
    if (inGrid) card.type = 'button';
    card.className = 'gallery-card';
    card.dataset.index = index; card.dataset.copy = inGrid ? 'grid' : copy;
    card.setAttribute('aria-label', art.alt || `插圖 ${index + 1}`);
    if (inGrid) card.setAttribute('aria-pressed', 'false');
    const paper = document.createElement('span'); paper.className = 'gallery-paper';
    if (art.src) {
      const image = new Image(); image.alt = ''; image.width = art.width || 960; image.height = art.height || 960;
      image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
      sources.set(image, art); images.push(image); paper.append(image);
      (inGrid ? viewportImages : marqueeImages).observe(image);
    }
    card.append(paper);
    // 跑馬燈只展示作品，碰到不放大、不暫停；展開網格沿用既有操作。
    if (!inGrid) return card;
    card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovered = card; sync(); } });
    card.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hovered = null; sync(); } });
    card.addEventListener('focus', () => {
      if (card.matches(':focus-visible')) {
        focused = card; sync(); card.querySelectorAll('img').forEach(hydrate);
      }
    });
    card.addEventListener('blur', () => { if (focused === card) { focused = null; sync(); } });
    card.addEventListener('click', event => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen' || event.detail === 0) {
        touched = touched === card ? null : card; focused = null; sync(); card.querySelectorAll('img').forEach(hydrate);
      }
    });
    return card;
  }
  function appendGroup(row,copy) {
    const group = document.createElement('div'); group.className = 'gallery-group'; group.dataset.groupCopy = copy;
    if (copy) group.setAttribute('aria-hidden','true');
    row.items.forEach(({art,index}) => group.append(makeCard(art,index,copy,false)));
    row.track.append(group);
  }
  for (const row of rows) for (const copy of [-1,0,1]) appendGroup(row,copy);
  settings.illustrations.forEach((art, index) => grid.append(makeCard(art, index, 0, true)));

  const stickerCollection = window.createStickerCollection({ root: stickers, settings: settings.stickerMotion, artworks: settings.stickers, reduceMotion });
  const portals = window.createPortfolioPortals({ root: root.querySelector('#ip-portal-scene'), settings: settings.portals, navigate });

  function sync() {
    const next = hovered || touched || focused;
    if (selected !== next) {
      if (selected) { selected.dataset.enlarged = 'false'; selected.setAttribute('aria-pressed', 'false'); }
      selected = next;
      if (selected) { selected.dataset.enlarged = 'true'; selected.setAttribute('aria-pressed', 'true'); }
    }
    const pause = !visible || expanded || !inView || document.hidden || reduceMotion.matches;
    for (const row of rows) if (row.animation) {
      if (pause) row.animation.pause(); else row.animation.play();
    }
    gallery.dataset.paused = String(rows.every(row => !row.animation || row.animation.playState !== 'running'));
  }
  function clearSelection() { hovered = focused = touched = null; sync(); }
  function measure() {
    if (!visible || expanded) return;
    // 預留標題、按鈕與頁邊距後，以剩餘視窗高度容納完整兩排。
    const room = Math.max(100, innerHeight - (parseFloat(getComputedStyle(root).getPropertyValue('--ip-navigation-offset')) || 0) - parseFloat(getComputedStyle(illustrationSection).paddingTop) - root.querySelector('.illustration-heading').getBoundingClientRect().height - 24);
    const roomValue = `${room}px`;
    if (gallery.style.getPropertyValue('--gallery-room') !== roomValue) gallery.style.setProperty('--gallery-room', roomValue);
    for (const row of rows) {
      const original = row.track.querySelector('[data-group-copy="0"]');
      const width = original.getBoundingClientRect().width;
      if (!width) continue;
      const reduced = reduceMotion.matches;
      const required = Math.max(3,Math.ceil(gallery.clientWidth/width)+2);
      while (row.track.children.length < required) appendGroup(row,row.track.children.length-1);
      if (width === row.cycle && reduced === row.reduced) continue;
      const phase = row.animation && row.duration ? (Number(row.animation.currentTime)%row.duration)/row.duration : 0;
      row.animation?.cancel(); row.cycle=width; row.duration=width/settings.marqueePixelsPerSecond*1000; row.reduced=reduced;
      row.stagger = reduced ? 0 : row.index * width/row.items.length * settings.marqueeRowStagger;
      const prefix = reduced ? 0 : width;
      row.animation=row.track.animate([{transform:`translateX(${-prefix+row.stagger}px)`},{transform:`translateX(${-prefix+row.stagger-width}px)`}],{duration:row.duration,iterations:Infinity,easing:'linear'});
      row.animation.currentTime = reduced ? 0 : phase*row.duration;
      if (!reduced) row.element.scrollLeft=0;
    }
    sync();
  }
  function setExpanded(next) {
    clearSelection(); expanded = next;
    // 往下看到最後幾張後收起，先回插圖區，避免頁高縮短把人送到周邊。
    if (!next && illustrationSection.getBoundingClientRect().top < -8) illustrationSection.scrollIntoView({ behavior: 'instant', block: 'start' });
    gallery.hidden = next; grid.hidden = !next;
    toggle.setAttribute('aria-expanded', String(next)); toggle.textContent = next ? '收起' : '展開全部';
    illustrationSection.dataset.expanded = String(next);
    sync(); if (!next) measure(); refreshNearby(); queueNavigation();
  }
  toggle.addEventListener('click', () => setExpanded(!expanded));

  function updateNavigation() {
    navFrame = 0; if (!visible) return;
    refreshNearby();
    const marker = innerHeight * .35;
    const current = sections.filter(section => section.getBoundingClientRect().top <= marker).at(-1) || sections[0];
    for (const button of navigation) {
      if (button.dataset.sectionTarget === current.id) button.setAttribute('aria-current', 'location');
      else button.removeAttribute('aria-current');
    }
  }
  function queueNavigation() { if (visible && !navFrame) navFrame = requestAnimationFrame(updateNavigation); }
  for (const button of navigation) button.addEventListener('click', () => {
    clearSelection();
    document.getElementById(button.dataset.sectionTarget).scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth', block: 'start' });
  });
  document.addEventListener('click', event => { if (visible && !event.target.closest('.gallery-card')) { touched = null; sync(); } });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') clearSelection(); });
  window.addEventListener('scroll', queueNavigation, { passive: true });
  window.addEventListener('resize', () => {
    measure(); queueNavigation();
    for (const image of images) if (image.dataset.hydrated === 'true' && image.closest('.gallery-card').getBoundingClientRect().width > 0) image.sizes = sizes(image);
    refreshNearby();
  });
  document.addEventListener('visibilitychange', sync);
  reduceMotion.addEventListener('change', () => { measure(); for (const row of rows) if (row.animation) row.animation.currentTime=0; sync(); refreshNearby(); });
  new ResizeObserver(measure).observe(gallery);
  // 邊界剛好貼到視窗時 isIntersecting 仍可能為 true；確實露出內容才播放。
  new IntersectionObserver(entries => { inView = entries[0].isIntersecting && entries[0].intersectionRatio >= .001; sync(); }, { threshold: .001 }).observe(gallery);
  new IntersectionObserver(entries => { nearView = entries[0].isIntersecting; if (nearView) refreshNearby(); }, { rootMargin: `${preload}px 0px` }).observe(gallery);
  return {
    setVisible(show) {
      const entered = show && !visible; visible = show;
      stickerCollection.setVisible(show);
      portals.setVisible(show);
      if (!show) clearSelection();
      if (show) {
        if (entered) { window.scrollTo({ top: 0, behavior: 'instant' }); if (expanded) setExpanded(false); }
        measure(); updateNavigation(); refreshNearby(); merchandise.forEach(hydrateMerchandise);
      }
      sync();
    },
  };
};
