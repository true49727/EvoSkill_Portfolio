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
 * Performance mode:
 * Videos do not autoplay or download the full file on page load.
 * A video starts only when the client hovers/touches it.
 * At most two videos can be playing at the same time.
 */
const activeVideos=[];
const maxActiveVideos=2;

const stopVideo=video=>{
  video.pause();
};

const startVideo=video=>{
  const existing=activeVideos.indexOf(video);
  if(existing!==-1){
    activeVideos.splice(existing,1);
  }

  while(activeVideos.length>=maxActiveVideos){
    const oldest=activeVideos.shift();
    if(oldest) stopVideo(oldest);
  }

  activeVideos.push(video);
  video.play().catch(()=>{});
};

document.querySelectorAll('video').forEach(video=>{
  video.addEventListener('pointerenter',e=>{
    if(e.pointerType==='mouse' || e.pointerType==='pen') startVideo(video);
  });

  video.addEventListener('pointerleave',e=>{
    if(e.pointerType==='mouse' || e.pointerType==='pen') stopVideo(video);
  });

  video.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch') startVideo(video);
  });

  video.addEventListener('play',()=>{
    if(!activeVideos.includes(video)) startVideo(video);
  });

  video.addEventListener('pause',()=>{
    const index=activeVideos.indexOf(video);
    if(index!==-1) activeVideos.splice(index,1);
  });
});
