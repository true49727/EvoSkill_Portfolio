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

/* FINAL 3D CARD ORBIT ENGINE
 * The orbit is parameterized continuously with sin/cos in X-Z space.
 * This avoids polygonal keyframes and avoids 2D offset-path, while keeping
 * the star upright. Two visual copies provide deterministic card occlusion.
 */
(()=>{
  const orbitBack=document.querySelector('.stage-star-back');
  const orbitFront=document.querySelector('.stage-star-front');
  if(!orbitBack || !orbitFront) return;

  let startTime=null;
  const duration=10000;

  const frame=(now)=>{
    if(startTime===null) startTime=now;
    const t=((now-startTime)%duration)/duration;
    const theta=t*Math.PI*2;

    const mobile=window.innerWidth<=850;
    const rx=mobile?175:260;
    const rz=mobile?260:380;

    const x=rx*Math.cos(theta);
    const z=rz*Math.sin(theta);

    /* Positive Z is toward the viewer. */
    const frontDepth=Math.max(0,z);
    const backDepth=Math.max(0,-z);
    const scale=.86 + (frontDepth/rz)*.28;
    const backOpacity=.12 + (backDepth/rz)*.22;

    /* Tilt the orbit plane in 3D, then cancel that tilt on the star itself
       so the four-point star always faces the viewer correctly. */
    const base=
      'translate(-50%,-50%) '+
      'rotateX(50deg) rotateZ(-7deg) '+
      'translate3d('+x.toFixed(2)+'px,0,'+z.toFixed(2)+'px) '+
      'rotateZ(7deg) rotateX(-50deg) '+
      'rotate(45deg) scale('+scale.toFixed(3)+')';

    orbitBack.style.transform=base;
    orbitFront.style.transform=base;

    /* The rectangular card sits between these two layers. */
    orbitBack.style.opacity=(z<0?backOpacity:0).toFixed(3);
    orbitFront.style.opacity=(z>=0?1:0);

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
})();
