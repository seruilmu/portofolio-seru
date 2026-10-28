import {SHAPE_NAMES,createShapeTargets,sceneAt,blendPoint} from './particle-shapes.mjs';
// Original scroll-driven particle choreography, rendered locally.
(() => {
  'use strict';
  const canvas=document.getElementById('motion-canvas');
  const control=document.querySelector('[data-motion-toggle]');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow=window.matchMedia('(max-width: 700px)');
  const finePointer=window.matchMedia('(hover: hover) and (pointer: fine)');
  const root=document.documentElement;
  let storedPause=false;
  try{storedPause=localStorage.getItem('seru-motion-paused')==='true';}catch{}
  let paused=reduced.matches||storedPause;
  let frame=0,clock=0,previous=0,lastDraw=0,width=0,height=0;
  let currentScroll=window.scrollY,targetScroll=window.scrollY;
  let count=0,targets=[],points=[],anchors=[],sceneShapes=[];
  const sections=[...document.querySelectorAll('main > section,.client-section,.site-footer')];
  const ctx=canvas?.getContext('2d',{alpha:true});
  const point=new Float32Array(3);
  const palette=[[112,202,255],[161,145,250],[99,216,232],[147,158,255],[119,205,250]];
  const centers=[[.765,.45,1],[.77,.49,1.06],[.75,.46,.97],[.79,.5,1.03],[.67,.49,.87]];

  function updateAnchors(){
    anchors=sections.map((section,i)=>i===0?0:Math.max(0,section.getBoundingClientRect().top+window.scrollY-height*.48));
    for(let i=1;i<anchors.length;i++)anchors[i]=Math.max(anchors[i],anchors[i-1]+1);
    sceneShapes=sections.map((section,i)=>{
      const shape=Math.min(i,SHAPE_NAMES.length-1);
      section.dataset.motionShape=SHAPE_NAMES[shape];
      return shape;
    });
  }
  function resize(){
    if(!ctx)return;
    width=window.innerWidth;height=window.innerHeight;
    const ratio=Math.min(window.devicePixelRatio||1,narrow.matches?1.25:1.6);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
    count=narrow.matches?850:2300;
    targets=createShapeTargets(count);
    points=Array.from({length:count},()=>({x:0,y:0,z:0,r:0,alpha:0}));
    updateAnchors();draw();
  }
  function draw(){
    if(!ctx)return;
    ctx.clearRect(0,0,width,height);
    const scene=sceneAt(currentScroll,anchors);
    const a=sceneShapes[scene.a]??0,b=sceneShapes[scene.b]??a,t=scene.t;
    const shape=SHAPE_NAMES[t<.5?a:b];
    canvas.dataset.shape=shape;
    canvas.dataset.morph=SHAPE_NAMES[a]+'→'+SHAPE_NAMES[b];
    const blend=(list,index)=>list[a][index]+(list[b][index]-list[a][index])*t;
    const mobile=narrow.matches;
    const radius=Math.min(width*(mobile ? .68 : .275),height*(mobile ? .34 : .48))*blend(centers,2);
    const cx=width*(mobile ? .63 : blend(centers,0));
    const cy=height*(mobile ? .57 : blend(centers,1));
    const yaw=.30+Math.sin(clock*.12)*.35;
    const pitch=-.16+Math.sin(clock*.10)*.12;
    const cosY=Math.cos(yaw),sinY=Math.sin(yaw),cosX=Math.cos(pitch),sinX=Math.sin(pitch);
    const red=Math.round(blend(palette,0)),green=Math.round(blend(palette,1)),blue=Math.round(blend(palette,2));
    for(let i=0;i<count;i++){
      blendPoint(targets,a,b,i,t,point);
      const xx=point[0]*cosY-point[2]*sinY,zz=point[0]*sinY+point[2]*cosY;
      const yy=point[1]*cosX-zz*sinX,z=point[1]*sinX+zz*cosX;
      const perspective=3.8/(3.8-z);
      const lean=-.12;
      const p=points[i];
      p.x=cx+(xx*Math.cos(lean)-yy*Math.sin(lean))*radius*perspective;
      p.y=cy+(xx*Math.sin(lean)+yy*Math.cos(lean))*radius*perspective;
      p.z=z;p.r=(i%11===0?1.4:.85)*perspective;
      p.alpha=(.20+(z+1)*.23)*(mobile ? .68 : 1);
    }
    points.sort((left,right)=>left.z-right.z);
    for(const p of points){
      ctx.fillStyle='rgba('+red+','+green+','+blue+','+Math.min(.8,p.alpha).toFixed(3)+')';
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    }
  }
  function canAnimate(){return !!ctx&&!paused&&!document.hidden&&!document.body.classList.contains('dialog-open');}
  function tick(now){
    frame=0;
    if(!canAnimate()){previous=0;return;}
    const dt=previous?Math.min((now-previous)/1000,.05):1/60;
    previous=now;clock+=dt;
    currentScroll+=(targetScroll-currentScroll)*(1-Math.exp(-dt*12));
    if(Math.abs(targetScroll-currentScroll)<.15)currentScroll=targetScroll;
    if(now-lastDraw>=1000/30){draw();lastDraw=now;}
    frame=requestAnimationFrame(tick);
  }
  function schedule(){
    if(!canAnimate()){
      if(frame)cancelAnimationFrame(frame);
      frame=0;previous=0;return;
    }
    if(!frame)frame=requestAnimationFrame(tick);
  }
  function syncState(){
    root.classList.toggle('motion-paused',paused);
    document.body.dataset.motion=paused?'paused':'playing';
    if(control){
      control.hidden=false;control.setAttribute('aria-pressed',String(paused));
      control.setAttribute('aria-label',paused?'Putar animasi latar':'Jeda animasi latar');
      control.querySelector('span').textContent=paused?'Putar gerak':'Jeda gerak';
    }
    targetScroll=window.scrollY;schedule();
  }
  control?.addEventListener('click',()=>{
    paused=!paused;storedPause=paused;
    try{localStorage.setItem('seru-motion-paused',String(paused));}catch{}
    syncState();
  });
  reduced.addEventListener('change',()=>{paused=reduced.matches||storedPause;syncState();});
  document.addEventListener('visibilitychange',schedule);
  window.addEventListener('scroll',()=>{targetScroll=window.scrollY;schedule();},{passive:true});
  let resizeFrame=0;
  window.addEventListener('resize',()=>{
    if(resizeFrame)cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resize();schedule();});
  },{passive:true});
  if('ResizeObserver' in window){const observer=new ResizeObserver(updateAnchors);const main=document.querySelector('main');if(main)observer.observe(main);}
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  document.fonts?.ready.then(()=>{updateAnchors();if(paused)draw();});
  resize();syncState();

  // Pointer movement is confined to the artwork, never the text or navigation.
  document.querySelectorAll('[data-tilt]').forEach(art=>{
    art.addEventListener('pointermove',e=>{
      if(paused||!finePointer.matches)return;
      const r=art.getBoundingClientRect();
      const x=(e.clientX-r.left)/r.width-.5;
      const y=(e.clientY-r.top)/r.height-.5;
      art.style.setProperty('--tilt-x',`${(-y*5).toFixed(2)}deg`);
      art.style.setProperty('--tilt-y',`${(x*7).toFixed(2)}deg`);
    },{passive:true});
    art.addEventListener('pointerleave',()=>{
      art.style.setProperty('--tilt-x','0deg');art.style.setProperty('--tilt-y','0deg');
    });
  });

  // Progressive enhancement: all content remains visible without this script.
  if('IntersectionObserver' in window && !reduced.matches){
    const targets=document.querySelectorAll('.section-heading,.service-row,.service-card,.website-project,.process-grid>li,.curriculum>article,.editorial-grid>div,.program-layout>div,.about-opening,.contact-context,.brief-form,.about-links a,.footer-top>div,.page-hero>div');
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}
    },{threshold:.06,rootMargin:'0px 0px -20px 0px'});
    targets.forEach((el,i)=>{
      el.setAttribute('data-reveal','');
      el.style.setProperty('--reveal-delay',`${(i%3)*65}ms`);
      observer.observe(el);
    });
    root.classList.add('reveal-ready');
  }
})();
