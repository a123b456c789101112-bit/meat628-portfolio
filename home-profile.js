/* 首頁姓名區下方的聯絡圖示定位；頭貼與其點擊動畫已移除。 */
(() => {
  'use strict';
  const home=document.getElementById('home-viewport');
  const profile=document.querySelector('.home-profile');
  const identity=profile.querySelector('.home-profile__identity');
  const contact=document.querySelector('.home-social');
  const landscape=document.querySelector('.home-landscape');
  // 沿用原生社群與寄信連結行為，點擊不穿透至草地。
  for(const control of contact.querySelectorAll('.home-social__link')) {
    for(const type of ['pointerdown','pointerup','click']) control.addEventListener(type,event=>event.stopPropagation());
  }
  function placeContact() {
    if(home.hidden)return;
    const box=profile.getBoundingClientRect(), name=identity.getBoundingClientRect(), scene=landscape.getBoundingClientRect();
    const gap=innerWidth<=600 ? 14 : 18;
    const mobile=innerWidth<=600;
    Object.assign(contact.style,{left:`${name.left-scene.left}px`,top:`${(mobile?name.bottom:box.bottom)-scene.top+gap}px`,width:mobile?`${name.width}px`:'',gap:mobile?'0':'',justifyContent:mobile?'space-between':''});
  }
  new ResizeObserver(placeContact).observe(profile);
  new MutationObserver(()=>{if(!home.hidden)placeContact();}).observe(home,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('resize',placeContact,{passive:true});
  placeContact();
})();
