/* 本機檔案／不支援離線快取時照常運作；不顯示新增介面或強制重整。 */
(() => {
  if (!('serviceWorker' in navigator) || !['https:', 'http:'].includes(location.protocol)) return;
  const register = () => {
    navigator.serviceWorker.register('service-worker.js', {scope:'./', updateViaCache:'none'}).catch(() => {});
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, {once:true});
})();
