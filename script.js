const glow=document.querySelector('.cursor-glow');
window.addEventListener('pointermove',e=>{glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px'});

const cards=document.querySelectorAll('.project-card,.gallery-tile');
const io=new IntersectionObserver(entries=>{
  entries.forEach((entry,i)=>{
    if(entry.isIntersecting){entry.target.animate(
      [{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],
      {duration:750,delay:(i%4)*80,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'}
    );io.unobserve(entry.target)}
  });
},{threshold:.12});
cards.forEach(c=>{c.style.opacity='0';io.observe(c)});

document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const el=document.querySelector(a.getAttribute('href'));
  if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'})}
}));

/* Detect each video's real dimensions so portrait and landscape work keep their native ratio. */
document.querySelectorAll('video').forEach(video=>{
  const applyRatio=()=>{
    if(video.videoWidth && video.videoHeight){
      const ratio=(video.videoWidth/video.videoHeight).toFixed(5);
      const wrapper=video.closest('.media-wrap,.media-tile');
      if(wrapper){
        wrapper.style.setProperty('--media-ratio', ratio);
        wrapper.dataset.orientation=video.videoWidth >= video.videoHeight ? 'landscape' : 'portrait';
      }
    }
  };
  if(video.readyState >= 1) applyRatio();
  video.addEventListener('loadedmetadata', applyRatio, {once:true});
});

/*
 /* Performance mode:
 * Videos stay paused until the client interacts with them.
 * Only ONE video can play at a time.
 * Hover/touch starts muted playback.
 * A real mouse click or mobile tap enables the video's SFX/audio.
 * Touch starts muted first, then the generated click/tap enables audio.
 */
let activeVideo=null;
let lastInputWasTouch=false;

const stopVideo=video=>{
  if(!video) return;
  video.pause();
  if(activeVideo===video) activeVideo=null;
};

const startVideo=video=>{
  if(activeVideo && activeVideo!==video) activeVideo.pause();
  video.muted=true;
  activeVideo=video;
  video.play().catch(()=>{});
};

document.querySelectorAll('video').forEach(video=>{
  video.addEventListener('touchstart',()=>{
    lastInputWasTouch=true;
  },{passive:true});

  video.addEventListener('pointerenter',e=>{
    if(e.pointerType==='mouse' || e.pointerType==='pen') startVideo(video);
  });

  video.addEventListener('pointerleave',e=>{
    if(e.pointerType==='mouse' || e.pointerType==='pen') stopVideo(video);
  });

  video.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'){
      lastInputWasTouch=true;
      startVideo(video);
    }else if(e.pointerType==='mouse'){
      lastInputWasTouch=false;
      startVideo(video);
    }else{
      startVideo(video);
    }
  });

  /* A real click OR a mobile tap enables the video's SFX/audio.
   * The initial touch/pointerdown still starts playback muted, then the
   * browser's click event upgrades that same user interaction to audio.
   */
  video.addEventListener('click',()=>{
    if(activeVideo && activeVideo!==video) activeVideo.pause();
    activeVideo=video;
    video.muted=false;
    video.play().catch(()=>{
      video.muted=true;
      video.play().catch(()=>{});
    });
    window.setTimeout(()=>{lastInputWasTouch=false},400);
  });

  video.addEventListener('play',()=>{
    if(activeVideo && activeVideo!==video) activeVideo.pause();
    activeVideo=video;
  });

  video.addEventListener('pause',()=>{
    if(activeVideo===video) activeVideo=null;
  });
});

/* Lightweight premium interaction layer */
const progressBar=document.querySelector('.scroll-progress span');
let progressTicking=false;
const updateProgress=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;progressBar.style.width=(max>0?(window.scrollY/max)*100:0)+'%';progressTicking=false;};
window.addEventListener('scroll',()=>{if(!progressTicking){requestAnimationFrame(updateProgress);progressTicking=true;}},{passive:true});updateProgress();

if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
  document.querySelectorAll('.magnetic').forEach(btn=>{
    btn.addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect();btn.style.transform='translate('+(e.clientX-r.left-r.width/2)*.08+'px,'+(e.clientY-r.top-r.height/2)*.08+'px)';});
    btn.addEventListener('pointerleave',()=>{btn.style.transform='translate(0,0)';});
  });
}

/* FINAL CARD-PERIMETER ORBIT ENGINE
 * The star now follows a real rounded-rectangle path derived from the
 * actual hero card dimensions. No ellipse, no 3D XYZ approximation,
 * no polygonal keyframes.
 */
(()=>{
  const stage=document.querySelector('.hero-stage');
  const card=document.querySelector('.stage-card');
  const orbit=document.querySelector('.stage-star-orbit');
  const star=document.querySelector('.stage-star-front');
  if(!stage || !card || !orbit || !star) return;

  const duration=11000;
  let startTime=null;
  let pathKey='';

  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));

  const syncGeometry=()=>{
    const stageRect=stage.getBoundingClientRect();
    const cardRect=card.getBoundingClientRect();

    /* Give the star a small breathing room outside the card. */
    const gap=17;
    const w=cardRect.width + gap*2;
    const h=cardRect.height + gap*2;
    const r=clamp(Math.min(42,w/2-2,h/2-2),20,42);

    /* Orbit line is centered on the card's actual visual box. */
    orbit.style.width=w+'px';
    orbit.style.height=h+'px';
    orbit.style.left=((cardRect.left-stageRect.left)+(cardRect.width-w)/2)+'px';
    orbit.style.top=((cardRect.top-stageRect.top)+(cardRect.height-h)/2)+'px';

    /* offset-path coordinates use the hero-stage as the containing block.
       Start at the top-right corner and travel clockwise around the rounded
       rectangle. Cubic curves approximate quarter-circle corners. */
    const x0=cardRect.left-stageRect.left-gap;
    const y0=cardRect.top-stageRect.top-gap;
    const x1=x0+w;
    const y1=y0+h;
    const k=.5522847498;
    const c=r*k;

    const d=[
      'M',x0+r,y0,
      'L',x1-r,y0,
      'C',x1-r+c,y0,x1,y0+r-c,x1,y0+r,
      'L',x1,y1-r,
      'C',x1,y1-r+c,x1-r+c,y1,x1-r,y1,
      'L',x0+r,y1,
      'C',x0+r-c,y1,x0,y1-r+c,x0,y1-r,
      'L',x0,y0+r,
      'C',x0,y0+r-c,x0+r-c,y0,x0+r,y0,
      'Z'
    ].join(' ');

    const key=[Math.round(x0),Math.round(y0),Math.round(w),Math.round(h),Math.round(r)].join('|');
    if(key!==pathKey){
      star.style.offsetPath='path("'+d.replace(/"/g,'')+'")';
      star.style.offsetDistance='0%';
      pathKey=key;
    }
  };

  const resizeObserver=new ResizeObserver(syncGeometry);
  resizeObserver.observe(stage);
  resizeObserver.observe(card);
  window.addEventListener('resize',syncGeometry,{passive:true});
  syncGeometry();

  const frame=(now)=>{
    if(startTime===null) startTime=now;
    const progress=((now-startTime)%duration)/duration;

    star.style.offsetDistance=(progress*100).toFixed(3)+'%';

    /* Subtle depth illusion: slightly larger along the lower half, while
       keeping the star itself visually flat and upright. */
    const depth=Math.sin(progress*Math.PI*2);
    const scale=(1 + Math.max(0,depth)*.16).toFixed(3);
    star.style.transform='translate(-50%,-50%) scale('+scale+')';

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
})();
