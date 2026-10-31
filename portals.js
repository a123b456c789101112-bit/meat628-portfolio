/* 傳送門照原稿 2500×1406 排列；原生站內連結與按需載入，圖片微放大不改變外層互動範圍。 */
"use strict";
window.createPortfolioPortals = ({ root, settings, navigate }) => {
  const source = path => window.portfolioEmbeddedAssets?.[path] || path;
  root.style.setProperty('--portal-zoom', settings.zoom);
  root.style.setProperty('--portal-zoom-ms', `${settings.zoomMs}ms`);
  const pending = [];
  const svgNS = 'http://www.w3.org/2000/svg';
  let visible = false, nearby = false, loaded = false;
  const arrows = new Image(); arrows.className = 'portal-arrows'; arrows.alt = '';
  arrows.width = 2500; arrows.height = 1406; arrows.decoding = 'async'; arrows.draggable = false;
  arrows.setAttribute('aria-hidden', 'true'); root.append(arrows); pending.push([arrows, settings.arrows]);
  for (const art of settings.cards) {
    const [x, y, width, height] = art.box;
    const link = document.createElement('a'); link.className = 'portal-link'; link.href = document.documentElement.dataset.routing === 'hash' && art.route.startsWith('/') ? '#' + art.route : art.route;
    link.dataset.portal = art.name; link.setAttribute('aria-label', art.label);
    Object.assign(link.style, { left: `${x / 25}%`, top: `${y / 14.06}%`, width: `${width / 25}%`, height: `${height / 14.06}%` });
    link.style.setProperty('--portal-ratio',`${width} / ${height}`);
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', (art.viewBox || art.box).join(' ')); svg.setAttribute('aria-hidden', 'true');
    const image = document.createElementNS(svgNS, 'image'); image.setAttribute('width', art.canvas?.[0] || 2500); image.setAttribute('height', art.canvas?.[1] || 1406);
    svg.append(image); link.append(svg); root.append(link); pending.push([image, art.src]);
    if (art.name === 'contact') {
      // 箭頭仍用同一原稿，與聯絡我綁在一起，手機改單欄時不會留在舊位置。
      link.append(arrows);
      Object.assign(arrows.style,{left:`${-x/width*100}%`,top:`${-y/height*100}%`,width:`${2500/width*100}%`,height:`${1406/height*100}%`});
    }
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      // 寄信由瀏覽器交給預設郵件程式；不送入站內頁面切換。
      if (art.route.startsWith('mailto:')) return;
      event.preventDefault(); navigate(art.route);
    });
    link.addEventListener('keydown',event=>{
      if(event.key===' ' && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) { event.preventDefault(); link.click(); }
    });
  }
  async function load() {
    if (!visible || !nearby || loaded) return;
    loaded = true;
    try {
      await Promise.all(pending.map(async ([element, path]) => {
        const image = new Image(); image.src = source(path); await image.decode();
        element.setAttribute(element.namespaceURI === svgNS ? 'href' : 'src', image.src);
      }));
      root.dataset.ready = 'true';
    } catch (error) { root.dataset.ready = 'error'; console.error('傳送門素材讀取失敗', error); }
  }
  new IntersectionObserver(entries => { nearby = entries[0].isIntersecting; load(); }, { rootMargin: `${settings.preloadPixels}px 0px` }).observe(root);
  return { setVisible(show) {
    visible = show;
    if (show) {
      const box = root.getBoundingClientRect();
      nearby = box.height > 0 && box.bottom > -settings.preloadPixels && box.top < innerHeight + settings.preloadPixels;
      load();
    }
  } };
};
