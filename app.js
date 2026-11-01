(() => {
  "use strict";

  const config = window.portfolioSettings;
  const scene = document.getElementById("home");
  const homeViewport = document.getElementById("home-viewport");
  const portfolio = document.getElementById("portfolio-page");
  const ipViewport = document.getElementById("ip-viewport");
  const illustrationViewport = document.getElementById("illustration-viewport");
  const materialsViewport = document.getElementById("materials-viewport");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const desktopPointer = matchMedia("(hover: hover) and (pointer: fine)");
  const stage = { width: 2500, height: 1406, scale: 1, bounds: null };
  const routes = { "/ip": "IP 作品集", "/illustration": "插圖作品集", "/materials": "材料科學作品集", "/contact": "聯絡我" };
  const portablePreview = location.protocol === "file:" || location.origin === "null" || document.documentElement.dataset.routing === "hash";
  const signs = [...document.querySelectorAll(".sign")].map((element) => ({
    element,
    anchor: element.querySelector(".sign__anchor"),
    art: element.querySelector(".sign__art"),
    motion: element.querySelector(".sign__motion"),
    name: element.dataset.sign,
    shadow: document.querySelector(`[data-shadow="${element.dataset.sign}"]`),
    shadowMotion: document.querySelector(`[data-shadow="${element.dataset.sign}"] .sign-shadow__motion`),
    shadowArt: document.querySelector(`[data-shadow="${element.dataset.sign}"] .sign-shadow__art`),
    shadowAnchor: document.querySelector(`[data-shadow="${element.dataset.sign}"] .sign-shadow__anchor`),
    offset: 0,
    velocity: 0,
    lift: 0,
    active: false,
    focused: false,
    spring: null,
    releasePending: false,
    alpha: null,
    mask: null,
  }));
  // 可見圖層由上而下；保留靜態構圖的前後關係。
  const frontToBack = ["ip", "materials", "illustration"].map((name) => signs.find((s) => s.name === name));
  let hovered = null;
  let pointer = null;
  let lastInput = null;
  let pointerSegments = [];
  let frame = 0;
  let ready = false;
  let onHome = true;
  let renderedRoute = null;
  let homeTouchStart = null;
  let homeTouchActivatedAt = -Infinity;
  let furInitialization = null, groundInitialization = null;
  let homeArtworkPreparation = null;
  let resolveHomePaint;
  const homePaintReady = new Promise(resolve => { resolveHomePaint = resolve; });
  const fur = window.createPortfolioFur({
    layer: document.getElementById("fur-layer"), settings: config.fur, schedule,
    beforeRaster: () => homePaintReady,
    enabled: () => ready && onHome && !document.hidden && !reduceMotion.matches,
    interactive: () => desktopPointer.matches,
  });
  const homeIntroductions=window.createHomeIntroductions({
    layer:document.getElementById('home-dialog-layer'),viewport:homeViewport,
    profile:document.querySelector('.home-profile'),settings:config.homeIntroductions,reduceMotion,onReady:schedule,
  });
  const ip = window.createPortfolioIP({
    scene: document.getElementById("ip-scene"), settings: config.ip,
    loadImage, alphaMap, reduceMotion, desktopPointer,
  });

  const ipPortfolio = window.createIPPortfolio({ root: ipViewport, settings: config.ipPortfolio, reduceMotion, navigate });

  const illustrationPage = window.createIllustrationPage({ root: illustrationViewport, settings: config.illustrationPage, reduceMotion, navigate });
  const materialsPage = window.createMaterialsPage({root:materialsViewport,content:window.portfolioMaterialsContent,portalSettings:config.illustrationPage.portals,illustrationPortal:config.ipPortfolio.portals.cards.find(card=>card.name==='illustration'),reduceMotion,navigate});
  document.getElementById('home-link').addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate('/');
  });

  async function loadImage(source, priority='auto') {
    const image = new Image();
    image.fetchPriority=priority;
    image.src = source;
    await image.decode();
    return image;
  }

  function alphaMap(image, width, height, crop) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (crop) context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    else context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const alpha = new Uint8Array(width * height);
    for (let i = 0; i < alpha.length; i += 1) alpha[i] = pixels[i * 4 + 3];
    return { width, height, alpha };
  }

  async function backgroundDataUrl() {
    const source = document.getElementById("ground-art").href.baseVal;
    if (source.startsWith("data:")) return source;
    const response = await fetch(source);
    if (!response.ok) throw new Error(`背景讀取失敗：${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function prepareMask(sign, groundSource) {
    const signature = config.renderCacheRevision + ':' + config.hitTest.maskWidth + ':' + ['ground-alpha', sign.element.dataset.groundMask].map(id => document.getElementById(id).outerHTML).join('');
    const cacheKey = `ground-${sign.name}`;
    const cached = await window.portfolioRenderCache.get(cacheKey, signature);
    if (/^data:image\/(?:png|webp);base64,/.test(cached?.source || '') && cached.map?.alpha?.length === cached.map.width * cached.map.height) {
      sign.maskImage = await loadImage(cached.source);
      for (const root of [sign.element, sign.shadow]) root.style.setProperty('--ground-window', `url("${cached.source}")`);
      sign.element.dataset.renderCacheHit = 'true';
      return cached.map;
    }
    sign.element.dataset.renderCacheHit = 'false';
    groundSource = await groundSource();
    // 以網站本身的 SVG 遮罩作互動判斷，草地蓋住的像素不當作牌子。
    // 嵌入原圖才能安全讀取 canvas；不寫入或更改任何美術檔案。
    const definitions = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    // 只需要草地的定義；不要把牌子、影子及其他外部圖片帶進互動遮罩。
    for (const id of ["ground-art", "ground-alpha", sign.element.dataset.groundMask]) {
      definitions.append(document.getElementById(id).cloneNode(true));
    }
    definitions.querySelector("#ground-art").setAttribute("href", groundSource);
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${stage.width} ${stage.height}`);
    svg.setAttribute("width", stage.width);
    svg.setAttribute("height", stage.height);
    svg.append(definitions);
    const use = document.createElementNS(svg.namespaceURI, "use");
    use.setAttribute("href", "#ground-art");
    use.setAttribute("mask", `url(#${sign.element.dataset.groundMask})`);
    svg.append(use);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" }));
    try {
      const image = await loadImage(url);
      return saveGroundMask(sign, image, cacheKey, signature);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function saveGroundMask(sign, image, cacheKey, signature) {
      const width = config.hitTest.maskWidth;

      // 草地形狀不會動：保留原稿解析度，在載入時把相同的遮罩結果快取一次。
      // 避免牌子／影子移動時，每一格都重算大範圍的模糊濾鏡；原美術檔案不變。
      const cache = document.createElement("canvas");
      cache.width = stage.width;
      cache.height = stage.height;
      const context = cache.getContext("2d");
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, cache.width, cache.height);
      // 草地邊緣以下保持遮擋，避免旋轉後的取樣邊界讓牌子或影子穿出。
      for (let x = 0; x < cache.width; x++) {
        let alpha = 0;
        for (let y = 0; y < cache.height; y++) {
          const i = (y * cache.width + x) * 4;
          alpha = Math.max(alpha, pixels.data[i + 3]);
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 255;
          pixels.data[i + 3] = alpha;
        }
      }
      context.putImageData(pixels, 0, 0);
      const hitMap = alphaMap(cache, width, Math.round(width * stage.height / stage.width));
      for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = 255 - pixels.data[i];
      context.putImageData(pixels, 0, 0);
      const snapshotSource = cache.toDataURL("image/png");
      // 快取 PNG 也要完成解碼，不能在遮罩仍待載入時就宣告首頁可互動。
      sign.maskImage = await loadImage(snapshotSource);
      for (const root of [sign.element, sign.shadow]) root.style.setProperty("--ground-window", `url("${snapshotSource}")`);
      window.portfolioRenderCache.put(cacheKey, signature, { source:snapshotSource, map:hitMap });
      return hitMap;
  }

  function draw(sign) {
    sign.motion.style.transform = `translate3d(0, ${sign.offset * stage.scale}px, 0)`;
    const progress = sign.lift ? Math.max(0, Math.min(config.motion.overshoot, -sign.offset / sign.lift)) : 0;
    if (sign.shadowProgress !== progress) {
      const settings = config.shadow;
      const mix = (ground, raised) => ground + (raised - ground) * progress;
      sign.shadowMotion.style.transform = `scale(${mix(settings.groundSpread, settings.raisedSpread)}, ${mix(settings.groundFlatten, settings.raisedFlatten)})`;
      sign.shadowMotion.style.opacity = mix(settings.groundOpacity, settings.raisedOpacity);
      sign.shadowProgress = progress;
    }
  }

  function updateGeometry() {
    if (!onHome) return;
    stage.bounds = scene.getBoundingClientRect();
    stage.scale = stage.bounds.width / stage.width;
    fur.resize(stage);
    for (const sign of signs) {
      const style = getComputedStyle(sign.element);
      sign.x = parseFloat(style.getPropertyValue("--x")) / 100 * stage.width;
      sign.y = parseFloat(style.getPropertyValue("--y")) / 100 * stage.height;
      const slotWidth = parseFloat(style.getPropertyValue("--width")) / 100 * stage.width;
      const slotHeight = slotWidth * 873 / 1425;
      // 素材可有不同長寬比：在原有位置與範圍內等比例置中，不拉伸或裁掉角色。
      // 互動也使用實際圖片範圍，不能把兩側透明留白當成可點區域。
      const crop = sign.art.viewBox.baseVal;
      const fit = Math.min(slotWidth * stage.scale / crop.width, slotHeight * stage.scale / crop.height);
      const artWidth = crop.width * fit;
      const artHeight = crop.height * fit;
      sign.art.style.width = `${artWidth}px`;
      sign.art.style.height = `${artHeight}px`;
      sign.width = artWidth / stage.scale;
      sign.height = artHeight / stage.scale;
      sign.angle = parseFloat(getComputedStyle(sign.element).getPropertyValue("--angle")) * Math.PI / 180;
      const shadowAnchor = config.shadow.anchors[sign.name];
      const footX = sign.x - Math.sin(sign.angle) * sign.height * config.shadow.footRatio;
      sign.shadowX = shadowAnchor.x === undefined ? footX : shadowAnchor.x * stage.width;
      sign.shadowY = shadowAnchor.groundY * stage.height;
      sign.shadowBaseWidth = shadowAnchor.width || sign.width * shadowAnchor.widthRatio;
      const shadowBox = sign.shadowArt.viewBox.baseVal;
      sign.shadow.style.left = `${sign.shadowX * stage.scale}px`;
      sign.shadow.style.top = `${sign.shadowY * stage.scale}px`;
      const shadowWidth = sign.shadowBaseWidth * stage.scale;
      const shadowHeight = shadowWidth * shadowBox.height / shadowBox.width;
      // 預留懸浮影子展開範圍，遮罩固定於地面，不跟著影子縮放。
      const frameWidth = shadowWidth * 1.12 + 16;
      const frameHeight = shadowHeight * 1.12 + 16;
      sign.shadow.style.width = `${frameWidth}px`;
      sign.shadow.style.height = `${frameHeight}px`;
      sign.shadowAnchor.style.width = `${shadowWidth}px`;
      sign.shadowAnchor.style.height = `${shadowHeight}px`;
      sign.shadow.style.setProperty('--mask-size', `${stage.bounds.width}px ${stage.bounds.height}px`);
      sign.shadow.style.setProperty('--mask-position', `${frameWidth / 2 - sign.shadowX * stage.scale}px ${frameHeight / 2 - sign.shadowY * stage.scale}px`);
      const top = sign.y - (sign.height * Math.abs(Math.cos(sign.angle)) + sign.width * Math.abs(Math.sin(sign.angle))) / 2;
      const defaultMargin = config.motion.topMarginRatio * stage.height;
      const individualMargin = config.motion.topMarginBySign?.[sign.name];
      const margin = individualMargin === undefined ? defaultMargin : Math.min(
        defaultMargin,
        Math.max(individualMargin * stage.height, config.motion.minimumTopMarginPixels / stage.scale),
      );
      const room = Math.max(0, top - margin);
      const previousLift = sign.lift;
      sign.lift = Math.min(config.motion.liftRatio * stage.height, room / config.motion.overshoot);
      // 固定遮罩只需涵蓋這張牌子的活動範圍；保持原來的全景取樣位置。
      const extentWidth = sign.width * Math.abs(Math.cos(sign.angle)) + sign.height * Math.abs(Math.sin(sign.angle));
      const extentHeight = sign.height * Math.abs(Math.cos(sign.angle)) + sign.width * Math.abs(Math.sin(sign.angle));
      const rise = sign.lift * config.motion.overshoot;
      const marginRoom = Math.max(20, 8 / stage.scale);
      const left = sign.x - extentWidth / 2 - marginRoom;
      const topEdge = sign.y - extentHeight / 2 - rise - marginRoom;
      sign.element.style.left = `${left * stage.scale}px`;
      sign.element.style.top = `${topEdge * stage.scale}px`;
      sign.element.style.width = `${(extentWidth + marginRoom * 2) * stage.scale}px`;
      sign.element.style.height = `${(extentHeight + rise + marginRoom * 2) * stage.scale}px`;
      sign.element.style.setProperty("--mask-size", `${stage.bounds.width}px ${stage.bounds.height}px`);
      sign.element.style.setProperty("--mask-position", `${-left * stage.scale}px ${-topEdge * stage.scale}px`);
      sign.anchor.style.left = `${(sign.x - left) * stage.scale}px`;
      sign.anchor.style.top = `${(sign.y - topEdge) * stage.scale}px`;
      sign.anchor.style.width = `${slotWidth * stage.scale}px`;
      if (previousLift) {
        sign.offset *= sign.lift / previousLift;
        sign.velocity *= sign.lift / previousLift;
      }
      draw(sign);
      if (sign.spring) sign.spring.target = sign.spring.kind === "rise" ? -sign.lift : 0;
    }
    homeIntroductions.resize(stage,signs);
  }

  function worldPoint(clientX, clientY) {
    refreshHomeBounds();
    if (!stage.bounds) return null;
    const x = (clientX - stage.bounds.x) / stage.scale;
    const y = (clientY - stage.bounds.y) / stage.scale;
    return x >= 0 && y >= 0 && x <= stage.width && y <= stage.height ? { x, y } : null;
  }

  function sample(map, x, y) {
    const px = Math.floor(x);
    const py = Math.floor(y);
    return px >= 0 && py >= 0 && px < map.width && py < map.height ? map.alpha[py * map.width + px] : 0;
  }

  function uncovered(sign, point) {
    return sample(sign.mask, point.x / stage.width * sign.mask.width, point.y / stage.height * sign.mask.height) < config.hitTest.groundAlpha;
  }

  function artworkHit(sign, point, offset) {
    const dx = point.x - sign.x;
    const dy = point.y - sign.y - offset;
    const x = dx * Math.cos(sign.angle) + dy * Math.sin(sign.angle);
    const y = -dx * Math.sin(sign.angle) + dy * Math.cos(sign.angle);
    return sample(sign.alpha, (x / sign.width + 0.5) * sign.alpha.width, (y / sign.height + 0.5) * sign.alpha.height) >= config.hitTest.artworkAlpha;
  }

  function visibleHit(sign, point) {
    return uncovered(sign, point) && artworkHit(sign, point, sign.offset);
  }

  function stableHit(sign, point) {
    if (!uncovered(sign, point)) return false;
    if (artworkHit(sign, point, sign.offset) || artworkHit(sign, point, 0)) return true;
    // 保留原位至浮起位置之間的連續互動區域，圖片移動不會令 hover 失效。
    const distance = reduceMotion.matches ? 0 : sign.lift * config.motion.overshoot;
    for (let i = 1; i <= config.hitTest.sweepSamples; i += 1) {
      if (artworkHit(sign, point, -distance * i / config.hitTest.sweepSamples)) return true;
    }
    return false;
  }

  function pick(point, retainHover = true) {
    if (!ready || !onHome || !point) return null;
    if (retainHover && hovered && stableHit(hovered, point)) {
      const above = frontToBack.slice(0, frontToBack.indexOf(hovered));
      return above.find((sign) => visibleHit(sign, point)) || hovered;
    }
    return frontToBack.find((sign) => visibleHit(sign, point)) || null;
  }

  function stopMotion(sign, offset = 0) {
    sign.offset = offset;
    sign.velocity = 0;
    sign.spring = null;
    sign.releasePending = false;
    sign.element.dataset.motion = "still";
    draw(sign);
  }

  function startSpring(sign, kind, now = performance.now()) {
    if (reduceMotion.matches || !sign.lift) { stopMotion(sign); return; }
    const target = kind === "rise" ? -sign.lift : 0;
    if (sign.spring?.kind === kind) return;
    if (Math.abs(sign.offset - target) * stage.scale < config.motion.settlePixels && Math.abs(sign.velocity) * stage.scale < config.motion.settleSpeed) {
      stopMotion(sign, target);
      return;
    }
    // 更換方向時保留當下的位置與速度，不重播或跳回起點。
    sign.spring = { kind, target, lastTime: now };
    sign.element.dataset.motion = kind;
    schedule();
  }

  function release(sign, now = performance.now()) {
    if (sign.spring?.kind === "rise" && sign.offset > -sign.lift * config.motion.minimumPopRatio) {
      sign.releasePending = true;
      return;
    }
    sign.releasePending = false;
    startSpring(sign, "return", now);
  }

  function syncActive(now = performance.now()) {
    for (const sign of signs) {
      const active = onHome && (sign === hovered || sign.focused);
      if (sign.active === active) continue;
      sign.active = active;
      sign.element.dataset.active = String(active);
      if (active) {
        if(sign.name==='ip') warmIP();
        sign.releasePending = false;
        startSpring(sign, "rise", now);
      } else release(sign, now);
    }
    if(onHome && homeIntroductions.step(now,signs)) schedule();
  }

  function updatePointer(now = performance.now()) {
    hovered = desktopPointer.matches && pointer ? pick(worldPoint(pointer.x, pointer.y)) : null;
    syncActive(now);
  }

  function processPointerPath(now) {
    const touched = new Set();
    if (ready && onHome && desktopPointer.matches && !reduceMotion.matches) {
      for (const segment of pointerSegments) {
        const distance = Math.hypot(segment.to.x - segment.from.x, segment.to.y - segment.from.y) / stage.scale;
        const steps = Math.max(1, Math.ceil(distance / config.hitTest.pointerStep));
        for (let i = 0; i <= steps; i += 1) {
          const fraction = i / steps;
          const point = worldPoint(
            segment.from.x + (segment.to.x - segment.from.x) * fraction,
            segment.from.y + (segment.to.y - segment.from.y) * fraction,
          );
          const sign = pick(point, false);
          if (sign) touched.add(sign);
        }
      }
    }
    pointerSegments = [];
    updatePointer(now);
    for (const sign of touched) {
      if (sign.active) continue;
      // 即使整條滑鼠路徑在同一畫面更新前就走完，每塊被碰到的牌子仍會彈起。
      startSpring(sign, "rise", now);
      sign.releasePending = Boolean(sign.spring);
      if (!sign.spring) release(sign, now);
    }
  }

  function advanceSpring(sign, now) {
    const spring = sign.spring;
    const dt = Math.max(0, (now - spring.lastTime) / 1000);
    spring.lastTime = now;
    const displacement = sign.offset - spring.target;
    const velocity = sign.velocity;
    if (spring.kind === "rise") {
      const log = -Math.log(Math.max(0.0001, config.motion.overshoot - 1));
      const damping = log / Math.sqrt(Math.PI ** 2 + log ** 2);
      const frequency = 6 / (damping * config.motion.liftMs / 1000);
      const oscillation = frequency * Math.sqrt(1 - damping ** 2);
      const decay = Math.exp(-damping * frequency * dt);
      const a = displacement;
      const b = (velocity + damping * frequency * a) / oscillation;
      const cos = Math.cos(oscillation * dt);
      const sin = Math.sin(oscillation * dt);
      const value = a * cos + b * sin;
      sign.offset = spring.target + decay * value;
      sign.velocity = decay * (-damping * frequency * value + oscillation * (-a * sin + b * cos));
    } else {
      // 復位採用不反覆彈跳的阻尼，快速但連續地接住上一段速度。
      const frequency = 9 / (config.motion.returnMs / 1000);
      const b = velocity + frequency * displacement;
      const decay = Math.exp(-frequency * dt);
      sign.offset = spring.target + (displacement + b * dt) * decay;
      sign.velocity = (velocity - frequency * b * dt) * decay;
    }
    // 保留頂端安全距離，也避免復位後沉到草地以下。
    const ceiling = -sign.lift * config.motion.overshoot;
    if (sign.offset < ceiling) { sign.offset = ceiling; sign.velocity = Math.max(0, sign.velocity); }
    if (sign.offset > 0) { stopMotion(sign); return; }
    draw(sign);
    if (sign.releasePending && !sign.active && sign.offset <= -sign.lift * config.motion.minimumPopRatio) {
      sign.releasePending = false;
      startSpring(sign, "return", now);
    } else if (Math.abs(sign.offset - spring.target) * stage.scale <= config.motion.settlePixels && Math.abs(sign.velocity) * stage.scale <= config.motion.settleSpeed) {
      stopMotion(sign, spring.target);
    }
  }

  function tick(now) {
    frame = 0;
    if (!onHome || document.hidden) return;
    processPointerPath(now);
    for (const sign of signs) {
      if (sign.spring) advanceSpring(sign, now);
    }
    const furMoving = fur.step(now);
    const dialogsMoving=homeIntroductions.step(now,signs);
    if (dialogsMoving || furMoving || signs.some((sign) => sign.spring)) schedule();
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(tick); }

  function currentRoute() {
    return portablePreview ? (location.hash.slice(1) || "/") : location.pathname;
  }

  function renderRoute(route) {
    // 舊書籤仍能看到首頁簡介；全站已沒有獨立 About 入口。
    if (route === '/about') route = '/';
    if (renderedRoute === route) return;
    renderedRoute = route;
    const wasHome = onHome;
    onHome = !routes[route];
    document.getElementById('home-link').hidden=onHome;
    homeViewport.hidden = !onHome;
    scene.hidden = !onHome;
    const isIP = route === "/ip";
    const isIllustration = route === "/illustration";
    const isMaterials = route === "/materials";
    portfolio.hidden = onHome || isIP || isIllustration || isMaterials;
    materialsViewport.hidden = !isMaterials;
    materialsPage.setVisible(isMaterials);
    illustrationViewport.hidden = !isIllustration;
    ipViewport.hidden = !isIP;
    illustrationPage.setVisible(isIllustration);
    document.getElementById("contact-content").hidden = route !== "/contact";
    ip.setVisible(isIP);
    ipPortfolio.setVisible(isIP, isIP ? ip.initialize() : null);
    document.title = onHome ? "個人作品集" : routes[route];
    if (onHome && !wasHome) window.scrollTo({top:0,behavior:'instant'});
    homeTouchStart = null;
    if (!onHome) {
      portfolio.setAttribute("aria-label", routes[route]);
      hovered = null;
      pointer = null;
      lastInput = null;
      pointerSegments = [];
      fur.reset();
      homeIntroductions.reset();
      for (const sign of signs) {
        sign.focused = false;
        sign.active = false;
        sign.element.dataset.active = "false";
        stopMotion(sign);
      }
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else if (ready) {
      updateGeometry();
      prepareHomeArtwork();
      updatePointer();
      schedule();
    }
  }

  function navigate(route) {
    if (route.startsWith("#")) route = route.slice(1) || "/";
    if ((!routes[route] && route!=="/") || route===renderedRoute) return;
    if (portablePreview) {
      const target=new URL(location.href);target.hash=route==='/' ? '' : route;
      history.pushState({},'',target.href);
    } else history.pushState({},'',route);
    renderRoute(route);
    const target=route==='/' ? homeViewport : route==='/ip' ? ipViewport : route==='/illustration' ? illustrationViewport : route==='/materials' ? materialsViewport : portfolio;
    const previous=target.getAttribute('tabindex');target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    if(previous===null && document.activeElement===target) target.addEventListener('blur',()=>target.removeAttribute('tabindex'),{once:true});
    else if(previous===null) target.removeAttribute('tabindex');
    else target.setAttribute('tabindex',previous);
  }
  function keyboardSpace(event) {
    if (event.key===' ' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault(); event.currentTarget.click();
    }
  }
  document.getElementById('home-link').addEventListener('keydown',keyboardSpace);

  for (const sign of signs) {
    sign.element.addEventListener("keydown",keyboardSpace);
    sign.element.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(sign.element.getAttribute("href"));
    });
    sign.element.addEventListener("focus", () => {
      sign.focused = sign.element.matches(":focus-visible");
      syncActive();
    });
    sign.element.addEventListener("blur", () => { sign.focused = false; syncActive(); });
  }

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || !onHome) return;
    refreshHomeBounds();
    const samples = event.getCoalescedEvents?.() || [];
    for (const sample of samples.length ? samples : [event]) {
      const point = { x: sample.clientX, y: sample.clientY };
      pointerSegments.push({ from: lastInput || point, to: point });
      lastInput = point;
      pointer = point;
      fur.move(point.x, point.y, sample.timeStamp);
    }
    schedule();
  }, { passive: true });

  function leave() {
    if (pointerSegments.length && ready && onHome) processPointerPath(performance.now());
    pointer = null;
    lastInput = null;
    hovered = null;
    fur.leave();
    syncActive();
  }
  document.documentElement.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      leave();
      fur.reset();
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    } else if (onHome && ready) schedule();
  });
  document.addEventListener("pointercancel", leave);

  // 正常點擊與輕觸均在同一分頁導頁；不加入手機專用動畫或排版。
  document.addEventListener("click", (event) => {
    if (!event.isTrusted || event.detail === 0 || event.button !== 0 || event.target.closest(".sign, .home-profile")) return;
    if (pointerSegments.length) processPointerPath(performance.now());
    const sign = pick(worldPoint(event.clientX, event.clientY));
    if (sign) navigate(sign.element.getAttribute("href"));
  });

  function refreshHomeBounds() {
    if (!onHome || !stage.bounds) return;
    const bounds = scene.getBoundingClientRect();
    if (Math.abs(bounds.x-stage.bounds.x) < .01 && Math.abs(bounds.y-stage.bounds.y) < .01) return;
    stage.bounds = bounds; fur.relocate(bounds);
    pointerSegments = []; lastInput = null;
  }
  // 只有未拖動的有效輕點才導頁；不接管滾輪或單指拖曳。
  homeViewport.addEventListener('pointerdown',event=>{
    if (onHome && event.pointerType==='touch' && event.isPrimary) homeTouchStart={id:event.pointerId,x:event.clientX,y:event.clientY};
    else homeTouchStart=null;
  },{passive:true});
  document.addEventListener('pointerup',event=>{
    const start=homeTouchStart; homeTouchStart=null;
    if (!start || event.pointerId!==start.id || !onHome || Math.hypot(event.clientX-start.x,event.clientY-start.y)>12) return;
    const sign=pick(worldPoint(event.clientX,event.clientY),false);
    if (sign) {
      homeTouchActivatedAt=performance.now();
      navigate(sign.element.getAttribute('href'));
    }
  },{passive:true});
  document.addEventListener('pointercancel',()=>{homeTouchStart=null;},{passive:true});
  homeViewport.addEventListener('touchend',event=>{
    if(performance.now()-homeTouchActivatedAt<500) event.preventDefault();
  },{passive:false});
  window.addEventListener("resize",()=>{updateGeometry();updatePointer();});
  function restoreHistoryRoute() {
    renderRoute(currentRoute());
  }
  window.addEventListener("popstate",restoreHistoryRoute);
  window.addEventListener("hashchange",()=>{if(portablePreview) restoreHistoryRoute();});
  reduceMotion.addEventListener("change",()=>{
    fur.reset();
    for(const sign of signs) stopMotion(sign);
    if(!reduceMotion.matches) for(const sign of signs) if(sign.active) startSpring(sign,"rise");
    updatePointer();
    if (onHome) schedule();
  });
  desktopPointer.addEventListener("change", leave);

  function ensureFur() {
    if (!furInitialization) furInitialization = fur.initialize().catch(error => {
      document.getElementById('fur-layer').dataset.ready = 'error';
      console.error('毛流準備失敗', error);
    });
    return furInitialization;
  }

  function warmIP() { return ip.initialize().catch(()=>{}); }
  function scheduleIPWarm() {
    if(navigator.connection?.saveData) return;
    const prepare=()=>{if(onHome && !document.hidden) warmIP();};
    if('requestIdleCallback' in window) requestIdleCallback(prepare,{timeout:500});
    else setTimeout(prepare,150);
  }

  function prepareHomeArtwork() {
    if (!homeArtworkPreparation) homeArtworkPreparation=(async()=>{
      const artwork=['sky-art','ground-art','shadow-art'].map(id=>loadImage(document.getElementById(id).href.baseVal));
      await Promise.allSettled([...artwork,homePaintReady,ensureFur(),homeIntroductions.preload()]);
      // SVG、遮罩和對話框都已解碼；同一格解除隱藏，沒有漸進補圖。
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      homeViewport.dataset.paintReady='true';
      window.finishHomePaint?.();
      scheduleIPWarm();
      if(onHome) { updateGeometry();updatePointer();schedule(); }
    })();
    return homeArtworkPreparation;
  }

  async function initialize() {
    updateGeometry();
    if (onHome) prepareHomeArtwork();
    const ground = () => groundInitialization || (groundInitialization = backgroundDataUrl());
    await Promise.all(signs.map(async (sign) => {
      const crop = sign.art.viewBox.baseVal;
      const image = await loadImage(sign.art.querySelector("image").href.baseVal);
      sign.alpha = alphaMap(image, Math.round(crop.width), Math.round(crop.height), crop);
      sign.mask = await prepareMask(sign, ground);
    }));
    // 讓新遮罩完成首次呈現，避免第一下撫動前後才補畫地面。
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    ready = true;
    scene.dataset.ready = "true";
    resolveHomePaint();
    if (onHome) { updateGeometry(); updatePointer(); schedule(); }
  }

  renderRoute(currentRoute());
  initialize().catch((error) => {
    scene.dataset.ready = "error";
    resolveHomePaint();
    window.finishHomePaint?.();
    console.error("首頁互動初始化失敗", error);
  });
})();
