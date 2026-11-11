/* 首頁原創對話框：取牌子相同的運動軌跡，僅延後少量時間。 */
"use strict";
window.createHomeIntroductions = ({layer,viewport,profile,settings,reduceMotion,onReady}) => {
  const svgNS='http://www.w3.org/2000/svg';
  const source=path=>window.portfolioEmbeddedAssets?.[path] || path;
  let geometry=null;
  const cards=settings.cards.map(config=>{
    const panel=document.createElement('aside');panel.className=`home-dialog home-dialog--${config.name}`;
    panel.dataset.homeDialog=config.name;panel.setAttribute('aria-hidden','true');
    const frame=document.createElementNS(svgNS,'svg');frame.classList.add('home-dialog__frame');
    frame.setAttribute('viewBox','115 148 1832 1845');frame.setAttribute('aria-hidden','true');
    const background=document.createElementNS(svgNS,'image');background.setAttribute('width','2048');background.setAttribute('height','2048');frame.append(background);
    const content=document.createElement('div');content.className='home-dialog__content';
    const copy=document.createElement('p');copy.className='home-dialog__copy';copy.id=`home-introduction-${config.name}`;copy.textContent=config.text;
    const image=new Image();image.className='home-dialog__image';image.alt=config.imageAlt;image.decoding='async';image.draggable=false;
    content.append(copy,image);panel.append(frame,content);layer.append(panel);
    return {config,panel,background,image,samples:[{time:0,offset:0}],loaded:false,loading:null,baseX:0,baseY:0,width:0,height:0};
  });
  let frameLoading;
  function prepareFrame() {
    if (!frameLoading) {
      const image = new Image(); image.src = source(settings.frame);
      frameLoading = image.decode().then(() => image).catch(error => { frameLoading=null; throw error; });
    }
    return frameLoading;
  }
  function ensure(card) {
    const required=Math.ceil(Math.max(1,card.width)*.83*devicePixelRatio*1.25);
    const variant=card.config.variants?.find(v=>v.width>=required);
    const target=source(variant?.src || card.config.image);
    if(card.loaded && card.loadedSource===target) return Promise.resolve();
    if(card.loading) return card.loading;
    card.loading=(async()=>{
      const candidate = new Image(); candidate.decoding='async';
      // 依顯示大小與螢幕像素密度挑足夠清晰的小圖，完整原稿仍保留。
      candidate.src=target;
      await Promise.all([candidate.decode(),prepareFrame()]);
      card.background.setAttribute('href',source(settings.frame));
      card.image.src=candidate.src;
      await card.image.decode();
      card.loaded=true;card.loadedSource=target;card.panel.dataset.loaded='true';onReady?.();
    })().catch(()=>{card.panel.dataset.loaded='error';}).finally(()=>{card.loading=null;});
    return card.loading;
  }
  function preload() { return Promise.all(cards.map(ensure)); }
  function artworkEdges(sign,stage,view) {
    if(!sign.alpha) {
      const rect=sign.art.getBoundingClientRect();
      return {left:rect.left-view.left,right:rect.right-view.left};
    }
    // 透明四角不計入間距：每一橫列只取真正有筆觸的兩端，結果依角度快取。
    if(sign.dialogEdges?.angle!==sign.angle) {
      const map=sign.alpha,cos=Math.cos(sign.angle),sin=Math.sin(sign.angle);
      const ratio=sign.height/sign.width;let left=Infinity,right=-Infinity;
      for(let y=0;y<map.height;y++) {
        let first=0,last=map.width-1;
        while(first<=last && map.alpha[y*map.width+first]<128) first++;
        while(last>=first && map.alpha[y*map.width+last]<128) last--;
        if(first>last) continue;
        for(const x of [first,last]) {
          const value=((x+.5)/map.width-.5)*cos-((y+.5)/map.height-.5)*ratio*sin;
          left=Math.min(left,value);right=Math.max(right,value);
        }
      }
      sign.dialogEdges={angle:sign.angle,left,right};
    }
    return {left:stage.bounds.left-view.left+(sign.x+sign.dialogEdges.left*sign.width)*stage.scale,
      right:stage.bounds.left-view.left+(sign.x+sign.dialogEdges.right*sign.width)*stage.scale};
  }
  function resize(stage,signs) {
    const view=viewport.getBoundingClientRect();geometry={...stage,view};
    const portrait=profile.getBoundingClientRect();
    for(const card of cards) {
      const [x,y,width]=card.config.box;
      card.width=Math.min(Math.max(width*stage.bounds.width,220),view.width-24,view.height*.72);
      card.height=card.width*1832/1845;
      card.baseX=Math.max(12,Math.min(stage.bounds.left-view.left+x*stage.bounds.width,view.width-card.width-12));
      card.baseY=stage.bounds.top-view.top+y*stage.bounds.height;
      if(view.width<=600) card.baseY=Math.max(stage.bounds.bottom-view.top+12,portrait.bottom-view.top+16);
      const sign=signs.find(sign=>sign.name===card.config.name);
      sign.element.setAttribute('aria-describedby',`home-introduction-${card.config.name}`);
    }
    // 材料科學維持原位，其可見邊緣間距是另外兩張的定位基準。
    const reference=cards.find(card=>card.config.name==='materials');
    const referenceSign=signs.find(sign=>sign.name==='materials');
    const referenceRect=artworkEdges(referenceSign,stage,view);
    const gap=Math.max(8,referenceRect.left-reference.baseX-reference.width);
    for(const card of cards) {
      if(view.width>600 && card.config.name!=='materials') {
        const sign=signs.find(sign=>sign.name===card.config.name);
        const right=artworkEdges(sign,stage,view).right;
        const available=view.width-12-right-gap;
        if(available>=180) {
          card.width=Math.min(card.width,available);
          card.baseX=right+gap;
          card.height=card.width*1832/1845;
        } else {
          // 狹長直式畫面空間不足時沿用下方位置，不把框擠回牌子上。
          card.baseY=Math.max(stage.bounds.bottom-view.top+12,portrait.bottom-view.top+16);
        }
      }
      if(card.config.name==='ip'||card.config.name==='illustration') {
        const sign=signs.find(sign=>sign.name===card.config.name);
        const right=artworkEdges(sign,stage,view).right;
        const bodyCenter=stage.bounds.top-view.top+(sign.y+sign.height*(sign.name==='ip'?.22:.16))*stage.scale+(sign.mobileDrop||0);
        if(view.width>600 && view.width-right-24>=180) {
          card.baseX=right+12;
          card.width=Math.min(card.width,view.width-card.baseX-12);
          card.height=card.width*1832/1845;
          card.baseY=bodyCenter-card.height*.5;
        } else {
          const center=stage.bounds.left-view.left+sign.x*stage.scale;
          card.baseX=Math.max(12,Math.min(center-card.width/2,view.width-card.width-12));
          card.baseY=stage.bounds.top-view.top+(sign.y+sign.height*.5)*stage.scale+(sign.mobileDrop||0)+12;
        }
      }
      Object.assign(card.panel.style,{left:`${card.baseX}px`,width:`${card.width}px`});
      card.panel.style.setProperty('--dialog-font-size',`${Math.max(14,card.width*.077)}px`);
      if(card.loaded) ensure(card);
    }
  }

  function step(now,signs) {
    if(!geometry) return false;
    let moving=false;
    for(const card of cards) {
      const sign=signs.find(sign=>sign.name===card.config.name);
      if(sign.active || sign.offset<-.01) ensure(card);
      const sample={time:now,offset:sign.offset};
      if(card.samples.at(-1).time===now) card.samples[card.samples.length-1]=sample;
      else card.samples.push(sample);
      const time=now-settings.delayMs;
      while(card.samples.length>2 && card.samples[1].time<=time) card.samples.shift();
      const a=card.samples[0],b=card.samples[1] || a;
      const progress=b.time===a.time ? 1 : Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));
      const offset=reduceMotion.matches ? 0 : a.offset+(b.offset-a.offset)*progress;
      const opacity=reduceMotion.matches ? Number(sign.active) : Math.min(1,Math.max(0,-offset/Math.max(1,sign.lift)*4));
      const shown=opacity>.001 && card.loaded;
      card.panel.style.opacity=String(opacity);card.panel.style.visibility=shown?'visible':'hidden';
      card.panel.setAttribute('aria-hidden',String(!shown));
      const rise=(card.config.name==='ip'||card.config.name==='illustration') ? (reduceMotion.matches?0:12*(1-Math.min(1,Math.max(0,-offset/Math.max(1,sign.lift))))) : offset*geometry.scale;
      const top=Math.max(12,Math.min(card.baseY+rise,geometry.view.height-card.height-12));
      card.panel.style.top='0px';card.panel.style.transform=`translate3d(0,${top}px,0)`;
      if(!reduceMotion.matches && Math.abs(offset-sign.offset)*geometry.scale>.015) moving=true;
    }
    return moving;
  }
  function reset() {
    for(const card of cards) {
      card.samples=[{time:0,offset:0}];card.panel.style.opacity='0';card.panel.style.visibility='hidden';card.panel.setAttribute('aria-hidden','true');
    }
  }
  return {resize,step,reset,preload};
};
