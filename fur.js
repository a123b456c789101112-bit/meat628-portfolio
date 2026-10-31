/* 毛流互動獨立管理；原始向量只做以根部為基準的傾斜，不改路徑、顏色或草地。 */
"use strict";
window.createPortfolioFur = ({ layer, settings, schedule, enabled, interactive, beforeRaster }) => {
  const namespace = "http://www.w3.org/2000/svg";
  const tufts = [];
  const decodedArtwork = [];
  let pointer = null;
  let previous = null;
  let segments = [];
  let lastTime = null;
  let geometry = null;
  let windTimer = 0;
  let windTime = 0;
  const limit = (value, max) => Math.max(-max, Math.min(max, value));

  function svg(tag, attributes) {
    const element = document.createElementNS(namespace, tag);
    for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
    return element;
  }

  function draw(tuft, angle) {
    if (tuft.drawn === angle) return;
    tuft.drawn = angle;
    // 以底部為基準的剪切，越靠近毛尖偏移越多，根部不滑走。
    tuft.motion.setAttribute("transform", angle === 0 ? "" : `translate(0 ${tuft.artHeight}) skewX(${-angle}) translate(0 ${-tuft.artHeight})`);
  }

  function reset() {
    clearTimeout(windTimer);
    windTimer = 0;
    pointer = previous = null;
    segments = [];
    lastTime = null;
    for (const tuft of tufts) {
      tuft.angle = tuft.velocity = tuft.stroke = 0;
      draw(tuft, 0);
    }
  }

  async function initialize() {
    const defs = svg("defs", {}); layer.append(defs);
    const textures = new Map();
    const maxHeight = Math.max(...settings.tufts.map((p) => p.height)) * 1406;
    const pixels = Math.ceil(Math.max(settings.cacheHeight, maxHeight * (geometry?.scale || 1) * devicePixelRatio * 2));
    const signature = window.portfolioSettings.renderCacheRevision + ':' + pixels;
    let snapshots = await window.portfolioRenderCache.get('fur', signature);
    if (!Array.isArray(snapshots) || snapshots.length !== 6 || snapshots.some(s => !/^fur0[12]-[123]$/.test(s.id) || !s.data?.startsWith('data:image/png;base64,') || !(s.w>0 && s.h>0))) snapshots = null;
    layer.dataset.cacheHit = String(!!snapshots);
    if (!snapshots) {
      const response = await fetch(layer.dataset.source);
      if (!response.ok) throw new Error(`毛流讀取失敗：${response.status}`);
      const document = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
      if (document.querySelector("parsererror")) throw new Error("毛流 SVG 格式錯誤");
      const artwork = [...document.documentElement.children];
      // 首次重建快取較耗時：先讓牌子完成互動並顯示一格，再處理這段工作。
      if (beforeRaster) { await beforeRaster(); await new Promise(requestAnimationFrame); }
      snapshots = await Promise.all(artwork.map(async art => {
        if (art.localName !== 'g' || art.querySelector('script,image,foreignObject,use')) throw new Error('不支援的毛流素材內容');
        const w = Number(art.dataset.width), h = Number(art.dataset.height), padding = 1;
        const width = Math.ceil(pixels * (w + padding * 2) / (h + padding * 2));
        const vector = svg('svg', { xmlns: namespace, viewBox: `${-padding} ${-padding} ${w + padding * 2} ${h + padding * 2}`, width, height: pixels, preserveAspectRatio: 'none' });
        vector.append(art.cloneNode(true));
        const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(vector)], { type:'image/svg+xml' }));
        try {
          const original = new Image(); original.src = url; await original.decode();
          const canvas = window.document.createElement('canvas'); canvas.width = width; canvas.height = pixels;
          canvas.getContext('2d').drawImage(original,0,0);
          return { id:art.id, w, h, data:canvas.toDataURL('image/png') };
        } finally { URL.revokeObjectURL(url); }
      }));
      window.portfolioRenderCache.put('fur', signature, snapshots).then(saved => { layer.dataset.cacheSaved = String(saved); });
    }
    // 只把原本已使用的 PNG 顯示快取放進畫面，原向量保持在來源檔案。
    await Promise.all(snapshots.map(async art => {
      const decoded = new Image(); decoded.src = art.data; await decoded.decode(); decodedArtwork.push(decoded);
      const id = `fur-cache-${art.id}`;
      defs.append(svg('image', { id, href:art.data, x:-1, y:-1, width:art.w+2, height:art.h+2, 'data-width':art.w, 'data-height':art.h, preserveAspectRatio:'none' }));
      textures.set(art.id,id);
    }));
    for (const placement of settings.tufts) {
      const art = snapshots.find(element => element.id === placement.artwork);
      if (!art) throw new Error(`找不到毛流：${placement.artwork}`);
      const artWidth = Number(art.w);
      const artHeight = Number(art.h);
      const height = placement.height * 1406;
      const scale = height / artHeight;
      const x = placement.x * 2500;
      const y = placement.y * 1406;
      const rotation = placement.rotation || 0;
      const radians = rotation * Math.PI / 180;
      const group = svg("g", { "data-fur": placement.artwork, "data-rest-rotation": rotation, transform: `translate(${x} ${y}) rotate(${rotation}) scale(${scale}) translate(${-artWidth/2} ${-artHeight})` });
      const motion = svg("g", { class: "fur__motion" });
      motion.append(svg("use", { href: `#${textures.get(placement.artwork)}` }));
      group.append(motion);
      layer.append(group);
      tufts.push({ motion, artHeight, x: x + Math.sin(radians) * height * 0.55, y: y - Math.cos(radians) * height * 0.55, angle: 0, velocity: 0, stroke: 0, drawn: null });
    }
    reset();
    layer.dataset.ready = "true";
    if (enabled()) schedule();
  }

  function resize(stage) {
    geometry = { bounds: stage.bounds, scale: stage.scale };
    reset();
    if (enabled() && tufts.length) schedule();
  }
  function relocate(bounds) {
    if (geometry) geometry.bounds = bounds;
    pointer = previous = null;
    segments = [];
  }

  function move(clientX, clientY, time) {
    if (!enabled() || (interactive && !interactive()) || !geometry || !tufts.length) return;
    const next = {
      x: (clientX - geometry.bounds.x) / geometry.scale,
      y: (clientY - geometry.bounds.y) / geometry.scale,
      time,
    };
    segments.push({ from: previous || next, to: next });
    if (segments.length > 128) segments.shift();
    pointer = previous = next;
    schedule();
  }

  function weight(tuft, point) {
    const distance = Math.hypot(point.x - tuft.x, point.y - tuft.y);
    return Math.max(0, 1 - distance / settings.radius) ** 2;
  }

  function step(now) {
    clearTimeout(windTimer);
    windTimer = 0;
    if (!enabled()) { reset(); return false; }
    if (!geometry || !tufts.length) return false;
    const dt = lastTime === null ? 1 / 60 : Math.max(0, (now - lastTime) / 1000);
    lastTime = now;
    // 微風只改既有顯示快取的傾斜，不重畫原稿；時間在離開首頁時暫停。
    windTime += Math.min(dt, 0.1);
    const breeze = settings.breeze;
    const strokes = new Map();
    for (const { from, to } of segments) {
      const dx = to.x - from.x, dy = to.y - from.y;
      const lengthSquared = dx * dx + dy * dy;
      const speed = dx / Math.max(0.008, (to.time - from.time) / 1000);
      for (const tuft of tufts) {
        const t = lengthSquared ? Math.max(0, Math.min(1, ((tuft.x - from.x) * dx + (tuft.y - from.y) * dy) / lengthSquared)) : 0;
        const near = { x: from.x + dx * t, y: from.y + dy * t };
        const influence = weight(tuft, near);
        if (influence && lengthSquared) {
          const force = limit(speed / settings.brushSpeed, 1) * settings.maxBend * influence;
          const recorded = strokes.get(tuft);
          // 保留同一畫面內最靠近的撫動，不讓離開範圍前的微弱樣本蓋掉整次反應。
          // 中途反向則接續最新方向，再由彈簧保留速度、平順轉向。
          if (recorded === undefined || Math.abs(force) > Math.abs(recorded) || (force && Math.sign(force) !== Math.sign(recorded))) strokes.set(tuft, force);
        }
      }
    }
    segments = [];
    let moving = false;
    for (const tuft of tufts) {
      if (strokes.has(tuft)) tuft.stroke = strokes.get(tuft);
      const proximity = pointer ? weight(tuft, pointer) : 0;
      const positionForce = pointer ? limit((pointer.x - tuft.x) / settings.radius, 1) * settings.maxBend * 0.55 * proximity : 0;
      const target = limit(positionForce + tuft.stroke * 0.85, settings.maxBend);
      // 解析阻尼彈簧，影格速度不會改變回彈規律；中途換方向也保留速度。
      const frequency = settings.frequency, damping = settings.damping;
      const oscillation = frequency * Math.sqrt(1 - damping * damping);
      const decay = Math.exp(-damping * frequency * dt);
      const a = tuft.angle - target;
      const b = (tuft.velocity + damping * frequency * a) / oscillation;
      const cos = Math.cos(oscillation * dt), sin = Math.sin(oscillation * dt);
      const value = a * cos + b * sin;
      tuft.angle = target + decay * value;
      tuft.velocity = decay * (-damping * frequency * value + oscillation * (-a * sin + b * cos));
      if (Math.abs(tuft.angle) > settings.maxBend) {
        tuft.angle = limit(tuft.angle, settings.maxBend);
        tuft.velocity = 0;
      }
      tuft.stroke *= Math.exp(-dt / settings.brushDecay);
      if (Math.abs(tuft.stroke) < settings.settleAngle) tuft.stroke = 0;
      const still = !tuft.stroke && Math.abs(tuft.angle - positionForce) < settings.settleAngle && Math.abs(tuft.velocity) < settings.settleSpeed;
      if (still) { tuft.angle = positionForce; tuft.velocity = 0; }
      else moving = true;
      const x = geometry.bounds.x + tuft.x * geometry.scale;
      const y = geometry.bounds.y + tuft.y * geometry.scale;
      const visible = x > -100 && x < innerWidth + 100 && y > -100 && y < innerHeight + 100;
      if (visible) {
        // 空間相位讓風由左往右掠過，兩個慢波疊加，避免整片同步擺動。
        const phase = windTime * 1.35 - tuft.x / 2500 * 4.8 - tuft.y / 1406 * 1.7;
        const wind = breeze ? breeze.amplitude * (0.75 + 0.25 * Math.sin(windTime * 0.36))
          * (0.45 + 0.4 * Math.sin(phase) + 0.15 * Math.sin(phase * 0.57 + tuft.y / 1406 * 2)) : 0;
        draw(tuft, Math.round(limit(tuft.angle + wind, settings.maxBend) * 100) / 100);
      }
    }
    // 撫動使用原本的即時影格；只有微風時限速，避免讓整個首頁持續跑滿更新頻率。
    if (!moving && breeze) windTimer = setTimeout(() => { windTimer = 0; if (enabled()) schedule(); }, 1000 / breeze.fps);
    else if (!moving) lastTime = null;
    return moving;
  }

  function leave() {
    pointer = previous = null;
    for (const tuft of tufts) tuft.stroke = 0;
    schedule();
  }

  return { initialize, resize, relocate, move, step, leave, reset };
};
