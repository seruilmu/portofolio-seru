(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded','false');
    menuButton?.setAttribute('aria-label','Buka menu');
  };
  menuButton?.addEventListener('click',() => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'Tutup menu':'Buka menu');
    nav.classList.toggle('is-open',open);
  });
  nav?.addEventListener('click',e=>{ if(e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
  const mobileMedia=window.matchMedia('(max-width:980px)');
  mobileMedia.addEventListener('change',closeMenu);

  const dialog=document.getElementById('video-dialog');
  let lastTrigger;
  function openVideo(trigger){
    const id=trigger.dataset.video;
    if(!/^[\w-]{11}$/.test(id||'') || !dialog) return;
    closeMenu();
    lastTrigger=trigger;
    const title=trigger.dataset.title||'Karya Seru Digital';
    document.getElementById('video-dialog-title').textContent=title;
    const iframe=document.createElement('iframe');
    iframe.title=`Video ${title} — Seru Digital`;
    iframe.src=`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    iframe.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy='strict-origin-when-cross-origin';
    iframe.allowFullscreen=true;
    dialog.querySelector('.video-frame').replaceChildren(iframe);
    document.getElementById('video-external').href=`https://www.youtube.com/watch?v=${id}`;
    dialog.showModal();
    document.body.classList.add('dialog-open');
  }
  function cleanVideo(){
    dialog?.querySelector('.video-frame').replaceChildren();
    document.body.classList.remove('dialog-open');
    if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});
  }
  dialog?.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('close',cleanVideo);
  dialog?.addEventListener('click',e=>{
    if(e.target!==dialog) return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  });
  document.querySelectorAll('[data-video]:not(.deck-card)').forEach(trigger=>trigger.addEventListener('click',()=>openVideo(trigger)));

  document.querySelectorAll('[data-deck]').forEach(deck=>{
    const cards=[...deck.querySelectorAll('.deck-card')];
    const stage=deck.querySelector('.deck-stage');
    const number=deck.querySelector('.deck-counter strong');
    const currentTitle=deck.querySelector('.deck-current');
    let current=0;
    let down=null;
    let ignoreClick=false;
    function render(){
      cards.forEach((card,i)=>{
        let distance=i-current;
        if(cards.length>2){
          if(distance>cards.length/2)distance-=cards.length;
          if(distance<-cards.length/2)distance+=cards.length;
        }
        const selected=distance===0;
        const visible=Math.abs(distance)<=1;
        card.classList.toggle('is-current',selected);
        card.tabIndex=selected?0:-1;
        card.setAttribute('aria-hidden',String(!selected));
        card.style.transform=`translate(calc(-50% + ${distance*82}%), -50%) scale(${selected?1:.84}) rotate(${distance*3}deg)`;
        card.style.opacity=selected?'1':visible?'.45':'0';
        card.style.zIndex=selected?'4':visible?'2':'0';
        card.style.pointerEvents=visible?'auto':'none';
      });
      number.textContent=String(current+1).padStart(2,'0');
      currentTitle.textContent=cards[current].dataset.title;
    }
    function move(delta){current=(current+delta+cards.length)%cards.length;render();}
    deck.querySelector('.deck-prev').addEventListener('click',()=>move(-1));
    deck.querySelector('.deck-next').addEventListener('click',()=>move(1));
    deck.addEventListener('keydown',e=>{
      if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
        e.preventDefault();move(e.key==='ArrowRight'?1:-1);
        cards[current].focus({preventScroll:true});
      }
    });
    cards.forEach((card,i)=>card.addEventListener('click',()=>{
      if(ignoreClick){ignoreClick=false;return;}
      if(i!==current){current=i;render();return;}
      openVideo(card);
    }));
    stage.addEventListener('pointerdown',e=>{if(e.isPrimary)down={x:e.clientX,y:e.clientY};});
    stage.addEventListener('pointerup',e=>{
      if(!down)return;
      const dx=e.clientX-down.x,dy=e.clientY-down.y;down=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4&&cards.length>1){
        ignoreClick=true;move(dx<0?1:-1);
        window.setTimeout(()=>{ignoreClick=false;},0);
      }
    });
    stage.addEventListener('pointercancel',()=>{down=null;});
    stage.addEventListener('dragstart',e=>e.preventDefault());
    render();
  });

  const tabs=[...document.querySelectorAll('[data-program]')];
  function activateTab(tab){
    tabs.forEach(item=>{
      const active=item===tab;
      item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;
      document.getElementById(item.getAttribute('aria-controls')).hidden=!active;
    });
  }
  tabs.forEach((tab,i)=>{
    tab.addEventListener('click',()=>activateTab(tab));
    tab.addEventListener('keydown',e=>{
      let next;
      if(e.key==='ArrowRight'||e.key==='ArrowLeft')next=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      if(e.key==='Home')next=0;
      if(e.key==='End')next=tabs.length-1;
      if(next!==undefined){e.preventDefault();activateTab(tabs[next]);tabs[next].focus();}
    });
  });

  const form=document.querySelector('[data-brief]');
  if(form){
    const select=form.querySelector('[name="layanan"]');
    const initial=new URLSearchParams(location.search).get('layanan');
    if(initial&&[...select.options].some(o=>o.value===initial))select.value=initial;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      if(!form.reportValidity())return;
      const data=new FormData(form);
      const nama=String(data.get('nama')||'').trim();
      const brand=String(data.get('brand')||'').trim();
      const layanan=String(data.get('layanan')||'').trim();
      const pesan=String(data.get('pesan')||'').trim();
      if(!nama||!pesan){form.reportValidity();return;}
      const text=`Halo Seru Digital, saya ${nama}${brand?' dari '+brand:''}.\n\nKebutuhan: ${layanan}\n\n${pesan}`;
      window.location.assign(`https://wa.me/6285757305799?text=${encodeURIComponent(text)}`);
    });
  }
})();
