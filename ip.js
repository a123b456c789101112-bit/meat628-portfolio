/* 原創 IP：保留完整 PNG；只用 SVG 分開本體和頭上資訊，不修改圖片。 */
"use strict";
window.createPortfolioIP = ({ scene, settings, loadImage, alphaMap, reduceMotion, desktopPointer }) => {
  // 介紹共用腳下基線，避免後方吐司的文字壓到前方角色；不參與滑鼠命中。
  const descriptionY = Math.max(...settings.characters.map(c => c.box.y + c.box.height)) + 48;
  const characters = settings.characters.map(config => {
    const description = document.createElement('span');
    description.className = 'ip-description'; description.id = `ip-description-${config.name}`;
    description.dataset.description = config.name; description.dataset.active = 'false';
    description.textContent = config.description;
    description.style.left = `${(config.box.x + config.box.width / 2) / 25}%`;
    description.style.top = `${descriptionY / 14.06}%`;
    description.style.color = config.descriptionColor;
    scene.append(description);
    scene.querySelector(`[data-character="${config.name}"]`).setAttribute('aria-describedby', description.id);
    return {
    ...config,
    descriptionElement: description,
    element: scene.querySelector(`[data-character="${config.name}"]`),
    info: scene.querySelector(`[data-info="${config.name}"]`),
    maps: {}, animation: null, clicked: false, clickTimer: null, clickRequest: 0,
    };
  });
  const frontToBack = [...characters].sort((a, b) => b.depth - a.depth);
  let visible = false, ready = false, geometry = null, active = null, mode = null, lastPointerType = "mouse";
  let initialization = null, lastPointer = null;

  function resize() {
    if (!visible) return;
    const bounds = scene.getBoundingClientRect();
    geometry = { bounds, scale: bounds.width / 2500 };
  }

  function bodyHit(character, state, point, sx = 1, sy = 1) {
    const box = state === 'click' ? character.clickBox : character.box, map = character.maps[state];
    if (!map) return false;
    const pivotX = character.box.x + character.box.width / 2, pivotY = character.box.y + character.box.height;
    const x = (point.x - pivotX) / sx + pivotX;
    const y = (point.y - pivotY) / sy + pivotY;
    const px = Math.floor((x - box.x) / box.width * map.width), py = Math.floor((y - box.y) / box.height * map.height);
    return px >= 0 && py >= 0 && px < map.width && py < map.height && map.alpha[py * map.width + px] >= settings.artworkAlpha;
  }

  function visibleHit(character, point) {
    if (character !== active && !character.clicked) return bodyHit(character, "idle", point);
    const matrix = new DOMMatrix(getComputedStyle(character.element.firstElementChild).transform);
    return bodyHit(character, character.clicked ? 'click' : "hover", point, matrix.a, matrix.d);
  }

  function stableHit(character, point) {
    const stretch = settings.stretch;
    return visibleHit(character, point) || bodyHit(character, "idle", point) || bodyHit(character, "hover", point)
      || (character.clicked && bodyHit(character, 'click', point))
      || bodyHit(character, "hover", point, 1 - stretch * 0.45, 1 + stretch)
      || bodyHit(character, "hover", point, 1 + stretch * 0.2, 1 - stretch * 0.2);
  }

  function pick(clientX, clientY, retain = true) {
    if (!ready || !visible || !geometry?.scale) return null;
    const point = { x: (clientX - geometry.bounds.x) / geometry.scale, y: (clientY - geometry.bounds.y) / geometry.scale };
    if (retain && active && stableHit(active, point)) {
      return frontToBack.slice(0, frontToBack.indexOf(active)).find((c) => visibleHit(c, point)) || active;
    }
    return frontToBack.find((c) => visibleHit(c, point)) || null;
  }

  function stopPulse(character) {
    character.animation?.cancel();
    character.animation = null;
  }

  function pulse(character) {
    stopPulse(character);
    if (reduceMotion.matches) return;
    const amount = settings.stretch;
    const animation = character.element.firstElementChild.animate([
      { transform: "scale(1, 1)", offset: 0, easing: "cubic-bezier(.18,.75,.25,1)" },
      { transform: `scale(${1 - amount * 0.45}, ${1 + amount})`, offset: 0.22, easing: "ease-out" },
      { transform: `scale(${1 + amount * 0.2}, ${1 - amount * 0.2})`, offset: 0.60, easing: "ease-out" },
      { transform: "scale(1, 1)", offset: 1 },
    ], { duration: settings.pulseMs, easing: "linear", iterations: 1 });
    character.animation = animation;
    animation.onfinish = () => {
      if (character.animation === animation) character.animation = null;
      animation.cancel();
    };
  }

  function activate(next, inputMode) {
    if (next === active) { mode = inputMode; return; }
    if (active) {
      if (!active.clicked) stopPulse(active);
    }
    active = next;
    mode = inputMode;
    if (next) {
      if (!next.clicked) pulse(next);
      prepareClick(next);
    }
    characters.forEach(render);
  }

  function render(character) {
    const shown = character === active || character.clicked;
    character.element.dataset.active = String(character === active);
    character.element.dataset.clicked = String(character.clicked);
    character.element.setAttribute('aria-expanded', String(shown));
    character.info.dataset.active = String(shown);
    character.descriptionElement.dataset.active = String(character === active);
    character.info.querySelector('use').setAttribute('href', `#ip-art-${character.name}-${character.clicked ? 'click' : 'hover'}`);
    character.info.querySelector('use').setAttribute('clip-path', `url(#${character.clicked ? character.clickInfoClip : `ip-info-clip-${character.name}`})`);
  }
  function reset() {
    for (const character of characters) {
      clearTimeout(character.clickTimer); character.clickRequest++; character.clicked = false; stopPulse(character);
    }
    activate(null, null); characters.forEach(render);
  }
  function toggle(character, inputMode) { activate(character === active ? null : character, inputMode); }

  function prepareClick(character) {
    if (character.clickLoading) return character.clickLoading;
    character.clickLoading = (async () => {
      const element = scene.querySelector(`#ip-art-${character.name}-click`);
      element.setAttribute('href', element.dataset.source);
      const image = await loadImage(element.dataset.source), b = character.clickBox;
      const map = alphaMap(image, 512, Math.round(512 * b.height / b.width), b);
      // 棉花狗的新蝴蝶結與對話框尾端在高度上略微交錯；資訊不當作本體命中區。
      if (character.name === 'cotton') for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
        if (b.y + y / map.height * b.height < 740 && b.x + x / map.width * b.width >= 550) map.alpha[y * map.width + x] = 0;
      }
      character.maps.click = map; return true;
    })().catch(error => { console.error('IP 點擊狀態讀取失敗', error); return false; });
    return character.clickLoading;
  }

  async function press(character) {
    if (!character || !visible || !ready) return;
    const request = ++character.clickRequest;
    if (!await prepareClick(character) || !visible || request !== character.clickRequest) return;
    clearTimeout(character.clickTimer); character.clicked = true; render(character);
    const motion = character.element.firstElementChild, current = getComputedStyle(motion).transform;
    stopPulse(character);
    if (!reduceMotion.matches) {
      const amount = settings.clickCompression;
      const animation = motion.animate([
        { transform: current === 'none' ? 'scale(1,1)' : current, offset: 0, easing: 'cubic-bezier(.18,.75,.25,1)' },
        { transform: `scale(${1 + amount * .45},${1 - amount})`, offset: .25, easing: 'ease-out' },
        { transform: 'scale(.99,1.02)', offset: .65, easing: 'ease-out' },
        { transform: 'scale(1,1)', offset: 1 },
      ], { duration: settings.clickPulseMs, easing: 'linear' });
      character.animation = animation;
      animation.onfinish = () => { if (character.animation === animation) character.animation = null; animation.cancel(); };
    }
    character.clickTimer = setTimeout(() => {
      character.clicked = false; render(character);
      if (mode === 'hover' && lastPointer) activate(pick(lastPointer.x, lastPointer.y), 'hover');
    }, settings.clickHoldMs);
  }

  async function initializeOnce() {
    scene.setAttribute("aria-busy", "true");
    scene.style.setProperty("--ip-info-rise", `${settings.infoRisePixels}px`);
    scene.style.setProperty("--ip-info-ms", `${settings.infoMs}ms`);
    await Promise.all(characters.map(async (character) => {
      const b = character.box;
      Object.assign(character.element.style, {
        left: "0", top: "0", width: "100%", height: "100%", zIndex: character.depth,
      });
      for (const [key, value] of Object.entries({ x: b.x / 2500, y: b.y / 1406, width: b.width / 2500, height: b.height / 1406 })) {
        character.element.style.setProperty(`--body-${key}`, `${value * 100}%`);
      }
      character.element.firstElementChild.style.transformOrigin = `${(b.x + b.width / 2) / 2500 * 100}% ${(b.y + b.height) / 1406 * 100}%`;
      // 所有圖片沿用同一張完整畫布，避免小型 SVG 個別縮放時產生次像素取樣差異。
      // 只裁掉本體之外的透明區與頭上資訊；多留 2 個原稿像素，保留邊緣取樣。
      const namespace = "http://www.w3.org/2000/svg";
      const clip = document.createElementNS(namespace, "clipPath");
      clip.id = `ip-body-clip-${character.name}`;
      const rect = document.createElementNS(namespace, "rect");
      for (const [key, value] of Object.entries({ x: b.x - 2, y: b.y - 2, width: b.width + 4, height: b.height + 4 })) rect.setAttribute(key, value);
      clip.append(rect);
      scene.querySelector("defs").append(clip);
      character.element.querySelector("svg").setAttribute("viewBox", "0 0 2500 1406");
      for (const use of character.element.querySelectorAll('use:not([data-ip-art="click"])')) use.setAttribute("clip-path", `url(#${clip.id})`);
      character.clickBox = character.name === 'cotton' ? { x: 326, y: 725, width: 745, height: 454 } : character.name === 'green' ? { x: 1164, y: 653, width: 1088, height: 515 } : b;
      const clickClip = document.createElementNS(namespace, 'clipPath'); clickClip.id = `ip-click-body-${character.name}`;
      const areas = character.name === 'cotton' ? [[320,740,760,450],[320,720,230,40]] : [[character.clickBox.x,character.clickBox.y,character.clickBox.width,character.clickBox.height]];
      for (const [x,y,width,height] of areas) { const rect = document.createElementNS(namespace,'rect'); for (const [k,v] of Object.entries({x,y,width,height})) rect.setAttribute(k,v); clickClip.append(rect); }
      scene.querySelector('defs').append(clickClip);
      character.element.querySelector('[data-ip-art="click"]').setAttribute('clip-path',`url(#${clickClip.id})`);
      character.clickInfoClip = `ip-info-clip-${character.name}`;
      if (character.name === 'cotton') {
        const infoClip = document.createElementNS(namespace,'clipPath'); infoClip.id = 'ip-click-info-cotton';
        const path = document.createElementNS(namespace,'path'); path.setAttribute('d','M0 0H2500V740H550V720H320V740H0Z'); infoClip.append(path); scene.querySelector('defs').append(infoClip); character.clickInfoClip = infoClip.id;
      }
      await Promise.all(["idle", "hover"].map(async (state) => {
        const element = scene.querySelector(`#ip-art-${character.name}-${state}`);
        const source = element.dataset.source;
        element.setAttribute("href", source);
        const image = await loadImage(source);
        character.maps[state] = alphaMap(image, 512, Math.round(512 * b.height / b.width), b);
      }));
    }));
    ready = true;
    scene.dataset.ready = "true";
    scene.setAttribute("aria-busy", "false");
    resize();
    if (visible && lastPointer && desktopPointer.matches) activate(pick(lastPointer.x, lastPointer.y), "hover");
  }

  function initialize() {
    if (!initialization) initialization = initializeOnce().catch(error => {
      scene.dataset.ready = "error";
      scene.setAttribute("aria-busy", "false");
      console.error("IP 圖片讀取失敗", error);
      throw error;
    });
    return initialization;
  }

  for (const character of characters) {
    character.element.addEventListener("focus", () => {
      if (visible && ready && character.element.matches(":focus-visible")) activate(character, "focus");
    });
    character.element.addEventListener("blur", () => {
      if (active === character && (mode === "focus" || mode === "keyboard")) reset();
    });
    character.element.addEventListener("click", (event) => {
      event.preventDefault();
      if (ready && visible) { activate(character, 'keyboard'); press(character); }
    });
  }

  document.addEventListener("pointermove", (event) => {
    if (visible && event.pointerType === "mouse" && desktopPointer.matches) {
      lastPointer = { x: event.clientX, y: event.clientY };
      activate(pick(event.clientX, event.clientY), "hover");
    }
  }, { passive: true });
  document.addEventListener("pointerdown", (event) => { lastPointerType = event.pointerType; }, { passive: true });
  document.addEventListener("click", (event) => {
    if (!visible || !ready || !event.isTrusted || event.detail === 0 || event.target.closest(".ip-character")) return;
    if (!desktopPointer.matches || event.pointerType === "touch" || lastPointerType !== "mouse") toggle(pick(event.clientX, event.clientY), "touch");
    else press(pick(event.clientX, event.clientY));
  });
  document.documentElement.addEventListener("pointerleave", (event) => { if (event.pointerType === "mouse") { lastPointer = null; activate(null, null); } });
  document.addEventListener("pointercancel", reset);
  window.addEventListener("blur", () => { lastPointer = null; reset(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) reset(); });
  document.addEventListener("keydown", (event) => { if (visible && event.key === "Escape") reset(); });
  reduceMotion.addEventListener("change", () => { if (reduceMotion.matches) for (const c of characters) stopPulse(c); });
  window.addEventListener("resize", resize);
  // IP 頁面現在可上下捲動，角色命中範圍必須跟著畫面位置更新。
  window.addEventListener("scroll", () => { if (visible) { resize(); if (mode === "hover") reset(); } }, { passive: true });

  return {
    initialize,
    setVisible(show) {
      visible = show;
      if (!show) lastPointer = null;
      reset();
      if (show) {
        resize();
        initialize().then(() => { if (visible) resize(); }).catch(() => {});
      }
    },
  };
};
