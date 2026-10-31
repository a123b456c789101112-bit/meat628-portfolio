/* 瀏覽器本機快取既有的渲染結果；不可用／額度不足時自動回到原流程。 */
"use strict";
window.portfolioRenderCache = (() => {
  let database;
  function open() {
    if (database) return database;
    database = new Promise(resolve => {
      try {
        const request = indexedDB.open('portfolio-render-cache', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('snapshots');
        request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
        request.onerror = request.onblocked = () => resolve(null);
      } catch { resolve(null); }
    });
    return database;
  }
  async function get(key, signature) {
    const db = await open(); if (!db) return null;
    return new Promise(resolve => {
      try {
        const request = db.transaction('snapshots').objectStore('snapshots').get(key);
        request.onsuccess = () => resolve(request.result?.signature === signature ? request.result.value : null);
        request.onerror = () => resolve(null);
      } catch { resolve(null); }
    });
  }
  async function put(key, signature, value) {
    const db = await open(); if (!db) return false;
    return new Promise(resolve => {
      try {
        const transaction = db.transaction('snapshots', 'readwrite');
        // 固定五個邏輯 key：毛流與四塊地面遮罩；更新時覆蓋舊快取，不無限累積。
        transaction.objectStore('snapshots').put({ signature, value }, key);
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = transaction.onabort = () => resolve(false);
      } catch { resolve(false); }
    });
  }
  return { get, put };
})();
