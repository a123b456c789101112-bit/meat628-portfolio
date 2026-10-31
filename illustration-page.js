/* 插圖成品依參考圖錯落排列；原生延遲載入、固定互動範圍與站內傳送門。 */
"use strict";
window.createIllustrationPage = ({ root, settings, reduceMotion, navigate }) => {
  const board = root.querySelector('.illustration-board');
  const boardWidth = 1000;
  const boardHeight = Math.max(...settings.artworks.map(art => art.box[1] + art.box[3]));
  board.style.setProperty('--illustration-board-ratio', `${boardWidth} / ${boardHeight}`);
  const sections = [...root.querySelectorAll('[data-illustration-section]')];
  const buttons = [...root.querySelectorAll('[data-illustration-target]')];
  const images = [], sources = new WeakMap();
  const source = path => window.portfolioEmbeddedAssets?.[path] || path;
  let visible = false, navigationFrame = 0;
  const revealed = new WeakSet(), revealAnimations = new Set();
  let revealObserver;
  function reveal(image, index) {
    const card = image.closest('.illustration-artwork');
    if (!visible || revealed.has(card) || image.dataset.loaded !== 'true') return;
    const bounds = card.getBoundingClientRect();
    if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
    revealed.add(card); revealObserver?.unobserve(card);
    if (reduceMotion.matches) { card.dataset.revealed = 'true'; return; }
    try {
      const animation = card.animate([{opacity:0,transform:'translateY(20px)'},{opacity:1,transform:'translateY(0)'}],
        {duration:500,delay:(index%3)*60,easing:'cubic-bezier(.2,.7,.25,1)',fill:'backwards'});
      revealAnimations.add(animation);
      animation.finished.catch(() => {}).finally(() => { revealAnimations.delete(animation); card.dataset.revealed = 'true'; });
    } catch (_) { card.dataset.revealed = 'true'; } // 無動畫 API／啟動失敗時保持原本可見。
  }
  try {
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        const image = entry.target.querySelector('img'); reveal(image,images.indexOf(image));
      }
    });
  } catch (_) { /* 新動畫失敗不阻止既有圖片與燈箱初始化。 */ }
  reduceMotion.addEventListener('change',() => {
    if (reduceMotion.matches) for (const animation of revealAnimations) animation.cancel();
  });
  const dialog = root.querySelector('.illustration-lightbox');
  const fullImage = dialog.querySelector('.illustration-lightbox__image');
  const imageStage = dialog.querySelector('.illustration-lightbox__stage');
  const status = dialog.querySelector('.illustration-lightbox__status');
  const controls = [...dialog.querySelectorAll('button')];
  const featuredTitle = dialog.querySelector('.illustration-lightbox__featured-title');
  const featuredDetails = dialog.querySelector('.illustration-lightbox__featured-details');
  const sketchGrid = dialog.querySelector('.illustration-lightbox__sketches');
  const concept = dialog.querySelector('.illustration-lightbox__concept');
  const sketchesHeading = dialog.querySelector('[data-lightbox-sketches-heading]');
  const conceptHeading = dialog.querySelector('[data-lightbox-concept-heading]');
  let currentArtwork = -1, opener = null, scrollLock = null;
  let imageRequest = 0, pendingImage = null, swipe = null;

  // 只在本燈箱開啟期間鎖住頁面；復原原本的 inline 樣式與作品位置。
  function lockScroll() {
    const bodyProperties = ['position','top','left','width','overflow','padding-right'];
    const htmlProperties = ['overflow','scroll-behavior'];
    const remember = (element, properties) => properties.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
    const gap = innerWidth - document.documentElement.clientWidth;
    const padding = parseFloat(getComputedStyle(document.body).paddingRight) || 0;
    scrollLock = { x: scrollX, y: scrollY, body: remember(document.body, bodyProperties), html: remember(document.documentElement, htmlProperties) };
    Object.assign(document.body.style, { position: 'fixed', top: `${-scrollLock.y}px`, left: `${-scrollLock.x}px`, width: '100%', overflow: 'hidden', paddingRight: `${padding + gap}px` });
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.scrollBehavior = 'auto';
  }
  function finishClose(restoreFocus) {
    if (!scrollLock) return;
    imageRequest++; swipe = null;
    pendingImage?.removeAttribute('src'); pendingImage = null;
    const saved = scrollLock, target = opener;
    scrollLock = null; opener = null; currentArtwork = -1;
    const restore = (element, properties) => properties.forEach(([name,value,priority]) => {
      if (value) element.style.setProperty(name,value,priority); else element.style.removeProperty(name);
    });
    restore(document.body,saved.body); restore(document.documentElement,saved.html);
    target?.setAttribute('aria-expanded','false');
    if (restoreFocus) {
      target?.focus({preventScroll:true});
      window.scrollTo({left:saved.x,top:saved.y,behavior:'instant'});
    }
    fullImage.removeAttribute('src');
    fullImage.alt = ''; imageStage.setAttribute('aria-busy','false'); status.textContent = '';
    delete dialog.dataset.work; delete dialog.dataset.quality;
    renderFeatured(null);
  }
  function closeLightbox(restoreFocus = true) {
    if (dialog.open) dialog.close();
    finishClose(restoreFocus);
  }
  async function showArtwork(index) {
    currentArtwork = (index + settings.artworks.length) % settings.artworks.length;
    const art = settings.artworks[currentArtwork], request = ++imageRequest;
    renderFeatured(settings.featured?.[art.name]);
    pendingImage?.removeAttribute('src');
    const candidate = new Image(); pendingImage = candidate; candidate.decoding = 'async';
    dialog.dataset.work = art.name; dialog.dataset.quality = 'preview';
    dialog.setAttribute('aria-label',`完整作品檢視，第 ${currentArtwork + 1} 張，共 ${settings.artworks.length} 張`);
    imageStage.setAttribute('aria-busy','true'); status.textContent = '';
    fullImage.width = art.width; fullImage.height = art.height; fullImage.alt = art.alt;
    fullImage.src = images[currentArtwork].currentSrc || source(art.src);
    // 高畫質原檔只讀取正在看的這張；新圖解碼完成才換掉預覽。
    candidate.src = source(art.originalSrc);
    try {
      await candidate.decode();
      if (request !== imageRequest || !dialog.open) return;
      fullImage.src = candidate.src; dialog.dataset.quality = 'original';
    } catch (error) {
      if (request !== imageRequest || !dialog.open) return;
      status.textContent = '完整圖片讀取失敗，目前顯示預覽圖片。';
      dialog.dataset.quality = 'preview-error';
    } finally {
      if (request === imageRequest) { imageStage.setAttribute('aria-busy','false'); pendingImage = null; }
    }
  }
  function renderFeatured(featured) {
    featuredTitle.hidden = !featured?.title;
    featuredDetails.hidden = !featured;
    conceptHeading.hidden = concept.hidden = !featured?.concept;
    imageStage.tabIndex = featured ? 0 : -1;
    imageStage.scrollTop = 0;
    sketchGrid.replaceChildren();
    if (!featured) {
      delete dialog.dataset.featured;
      featuredTitle.textContent = concept.textContent = '';
      imageStage.removeAttribute('aria-label');
      return;
    }
    dialog.dataset.featured = 'true';
    const heading = featured.sketchesHeading || '不同版本草圖';
    imageStage.setAttribute('aria-label',`完成作品、${heading}${featured.concept ? '與創作理念' : ''}`);
    featuredTitle.textContent = featured.title || ''; concept.textContent = featured.concept || '';
    sketchesHeading.textContent = heading;
    sketchesHeading.hidden = !featured.sketches?.length;
    for (const art of featured.sketches || []) {
      const figure = document.createElement('figure'), image = new Image();
      image.alt = [featured.title,art.caption || `草圖 ${art.name}`].filter(Boolean).join('，');
      image.width = art.width; image.height = art.height;
      image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
      image.dataset.sketch = art.name;
      image.addEventListener('load',() => { image.dataset.loaded = 'true'; });
      image.addEventListener('error',() => { image.dataset.loaded = 'error'; status.textContent = '部分草圖讀取失敗，請稍後重新開啟作品。'; });
      image.src = source(art.src); figure.append(image);
      if (art.caption || art.selected) {
        const caption = document.createElement('figcaption');
        caption.textContent = art.caption || '最後選定草圖'; figure.append(caption);
      }
      sketchGrid.append(figure);
    }
  }
  function openLightbox(index, card) {
    if (!visible || dialog.open) return;
    opener = card; lockScroll();
    dialog.showModal(); card.setAttribute('aria-expanded','true');
    showArtwork(index); dialog.querySelector('[data-lightbox-close]').focus({preventScroll:true});
  }
  function bindControl(selector, action) {
    const button = dialog.querySelector(selector);
    let touch = null, touchActivatedAt = -Infinity;
    // 觸控滑動中移除舊草圖後，瀏覽器偶爾省略下一次的 click。
    // 控制鈕以有效的 touch pointerup 操作一次；滑出／拖動取消，鍵盤與滑鼠仍用 click。
    button.addEventListener('pointerdown',event => {
      if (event.pointerType === 'touch' && event.isPrimary) touch = { id:event.pointerId,x:event.clientX,y:event.clientY };
    });
    button.addEventListener('pointercancel',() => { touch = null; });
    button.addEventListener('pointerup',event => {
      const start = touch; touch = null;
      if (event.pointerType !== 'touch' || !start || start.id !== event.pointerId) return;
      const bounds = button.getBoundingClientRect();
      if (Math.hypot(event.clientX-start.x,event.clientY-start.y) > 12 ||
          event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) return;
      event.preventDefault(); touchActivatedAt = performance.now(); action();
    });
    // 關閉時避免瀏覽器把遲來的相容 click 送到下方作品，造成燈箱再次開啟。
    button.addEventListener('touchend',event => {
      if (performance.now()-touchActivatedAt < 500) event.preventDefault();
    },{passive:false});
    button.addEventListener('click',event => {
      if (event.pointerType === 'touch' || (event.detail > 0 && performance.now()-touchActivatedAt < 500)) return;
      action();
    });
  }
  bindControl('[data-lightbox-close]',() => closeLightbox());
  bindControl('[data-lightbox-previous]',() => showArtwork(currentArtwork - 1));
  bindControl('[data-lightbox-next]',() => showArtwork(currentArtwork + 1));
  dialog.addEventListener('cancel',event => { event.preventDefault(); closeLightbox(); });
  dialog.addEventListener('close',() => { if (!dialog.open) finishClose(visible); });
  dialog.addEventListener('keydown',event => {
    if (!dialog.open || event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); event.stopPropagation();
      showArtwork(currentArtwork + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.key === 'Tab') {
      // 精選作品多一個可捲動閱讀區；背景維持原生 inert，不接受焦點。
      event.preventDefault();
      const targets = dialog.dataset.featured ? [controls[0],imageStage,...controls.slice(1)] : controls;
      const index = targets.indexOf(document.activeElement);
      const next = index < 0 ? (event.shiftKey ? targets.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
      targets[next].focus({preventScroll:true});
    }
  });
  imageStage.addEventListener('pointerdown',event => {
    if (!dialog.open || !event.isPrimary || !['touch','pen'].includes(event.pointerType)) return;
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY };
    imageStage.setPointerCapture(event.pointerId);
  });
  imageStage.addEventListener('pointerup',event => {
    if (!swipe || swipe.id !== event.pointerId) return;
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y; swipe = null;
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy) * 1.4) showArtwork(currentArtwork + (dx < 0 ? 1 : -1));
  });
  imageStage.addEventListener('pointercancel',() => { swipe = null; });
  root.style.setProperty('--artwork-zoom', settings.zoom);
  root.style.setProperty('--artwork-zoom-ms', `${settings.zoomMs}ms`);
  function load(image) {
    if (!visible) return;
    const card = image.closest('.illustration-artwork');
    const bounds = card.getBoundingClientRect();
    image.sizes = `${Math.ceil(bounds.width * settings.zoom)}px`;
    if (image.dataset.loaded || bounds.bottom < -settings.preloadPixels || bounds.top > innerHeight + settings.preloadPixels) return;
    const art = sources.get(image); image.dataset.loaded = 'loading'; image.loading = 'eager';
    // 大圖展示可選原尺寸，仍僅在作品接近畫面時載入。
    const variants = art.variants.some(v => v.width >= art.width) ? art.variants : [...art.variants, { src: art.originalSrc, width: art.width }];
    image.srcset = variants.map(v => `${source(v.src)} ${v.width}w`).join(', ');
    image.src = source(art.src);
    // srcset 可能在切換版面時換候選；由實際 load 事件確認最新圖片，避免 decode() 被換圖中斷而誤報。
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) load(entry.target);
  }, { rootMargin: `${settings.preloadPixels}px 0px` });
  for (const [index,art] of settings.artworks.entries()) {
    const [x,y,width,height] = art.box;
    const card = document.createElement('figure'); card.className = 'illustration-artwork'; card.tabIndex = 0;
    card.dataset.work = art.name; card.setAttribute('aria-label', art.alt);
    card.setAttribute('role','button'); card.setAttribute('aria-haspopup','dialog');
    card.setAttribute('aria-controls',dialog.id); card.setAttribute('aria-expanded','false');
    card.style.cssText = `--art-x:${x/boardWidth*100}%;--art-y:${y/boardHeight*100}%;--art-width:${width/boardWidth*100}%;--art-height:${height/boardHeight*100}%`;
    const image = new Image(); image.width = art.width; image.height = art.height;
    image.alt = ''; image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
    image.addEventListener('load', () => {
      if (image.naturalWidth > 0) { image.dataset.loaded = 'true'; reveal(image,index); }
    });
    image.addEventListener('error', () => { image.dataset.loaded = 'error'; console.error('插圖作品讀取失敗', art.name); });
    sources.set(image,art); images.push(image); card.append(image); board.append(card); observer.observe(image);
    try { revealObserver?.observe(card); } catch (_) { /* 預設可見。 */ }
    card.addEventListener('focus', () => load(image));
    card.addEventListener('click',() => openLightbox(index,card));
    card.addEventListener('keydown',event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault(); if (!event.repeat) openLightbox(index,card);
      }
    });
  }
  const portals = window.createPortfolioPortals({ root: root.querySelector('#illustration-portal-scene'), settings: settings.portals, navigate });
  function updateNavigation() {
    navigationFrame = 0;
    if (!visible) return;
    const line = Math.min(innerHeight * .35,260);
    let current = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= line) current = section;
    for (const button of buttons) {
      if (button.dataset.illustrationTarget === current.id) button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    }
  }
  function queueNavigation() {
    if (visible && !navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
  }
  for (const button of buttons) button.addEventListener('click', () => {
    root.querySelector(`#${button.dataset.illustrationTarget}`).scrollIntoView({ behavior: reduceMotion.matches ? 'instant' : 'smooth' });
  });
  window.addEventListener('scroll',queueNavigation,{passive:true});
  window.addEventListener('resize',() => { if (visible) { images.forEach(load); queueNavigation(); } });
  return { setVisible(show) {
    const entered = show && !visible; visible = show; portals.setVisible(show);
    if (entered) window.scrollTo({top:0,behavior:'instant'});
    if (show) { images.forEach((image,index) => { load(image); reveal(image,index); }); updateNavigation(); }
    else {
      for (const animation of revealAnimations) animation.cancel();
      closeLightbox(false);
      if (navigationFrame) cancelAnimationFrame(navigationFrame); navigationFrame=0;
      buttons.forEach(button => button.removeAttribute('aria-current'));
    }
  } };
};
