/* 材料科學：沿用原站圓圈、配色與傳送門，僅依使用者 Word 內容建立分頁。 */
'use strict';
window.createMaterialsPage = ({root,content,portalSettings,illustrationPortal,reduceMotion,navigate}) => {
  const source=path=>window.portfolioEmbeddedAssets?.[path] || path;
  const tablist=root.querySelector('[role="tablist"]');
  const panels=root.querySelector('.materials-panels');
  const navigation=root.querySelector('.materials-section-nav');
  const svgNS='http://www.w3.org/2000/svg';
  const tabs=[],views=[],images=[];
  let visible=false,selected=0,frame=0;
  const element=(tag,className,text)=>{
    const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;
  };
  function makeFigure(art) {
    const figure=element('figure','materials-figure');figure.style.setProperty('--materials-image-width',`${art.width}px`);
    const link=element('a','materials-figure__link');link.href=source(art.src);link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`查看原尺寸：${art.caption}`);
    const image=new Image();image.width=art.width;image.height=art.height;image.alt=art.caption;image.loading='lazy';image.decoding='async';image.dataset.materialsSource=art.src;
    link.append(image);figure.append(link,element('figcaption','',art.caption));images.push(image);return figure;
  }
  function renderBlock(block) {
    if(block.type==='paragraph')return element('p','',block.text);
    if(block.type==='subheading')return element('h3','',block.text);
    if(block.type==='figure')return makeFigure(block);
    if(block.type==='figures') { const row=element('div','materials-figure-row');block.items.forEach(art=>row.append(makeFigure(art)));return row; }
    if(block.type==='table') {
      const wrap=element('div','materials-table-window');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','研究方法表格');
      const table=element('table','materials-table'),head=element('thead'),body=element('tbody');
      block.rows.forEach((cells,index)=>{
        const row=element('tr');cells.forEach(text=>{const cell=element(index===0?'th':'td','',text);if(index===0)cell.scope='col';row.append(cell);});(index===0?head:body).append(row);
      });table.append(head,body);wrap.append(table);return wrap;
    }
  }
  function makeNav(target,title,label=title) {
    const button=element('button');button.type='button';button.dataset.materialsTarget=target;button.setAttribute('aria-controls',target);button.setAttribute('aria-label',title);
    const circle=document.createElementNS(svgNS,'svg');circle.setAttribute('viewBox','0 0 100 100');circle.classList.add('ink-circle');circle.setAttribute('aria-hidden','true');
    const use=document.createElementNS(svgNS,'use');use.setAttribute('href','#ink-circle');circle.append(use);
    button.append(circle,element('span','',label.replace(/^[一二三四五六七八九十]+、/,'')));
    button.addEventListener('click',()=>document.getElementById(target).scrollIntoView({block:'start',behavior:reduceMotion.matches?'instant':'smooth'}));
    navigation.append(button);return button;
  }
  for(const [index,data] of content.entries()) {
    const tab=element('button','materials-tab',data.label);tab.type='button';tab.id=`materials-tab-${data.id}`;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',`materials-panel-${data.id}`);tabs.push(tab);tablist.append(tab);
    const panel=element('article','materials-panel');panel.id=`materials-panel-${data.id}`;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.tabIndex=0;
    const heading=element('header','materials-heading');heading.append(element('h1','',data.title));
    if(data.subtitle)heading.append(element('p','materials-subtitle',data.subtitle));
    if(data.metadata){const meta=element('div','materials-metadata');data.metadata.forEach(text=>meta.append(element('p','',text)));heading.append(meta);}
    panel.append(heading);const sections=[],buttons=[];
    if(data.services) {
      panel.classList.add('materials-services');
      const grid=element('div','ip-services-grid');
      for(const [serviceIndex,service] of data.services.entries()) {
        const card=element('article','ip-service'),title=element('h3','',service.title),description=element('p');
        title.id=`materials-service-${serviceIndex}-title`;card.setAttribute('aria-labelledby',title.id);
        service.lines.forEach((line,lineIndex)=>{if(lineIndex)description.append(document.createElement('br'));description.append(document.createTextNode(line));});
        card.append(title,description);grid.append(card);
      }
      panel.append(grid);
    }
    for(const part of data.sections) {
      const section=element('section','materials-section');section.id=`materials-${data.id}-${part.id}`;section.setAttribute('aria-labelledby',section.id+'-title');
      const title=element('h2','',part.title);title.id=section.id+'-title';section.append(title);part.blocks.forEach(block=>section.append(renderBlock(block)));panel.append(section);sections.push(section);buttons.push(makeNav(section.id,part.title,part.navLabel));
    }
    panels.append(panel);views.push({panel,sections,buttons});
    tab.addEventListener('click',()=>select(index,true));
    tab.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;
      if(next!==undefined){event.preventDefault();select(next,true);tabs[next].focus();}
    });
  }
  const portalSection=root.querySelector('#materials-portals');
  const portalButton=makeNav(portalSection.id,'傳送門');
  const contact=portalSettings.cards.find(card=>card.name==='contact');
  const ip=portalSettings.cards.find(card=>card.name==='ip');
  const portal=window.createPortfolioPortals({root:root.querySelector('#materials-portal-scene'),navigate,settings:{...portalSettings,cards:[contact,ip,{...illustrationPortal,box:[1808,450,510,627]}]}});
  function hydrate(image) {
    if(!visible||image.closest('[hidden]')||image.dataset.loaded)return;
    const box=image.getBoundingClientRect();if(box.bottom < -350||box.top>innerHeight+350)return;
    image.dataset.loaded='loading';image.src=source(image.dataset.materialsSource);
    image.decode().then(()=>{image.dataset.loaded='true';schedule();}).catch(()=>{image.dataset.loaded='error';});
  }
  const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)hydrate(entry.target);},{rootMargin:'350px 0px'});images.forEach(image=>observer.observe(image));
  function updateNavigation() {
    frame=0;if(!visible)return;
    const tabBounds=root.querySelector('.materials-tabs').getBoundingClientRect();
    const home=document.getElementById('home-link');
    document.documentElement.style.setProperty('--materials-home-top',`${tabBounds.top+(tabBounds.height-home.offsetHeight)/2}px`);
    const view=views[selected],targets=[...view.sections,portalSection],buttons=[...view.buttons,portalButton];
    const line=root.querySelector('.materials-tabs').getBoundingClientRect().bottom+innerHeight*.16;
    let active=0;targets.forEach((section,index)=>{if(section.getBoundingClientRect().top<=line)active=index;});
    buttons.forEach((button,index)=>{if(index===active)button.setAttribute('aria-current','location');else button.removeAttribute('aria-current');});
  }
  function schedule(){if(visible&&!frame)frame=requestAnimationFrame(updateNavigation);}
  function select(index,scroll) {
    selected=index;
    tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;views[i].panel.hidden=i!==index;views[i].buttons.forEach(button=>{button.hidden=i!==index;button.removeAttribute('aria-current');});});
    if(visible&&scroll)window.scrollTo({top:0,behavior:'instant'});
    images.forEach(hydrate);schedule();
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',()=>{if(visible){images.forEach(hydrate);schedule();}},{passive:true});
  select(0,false);
  return {setVisible(show){visible=show;portal.setVisible(show);if(show){window.scrollTo({top:0,behavior:'instant'});images.forEach(hydrate);schedule();}else if(frame){cancelAnimationFrame(frame);frame=0;}}};
};
