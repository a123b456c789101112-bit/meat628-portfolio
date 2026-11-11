/* 發布建置會填入版本與首屏檔案；只快取本作品集，不碰其他網站資料。 */
const CACHE_PREFIX = 'meat628-portfolio-home-';
const CACHE_NAME = CACHE_PREFIX + 'ee46a8764a5183fc';
const CORE = ["app.js?v=e82fafec265f", "assets/generated/home-dialog/materials-480.webp", "assets/generated/home-dialog/materials-960.webp", "assets/optimized/058a39d3969368eb3e4829151b7b8051e97d648e07dd51801ca43175f75e352a.webp", "assets/optimized/0a7cbb403df68b3c2ef93e5743482c3a580f723b1088bb3848b5e71250c32804.webp", "assets/optimized/0b605ad51f3b0267b3eb613d4afa01bd968c7956af7ca6dccaea301fb1c90267.webp", "assets/optimized/0dd7998a3def085e7eae17bf80828f7b18add6249d6b7342c098cd139e00da1a.webp", "assets/optimized/2c2dd13a71be356db0eb682df826c60ec13fe1ab180cee4f462651473032b6fd.webp", "assets/optimized/3452f6fb436ad7e8e88f091d3efe5e5f145c3a6286ee41187a08c631188653d8.webp", "assets/optimized/404a75e348b5bc5714529e3176b3ce5ecf098c9c23e9842b20729d7329e56b80.webp", "assets/optimized/55226ea59ae0a6cb0b76bf85949ce5a8e42a6e00064e81f4310be7314ea26c1c.webp", "assets/optimized/6764aa57e809f97ed8dcd1bd8ab3abeb00911a07987a2c59cc7eff4f295c3ef3.webp", "assets/optimized/6b3dc41f91b53fefed22f01ca393f1c8d26f756e6f6fb96bbb5b2c01da9298e7.webp", "assets/optimized/84de5ff3eadb3728243943b7d3accf9263ea522ed90b8bc0631f4f7603963e8b.webp", "assets/optimized/914623dd6f760d388a9a5f5110e4043b9d0d7955192029a43a05f92ee2b6e874.webp", "assets/optimized/9f90ed1418f3284a5f4fad5ebd882f2abbdd99961abdb4743f332acd9d38c731.webp", "assets/optimized/bb8816c2a052817d6cf047c01a820725073b05560204e78fb70e6566a8a165c3.webp", "assets/optimized/c1f2b1dc2176b3167707b4fd1b43405a1048dac7d866e720cdbfb23112cd2048.webp", "assets/optimized/c33496f1df52b49048326c5b16d974311d80c65a4058a5d27cf52d882784eb4b.webp", "assets/optimized/c4b2b88b95813f21cc6a501298502a6de409eb89ff87112c162a3939157b78f8.webp", "assets/optimized/c59fc8bcbc95bff0b0df702fd9ab256efdb25e0aedd97533a42f621c66e49c7b.webp", "assets/optimized/d26c4c52095a13806d054ea443637b5f0b31947bb864e0fcd114a4b64cceb00b.webp", "assets/optimized/e973f23daa3c8dba63fded1003da3b9cd7bc5f505b18b9b545417f44c1b043d9.webp", "assets/optimized/ef52352cfb2dc2a32364cc473c145b930a42d0aecf156d05f89c3ff9fc53e8bb.webp", "assets/optimized/fb6a82c02733fdf2472bb6829df9deccbc13807e554a980068740fe20f33ecf9.webp", "assets/optimized/fb9694c743b95bca476851fddd7d3d0e98d9698d5ca3030caac87f0358b32438.webp", "fur.js?v=30cb37f02d8c", "home-introductions.js?v=cbc088e48c18", "home-profile.js?v=d0e2b48a75a6", "illustration-artworks.js?v=2ddc24b0353d", "illustration-page.js?v=bebdff7f353b", "illustrations.js?v=d86ab53ca68f", "index.html", "ip-portfolio.js?v=203f9bacb50b", "ip.js?v=d3e3d7d29b5c", "materials-content.js?v=b6e0c5398235", "materials-page.js?v=2d2200fb9035", "portals.js?v=b76ba4fe6290", "render-cache.js?v=61b1f8095bf0", "settings.js?v=5f8d05cb49b6", "site-cache-register.js?v=c64fdc2e20a9", "startup-cache.js?v=b32bfdc67155", "stickers.js?v=a2c99f3faa65", "styles.css?v=fb35e5052aa8"];
const ROOT = new URL('./', self.location.href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
    try {
      await cache.addAll(CORE.map(path=>new Request(new URL(path, ROOT), {cache:path==='index.html'?'reload':'default'})));
      await self.skipWaiting();
    } catch(error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if (request.mode === 'navigate') {
    // HTML 優先核對伺服器，新版不會被舊快取鎖住；離線時才用最近成功版本。
    event.respondWith(fetch(request, {cache:'no-cache'}).catch(async () => (await caches.open(CACHE_NAME)).match('index.html')));
    return;
  }
  if (!url.pathname.includes('/assets/') && !CORE.some(path => new URL(path, ROOT).href === url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME), cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(cache.put(request, copy).catch(() => {}));
    }
    return response;
  })());
});
