/* ═══════════════════════════════════════════════════════
   WYVN STUDIO v3.0 — THE ULTIMATE CINEMATIC ENGINE
   Matrix × Jarvis × Deadpool × Black Mirror
═══════════════════════════════════════════════════════ */

const CONFIG = {
  BACKEND: 'https://wyvn-onyx-backend.onrender.com',
  SUPABASE_URL: 'https://djxpadazeoxehqbdmyfy.supabase.co',
  SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqeHBhZGF6ZW94ZWhxYmRteWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0ODQ5MTYsImV4cCI6MjA5NzA2MDkxNn0.Ujs06ZlswBz3c96BKvZW0fxqE9GSB34fBEZfyH0GJ30',
};

/* ════════ VISITOR SESSION ════════ */
const SESSION_KEY = 'wyvn_sid';
const RETURN_KEY  = 'wyvn_visits';
let sessionId = localStorage.getItem(SESSION_KEY);
if (!sessionId) {
  sessionId = 'sid_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  localStorage.setItem(SESSION_KEY, sessionId);
}
const visitCount = parseInt(localStorage.getItem(RETURN_KEY) || '0') + 1;
localStorage.setItem(RETURN_KEY, visitCount);
const isReturnVisitor = visitCount > 1;
let chatHistory = [];
let voiceEnabled = false;
let auditScore = null;
let sectionsVisited = [];
let timeOnPage = 0;
let activeVisitors = 1;

/* ════════════════════════════════════════════════════════
   UTILITY
════════════════════════════════════════════════════════ */
const lerp  = (a,b,t) => a + (b-a)*t;
const clamp = (v,mn,mx) => Math.max(mn,Math.min(mx,v));
const rand  = (mn,mx) => Math.random()*(mx-mn)+mn;

/* ════════════════════════════════════════════════════════
   FILM GRAIN
════════════════════════════════════════════════════════ */
function initGrain() {
  const canvas = document.getElementById('grain-canvas');
  const ctx = canvas.getContext('2d');
  const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
  resize(); addEventListener('resize', resize);
  const draw = () => {
    const {width:w,height:h} = canvas;
    const img = ctx.createImageData(w,h);
    const d = img.data;
    for (let i=0;i<d.length;i+=4) {
      const v = (Math.random()*255)|0;
      d[i]=d[i+1]=d[i+2]=v; d[i+3]=255;
    }
    ctx.putImageData(img,0,0);
    requestAnimationFrame(draw);
  };
  draw();
}

/* ════════════════════════════════════════════════════════
   CURSOR + GOLD TRAIL
════════════════════════════════════════════════════════ */
function initCursor() {
  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  const tc    = document.getElementById('cursor-trail');
  if (!tc) return;
  const tCtx  = tc.getContext('2d');
  const resize = () => { tc.width=innerWidth; tc.height=innerHeight; };
  resize(); addEventListener('resize',resize);
  let mx=0,my=0,rx=0,ry=0;
  const trail=[];
  addEventListener('mousemove',e=>{
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
    trail.push({x:mx,y:my,life:1});
    if(trail.length>28) trail.shift();
  });
  const animate = ()=>{
    rx=lerp(rx,mx,0.1); ry=lerp(ry,my,0.1);
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    tCtx.clearRect(0,0,tc.width,tc.height);
    for(let i=1;i<trail.length;i++){
      trail[i].life-=0.04;
      if(trail[i].life<=0) continue;
      tCtx.beginPath();
      tCtx.moveTo(trail[i-1].x,trail[i-1].y);
      tCtx.lineTo(trail[i].x,trail[i].y);
      tCtx.strokeStyle=`rgba(201,169,110,${trail[i].life*0.4})`;
      tCtx.lineWidth=trail[i].life*2.5;
      tCtx.stroke();
    }
    requestAnimationFrame(animate);
  };
  animate();
  document.addEventListener('mouseover',e=>{
    if(e.target.closest('a,button,input,textarea,.service-card,.pricing-card'))
      ring.classList.add('expanded');
  });
  document.addEventListener('mouseout',e=>{
    if(e.target.closest('a,button,input,textarea,.service-card,.pricing-card'))
      ring.classList.remove('expanded');
  });
}

/* ════════════════════════════════════════════════════════
   PARTICLE NETWORK
════════════════════════════════════════════════════════ */
function initParticles(canvasId, opts={}) {
  const canvas = document.getElementById(canvasId);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let W,H;
  const COUNT      = opts.count || 120;
  const CONNECT    = opts.connectDist || 145;
  const REPEL_R    = opts.repelDist || 110;
  const REPEL_F    = opts.repelForce || 5;
  const SPEED      = opts.speed || 0.38;
  let mouse = {x:-9999,y:-9999};
  const resize = ()=>{ W=canvas.width=innerWidth; H=canvas.height=innerHeight; };
  resize(); addEventListener('resize',resize);
  addEventListener('mousemove',e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });

  class Particle {
    constructor(){ this.reset(true); }
    reset(){
      this.x=rand(0,W); this.y=rand(0,H);
      this.vx=rand(-SPEED,SPEED); this.vy=rand(-SPEED,SPEED);
      this.r=rand(1.2,2.8);
      const t=Math.random();
      if(t<0.08){this.type='gold';this.color='#C9A96E';}
      else if(t<0.15){this.type='purple';this.color='#6B2FD4';}
      else{this.type='cyan';this.color='#00D4FF';}
    }
    update(){
      this.x+=this.vx; this.y+=this.vy;
      if(this.x<0||this.x>W) this.vx*=-1;
      if(this.y<0||this.y>H) this.vy*=-1;
      const dx=this.x-mouse.x, dy=this.y-mouse.y;
      const dist=Math.hypot(dx,dy);
      if(dist<REPEL_R){
        const f=(REPEL_R-dist)/REPEL_R;
        this.x+=(dx/dist)*f*REPEL_F;
        this.y+=(dy/dist)*f*REPEL_F;
      }
    }
    draw(){
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fillStyle=this.color;
      ctx.shadowBlur=this.type==='cyan'?14:6; ctx.shadowColor=this.color;
      ctx.fill(); ctx.shadowBlur=0;
    }
  }

  class DataPacket {
    constructor(p){ this.particles=p; this.reset(); }
    reset(){
      this.pIdx=Math.floor(Math.random()*this.particles.length);
      const con=this.getConnected();
      if(!con.length){this.active=false;return;}
      this.tIdx=con[Math.floor(Math.random()*con.length)];
      this.progress=0; this.speed=rand(0.006,0.016); this.active=true;
    }
    getConnected(){
      const src=this.particles[this.pIdx];
      return this.particles.map((p,i)=>{
        if(i===this.pIdx) return -1;
        return Math.hypot(p.x-src.x,p.y-src.y)<CONNECT?i:-1;
      }).filter(i=>i>=0);
    }
    update(){
      if(!this.active){this.reset();return;}
      this.progress+=this.speed;
      if(this.progress>=1){
        this.pIdx=this.tIdx;
        const con=this.getConnected();
        if(!con.length){this.active=false;return;}
        this.tIdx=con[Math.floor(Math.random()*con.length)];
        this.progress=0;
      }
    }
    draw(){
      if(!this.active) return;
      const src=this.particles[this.pIdx], dst=this.particles[this.tIdx];
      const x=lerp(src.x,dst.x,this.progress), y=lerp(src.y,dst.y,this.progress);
      ctx.beginPath(); ctx.arc(x,y,2.5,0,Math.PI*2);
      ctx.fillStyle='#00D4FF'; ctx.shadowBlur=18; ctx.shadowColor='#00D4FF';
      ctx.fill(); ctx.shadowBlur=0;
    }
  }

  const particles = Array.from({length:COUNT},()=>new Particle());
  const packets   = Array.from({length:8},()=>new DataPacket(particles));

  const loop = ()=>{
    ctx.clearRect(0,0,W,H);
    // connections
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const dx=particles[i].x-particles[j].x, dy=particles[i].y-particles[j].y;
        const d=Math.hypot(dx,dy);
        if(d<CONNECT){
          const a=(1-d/CONNECT)*0.35;
          ctx.beginPath();
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.strokeStyle=`rgba(0,212,255,${a})`;
          ctx.lineWidth=0.5; ctx.stroke();
        }
      }
    }
    particles.forEach(p=>{p.update();p.draw();});
    packets.forEach(pk=>{pk.update();pk.draw();});
    requestAnimationFrame(loop);
  };
  loop();
}

/* ════════════════════════════════════════════════════════
   ONYX ENTITY VISUAL (concentric rings)
════════════════════════════════════════════════════════ */
function initOnyxEntity() {
  const canvas = document.getElementById('onyx-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let S = canvas.width = canvas.height = Math.min(360, innerWidth*0.4);
  const cx=S/2, cy=S/2;
  let t=0;
  const rings=[
    {r:S*0.35, speed:0.003, dots:6, color:'#00D4FF', lineW:1.5},
    {r:S*0.26, speed:-0.005, dots:4, color:'#6B2FD4', lineW:1},
    {r:S*0.16, speed:0.008, dots:3, color:'#00D4FF', lineW:0.8},
    {r:S*0.10, speed:-0.012, dots:2, color:'#C9A96E', lineW:0.6},
  ];
  const draw=()=>{
    ctx.clearRect(0,0,S,S);
    // Core pulse
    const pulse=0.85+Math.sin(t*2)*0.15;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,S*0.07*pulse);
    g.addColorStop(0,'rgba(0,212,255,0.95)');
    g.addColorStop(0.5,'rgba(0,212,255,0.4)');
    g.addColorStop(1,'rgba(0,212,255,0)');
    ctx.beginPath(); ctx.arc(cx,cy,S*0.07*pulse,0,Math.PI*2);
    ctx.fillStyle=g; ctx.fill();
    ctx.shadowBlur=40; ctx.shadowColor='#00D4FF';
    ctx.beginPath(); ctx.arc(cx,cy,S*0.04,0,Math.PI*2);
    ctx.fillStyle='#fff'; ctx.fill(); ctx.shadowBlur=0;
    // Rings
    rings.forEach((ring,ri)=>{
      const angle=t*ring.speed*100;
      ctx.beginPath();
      ctx.arc(cx,cy,ring.r,0,Math.PI*2);
      ctx.strokeStyle=ring.color; ctx.lineWidth=ring.lineW;
      ctx.globalAlpha=0.4; ctx.stroke(); ctx.globalAlpha=1;
      // Orbiting dots
      for(let d=0;d<ring.dots;d++){
        const a=angle+(d/ring.dots)*Math.PI*2;
        const dx=cx+Math.cos(a)*ring.r, dy=cy+Math.sin(a)*ring.r;
        ctx.beginPath(); ctx.arc(dx,dy,2.5,0,Math.PI*2);
        ctx.fillStyle=ring.color; ctx.shadowBlur=12; ctx.shadowColor=ring.color;
        ctx.fill(); ctx.shadowBlur=0;
      }
    });
    t+=0.016;
    requestAnimationFrame(draw);
  };
  draw();
}

/* ════════════════════════════════════════════════════════
   ENTRY EXPERIENCE
════════════════════════════════════════════════════════ */
function initEntry() {
  const bootEl   = document.getElementById('boot-lines');
  const wordmark = document.getElementById('entry-wordmark');
  const btnWrap  = document.getElementById('entry-btn-wrap');
  const entryBtn = document.getElementById('entry-btn');
  const speech   = document.getElementById('entry-speech');
  const entryScr = document.getElementById('entry-screen');

  initParticles('particle-canvas-entry',{count:60,connectDist:100,speed:0.3});

  const LINES = [
    'WYVN INTELLIGENCE SYSTEM',
    'VERSION 3.0.0 — EYES ONLY',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '[████████████████] LOADING CORES',
    '[████████████████] ONYX AI LAYER',
    '[████████████████] NEURAL NETWORK',
    '[████████████████] VOICE SYNTHESIS',
    '[████████████████] BEHAVIORAL ENGINE',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'SCANNING VISITOR...',
    isReturnVisitor ? 'IDENTITY: RETURNING SUBJECT — CLASSIFIED' : 'IDENTITY: UNCLASSIFIED',
    'HUMAN VERIFICATION REQUIRED.',
  ];

  let lineIdx=0;
  const typeLine=()=>{
    if(lineIdx>=LINES.length){
      setTimeout(()=>{
        wordmark.classList.remove('hidden');
        setTimeout(()=>{ btnWrap.classList.remove('hidden'); },600);
      },400);
      return;
    }
    const div=document.createElement('div');
    div.textContent=LINES[lineIdx++];
    bootEl.appendChild(div);
    bootEl.scrollTop=bootEl.scrollHeight;
    setTimeout(typeLine, lineIdx<9?220:380);
  };
  setTimeout(typeLine,600);

  // Running button logic
  const QUIPS = ['Nope.','Nice try.','SO close.','Here buddy~','Almost!!','You thought?','I can do this forever.','Seriously?','...impressive persistence.','Any day now.'];
  let escapes=0, caught=false;
  let btnX=0, btnY=0, velX=0, velY=0;

  const getCenter=()=>{
    const r=entryBtn.getBoundingClientRect();
    return {x:r.left+r.width/2, y:r.top+r.height/2};
  };

  const spring=()=>{
    velX+=(0-btnX)*0.08; velY+=(0-btnY)*0.08;
    velX*=0.82; velY*=0.82;
    btnX+=velX; btnY+=velY;
    entryBtn.style.transform=`translate(${btnX}px,${btnY}px)`;
    requestAnimationFrame(spring);
  };
  spring();

  document.addEventListener('mousemove',e=>{
    if(caught) return;
    const c=getCenter();
    const dx=e.clientX-c.x, dy=e.clientY-c.y;
    const dist=Math.hypot(dx,dy);
    if(dist<120){
      const force=(120-dist)/120;
      const angle=Math.atan2(dy,dx);
      const pushX=-Math.cos(angle)*160*force;
      const pushY=-Math.sin(angle)*160*force;
      const maxX=innerWidth*0.3, maxY=innerHeight*0.25;
      btnX=clamp(btnX+pushX,-maxX,maxX);
      btnY=clamp(btnY+pushY,-maxY,maxY);
      escapes++;
      if(escapes>2 && escapes<=10){
        speech.textContent=QUIPS[Math.min(escapes-3,QUIPS.length-1)];
        speech.classList.remove('hidden');
      }
      if(escapes>=5){
        setTimeout(()=>{
          speech.textContent='...okay fine.';
          caught=true;
          velX=0; velY=0; btnX=0; btnY=0;
        },800);
      }
    }
  });

  entryBtn.addEventListener('click',()=>{ triggerEntry(); });

  async function triggerEntry(){
    // Glitch
    const glitch=document.getElementById('glitch-overlay');
    const bars=document.getElementById('cinematic-bars');
    glitch.classList.add('active');
    bars.classList.add('active');
    // Play ONYX voice
    speakOnyx("I've been expecting you.");
    await delay(600);
    glitch.classList.remove('active');
    bars.classList.add('sweep');
    await delay(500);
    entryScr.style.opacity='0';
    entryScr.style.transition='opacity 0.4s';
    await delay(400);
    entryScr.style.display='none';
    document.getElementById('main-site').classList.remove('hidden');
    bars.classList.remove('active','sweep');
    // Init main site
    initMainSite();
    // Ping visitor
    pingVisitor();
  }
}

const delay = ms => new Promise(r=>setTimeout(r,ms));

/* ════════════════════════════════════════════════════════
   MAIN SITE INIT
════════════════════════════════════════════════════════ */
function initMainSite() {
  initParticles('particle-canvas');
  initOnyxEntity();
  initReveal();
  initNav();
  initMagnetic();
  initStats();
  initOnyxChat();
  initAudit();
  initContact();
  initFloatingPanel();
  initSocialProof();
  initActiveVisitors();
  initScrollTracking();
  startTimeTracking();

  // If return visitor, ONYX greets them
  if(isReturnVisitor){
    setTimeout(()=>{
      const greeting=visitCount===2
        ? "Back again. I knew you would be. Let's stop circling and actually talk."
        : `Visit number ${visitCount}. ONYX doesn't forget. Ready to move?`;
      appendMessage('ONYX', greeting);
      if(voiceEnabled) speakOnyx(greeting);
    }, 3000);
  }
}

/* ════════════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════════════ */
function initNav() {
  const nav=document.getElementById('navbar');
  const ham=document.getElementById('hamburger');
  const mob=document.getElementById('mobile-nav');
  addEventListener('scroll',()=>{
    nav.classList.toggle('scrolled',scrollY>50);
  });
  ham?.addEventListener('click',()=>{
    ham.classList.toggle('open');
    mob.classList.toggle('open');
  });
  mob?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    ham.classList.remove('open'); mob.classList.remove('open');
  }));
}

/* ════════════════════════════════════════════════════════
   MAGNETIC BUTTONS
════════════════════════════════════════════════════════ */
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el=>{
    let bx=0,by=0,vx=0,vy=0;
    const spring=()=>{
      vx+=(0-bx)*0.12; vy+=(0-by)*0.12;
      vx*=0.75; vy*=0.75;
      bx+=vx; by+=vy;
      el.style.transform=`translate(${bx}px,${by}px)`;
      requestAnimationFrame(spring);
    };
    spring();
    el.addEventListener('mousemove',e=>{
      const r=el.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      const dx=e.clientX-cx, dy=e.clientY-cy;
      const dist=Math.hypot(dx,dy);
      if(dist<100){ bx+=dx*0.35; by+=dy*0.35; }
    });
    el.addEventListener('mouseleave',()=>{ bx=0;by=0; });
  });
}

/* ════════════════════════════════════════════════════════
   LINE REVEAL ANIMATIONS
════════════════════════════════════════════════════════ */
function initReveal() {
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('revealed');
        // Track section visits
        const section=e.target.closest('section');
        if(section && !sectionsVisited.includes(section.id)){
          sectionsVisited.push(section.id);
        }
        observer.unobserve(e.target);
      }
    });
  },{threshold:0.15,rootMargin:'0px 0px -60px 0px'});
  document.querySelectorAll('.reveal-line, .reveal-text').forEach(el=>observer.observe(el));
}

/* ════════════════════════════════════════════════════════
   ANIMATED STATS
════════════════════════════════════════════════════════ */
function initStats() {
  const items=document.querySelectorAll('.stat-number');
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting) return;
      const el=e.target;
      const target=parseFloat(el.dataset.target);
      const suffix=el.dataset.suffix||'';
      const decimals=el.dataset.decimals||0;
      let current=0; const step=target/80;
      const tick=()=>{
        current=Math.min(current+step,target);
        el.textContent=current.toFixed(decimals)+suffix;
        if(current<target) requestAnimationFrame(tick);
      };
      tick();
      obs.unobserve(el);
    });
  },{threshold:0.5});
  items.forEach(el=>obs.observe(el));
}

/* ════════════════════════════════════════════════════════
   ONYX CHAT
════════════════════════════════════════════════════════ */
function initOnyxChat() {
  const input   = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const voiceBtn= document.getElementById('voice-toggle');

  voiceBtn?.addEventListener('click',()=>{
    voiceEnabled=!voiceEnabled;
    voiceBtn.textContent=voiceEnabled?'🔊':'🔈';
    voiceBtn.style.color=voiceEnabled?'var(--cyan)':'var(--muted)';
  });

  const send = async ()=>{
    const msg=input.value.trim();
    if(!msg) return;
    input.value='';
    appendMessage('YOU',msg);
    chatHistory.push({role:'user',content:msg});
    const typingEl=appendTyping();
    try{
      const res=await fetch(CONFIG.BACKEND+'/api/onyx-chat',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          messages:chatHistory,
          visitor_id:sessionId,
          audit_score:auditScore,
          time_on_page:timeOnPage,
          sections_visited:sectionsVisited,
          return_visitor:isReturnVisitor
        })
      });
      const data=await res.json();
      typingEl.remove();
      const reply=data.reply||'...';
      appendMessage('ONYX',reply);
      chatHistory.push({role:'assistant',content:reply});
      if(voiceEnabled) speakOnyx(reply);
      // Capture email if they gave one
      extractEmailFromMessage(msg);
    }catch{
      typingEl.remove();
      appendMessage('ONYX','[SIGNAL DISRUPTED] Reconnecting...');
    }
  };

  sendBtn?.addEventListener('click',send);
  input?.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} });
}

function appendMessage(sender, text) {
  const wrap=document.getElementById('chat-messages');
  if(!wrap) return;
  const div=document.createElement('div');
  div.className='chat-msg '+(sender==='ONYX'?'onyx-msg':'user-msg');
  div.innerHTML=`<span class="msg-label">${sender}</span><p></p>`;
  wrap.appendChild(div);
  wrap.scrollTop=wrap.scrollHeight;
  // Typewriter for ONYX
  if(sender==='ONYX'){
    const p=div.querySelector('p');
    let i=0;
    const type=()=>{
      if(i<text.length){p.textContent+=text[i++];requestAnimationFrame(type);}
      wrap.scrollTop=wrap.scrollHeight;
    };
    type();
  } else {
    div.querySelector('p').textContent=text;
  }
  return div;
}

function appendTyping() {
  const wrap=document.getElementById('chat-messages');
  const div=document.createElement('div');
  div.className='chat-msg onyx-msg typing-indicator';
  div.innerHTML='<span class="msg-label">ONYX</span><p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>';
  wrap.appendChild(div);
  wrap.scrollTop=wrap.scrollHeight;
  return div;
}

function extractEmailFromMessage(msg) {
  const emailRe=/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match=msg.match(emailRe);
  if(match && !sessionStorage.getItem('wyvn_captured_email')){
    sessionStorage.setItem('wyvn_captured_email', match[0]);
    // Auto-capture as partial lead
    fetch(CONFIG.BACKEND+'/api/capture-lead',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:match[0], source:'onyx_chat', visitor_id:sessionId, goal:'ONYX Chat conversation'})
    }).catch(()=>{});
  }
}

/* ════════════════════════════════════════════════════════
   VOICE SYNTHESIS
════════════════════════════════════════════════════════ */
async function speakOnyx(text) {
  try{
    const res=await fetch(CONFIG.BACKEND+'/api/onyx-voice',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({text:text.slice(0,300)})
    });
    if(!res.ok) return;
    const blob=await res.blob();
    const url=URL.createObjectURL(blob);
    const audio=new Audio(url);
    audio.play();
    audio.onended=()=>URL.revokeObjectURL(url);
  }catch(e){ console.log('voice err',e); }
}

/* ════════════════════════════════════════════════════════
   PAGESPEED AUDIT
════════════════════════════════════════════════════════ */
function initAudit() {
  const auditBtn=document.getElementById('audit-btn');
  const auditInput=document.getElementById('audit-url');
  const results=document.getElementById('audit-results');
  const btnText=document.getElementById('audit-btn-text');
  const heroTrigger=document.getElementById('audit-trigger');

  heroTrigger?.addEventListener('click',()=>{
    document.getElementById('demo-section')?.scrollIntoView({behavior:'smooth'});
    setTimeout(()=>auditInput?.focus(),600);
  });

  auditBtn?.addEventListener('click',runAudit);
  auditInput?.addEventListener('keydown',e=>{ if(e.key==='Enter') runAudit(); });

  async function runAudit() {
    let url=auditInput.value.trim();
    if(!url){ auditInput.classList.add('shake'); setTimeout(()=>auditInput.classList.remove('shake'),500); return; }
    if(!url.startsWith('http')) url='https://'+url;
    btnText.textContent='ONYX Scanning...';
    auditBtn.disabled=true;
    results.innerHTML='<div class="audit-loading"><div class="audit-pulse"></div><p>ONYX is auditing your site...</p></div>';
    results.classList.remove('hidden');
    try{
      const res=await fetch(CONFIG.BACKEND+'/api/audit',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({url})
      });
      const data=await res.json();
      if(data.error) throw new Error(data.error);
      const s=data.scores;
      auditScore=s.performance;
      const cls=v=>v>=90?'score-great':v>=70?'score-ok':'score-bad';
      results.innerHTML=`
        <div class="audit-scores">
          <div class="score-item"><div class="score-circle ${cls(s.performance)}">${s.performance}</div><div class="score-label">Performance</div></div>
          <div class="score-item"><div class="score-circle ${cls(s.seo)}">${s.seo}</div><div class="score-label">SEO</div></div>
          <div class="score-item"><div class="score-circle ${cls(s.accessibility)}">${s.accessibility}</div><div class="score-label">Accessibility</div></div>
          <div class="score-item"><div class="score-circle ${cls(s.bestPractices)}">${s.bestPractices}</div><div class="score-label">Best Practices</div></div>
        </div>
        <div class="audit-verdict">
          <p class="audit-onyx-line">${getAuditVerdict(s.performance)}</p>
          <div class="audit-ctas">
            <a href="#contact-section" class="btn-primary magnetic"><span>Fix This — Talk to WYVN</span><div class="btn-glow"></div></a>
            <a href="#contact-section" class="btn-ghost">Get Full Report</a>
          </div>
        </div>`;
      // Have ONYX comment on the audit
      const onyxComment=getAuditOnyxQuip(s.performance, url);
      setTimeout(()=>{ appendMessage('ONYX',onyxComment); if(voiceEnabled) speakOnyx(onyxComment); },800);
    }catch(e){
      results.innerHTML=`<p class="audit-error">Audit failed: ${e.message}. Try a public URL.</p>`;
    }finally{
      btnText.textContent='Run Audit';
      auditBtn.disabled=false;
    }
  }

  function getAuditVerdict(score) {
    if(score>=90) return "Solid. But 'solid' doesn't win clients — WYVN takes you from good to unforgettable.";
    if(score>=70) return "Room to grow. Every point you're leaving on the table is money competitors are picking up.";
    if(score>=50) return "This score is actively costing you clients. Let's fix it — WYVN's done this before.";
    return "A score like this? Clients are leaving your site before they see what you do. This is fixable. Fast.";
  }

  function getAuditOnyxQuip(score, url) {
    const domain=url.replace(/https?:\/\//,'').split('/')[0];
    if(score>=90) return `${domain} scores well. But technical scores don't close deals — the experience does. WYVN makes sites that feel like something.`;
    if(score>=70) return `${domain} is middle of the pack. ${score}/100 on performance means you're losing roughly a third of mobile visitors before they even see your offer.`;
    if(score>=50) return `${domain} is hurting. A ${score} performance score means slow loads, dropped rankings, and impatient clients. WYVN can double that number.`;
    return `${score}/100. I'll be blunt — ${domain} needs work. That's not an insult, that's a business opportunity. Want WYVN to show you what's possible?`;
  }
}

/* ════════════════════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════════════════════ */
function initContact() {
  const form=document.getElementById('contact-form');
  const success=document.getElementById('form-success');
  const btnText=document.getElementById('form-btn-text');

  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(btnText) btnText.textContent='ONYX Processing...';
    const data=Object.fromEntries(new FormData(form));
    try{
      const res=await fetch(CONFIG.BACKEND+'/api/capture-lead',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...data, visitor_id:sessionId, audit_score:auditScore})
      });
      const json=await res.json();
      // Show proposal typed out in success message
      form.style.display='none';
      success?.classList.remove('hidden');
      if(json.proposal){
        const propEl=document.getElementById('proposal-text');
        if(propEl){
          propEl.textContent='';
          let i=0;
          const type=()=>{ if(i<json.proposal.length){propEl.textContent+=json.proposal[i++];requestAnimationFrame(type);} };
          type();
        }
      }
    }catch{
      if(btnText) btnText.textContent='Error — Try Again';
    }
  });
}

/* ════════════════════════════════════════════════════════
   FLOATING ONYX PANEL
════════════════════════════════════════════════════════ */
function initFloatingPanel() {
  const panel=document.getElementById('onyx-float');
  const closeBtn=document.getElementById('float-close');
  const reopenBtn=document.getElementById('onyx-reopen');
  const floatMsg=document.getElementById('float-msg');
  const floatInput=document.getElementById('float-input');
  const floatSend=document.getElementById('float-send');

  const SCROLL_MESSAGES=[
    {pct:0,   msg:"Welcome. I'm ONYX — WYVN's intelligence. I'll be here."},
    {pct:15,  msg:"You're in Services. Most clients land on Growth. Want to know why?"},
    {pct:35,  msg:"The audit above is real. Type your URL — I'll show you what I see."},
    {pct:55,  msg:"Pricing's coming up. Fair warning: our clients say it's the best decision they made this year."},
    {pct:75,  msg:"You've been here a while. That's not nothing. What's holding you back?"},
    {pct:90,  msg:"You're at the contact form. I already drafted your proposal. Just fill it in."},
  ];
  let shownMessages=new Set();

  addEventListener('scroll',()=>{
    if(!panel || panel.classList.contains('hidden')) return;
    const pct=scrollY/(document.body.scrollHeight-innerHeight)*100;
    SCROLL_MESSAGES.forEach(({pct:threshold,msg})=>{
      if(pct>=threshold && !shownMessages.has(threshold)){
        shownMessages.add(threshold);
        if(floatMsg){
          floatMsg.textContent='';
          let i=0;
          const type=()=>{ if(i<msg.length){floatMsg.textContent+=msg[i++];requestAnimationFrame(type);} };
          type();
        }
      }
    });
  });

  closeBtn?.addEventListener('click',()=>{
    panel.classList.add('hidden');
    reopenBtn?.classList.remove('hidden');
  });
  reopenBtn?.addEventListener('click',()=>{
    panel.classList.remove('hidden');
    reopenBtn?.classList.add('hidden');
  });

  const sendFloat=async()=>{
    const msg=floatInput?.value.trim();
    if(!msg) return;
    floatInput.value='';
    chatHistory.push({role:'user',content:msg});
    try{
      const res=await fetch(CONFIG.BACKEND+'/api/onyx-chat',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({messages:chatHistory,visitor_id:sessionId,audit_score:auditScore,time_on_page:timeOnPage,sections_visited:sectionsVisited,return_visitor:isReturnVisitor})
      });
      const data=await res.json();
      const reply=data.reply||'...';
      chatHistory.push({role:'assistant',content:reply});
      if(floatMsg){
        floatMsg.textContent='';
        let i=0;
        const type=()=>{ if(i<reply.length){floatMsg.textContent+=reply[i++];requestAnimationFrame(type);} };
        type();
      }
      if(voiceEnabled) speakOnyx(reply);
    }catch{ if(floatMsg) floatMsg.textContent='[signal disrupted]'; }
  };
  floatSend?.addEventListener('click',sendFloat);
  floatInput?.addEventListener('keydown',e=>{ if(e.key==='Enter') sendFloat(); });
}

/* ════════════════════════════════════════════════════════
   SOCIAL PROOF TOASTS
════════════════════════════════════════════════════════ */
function initSocialProof() {
  const container=document.getElementById('social-proof-container');
  if(!container) return;

  fetch(CONFIG.BACKEND+'/api/social-proof')
    .then(r=>r.json())
    .then(data=>{
      const proofs=data.proof||[];
      let idx=0;
      const showNext=()=>{
        if(!proofs.length) return;
        const p=proofs[idx%proofs.length]; idx++;
        const toast=document.createElement('div');
        toast.className='social-toast';
        toast.innerHTML=`
          <div class="toast-avatar">${p.name[0]}</div>
          <div class="toast-info">
            <strong>${p.name}</strong> from ${p.location}
            <span>${p.action}</span>
            <small>${p.time}</small>
          </div>`;
        container.appendChild(toast);
        setTimeout(()=>toast.classList.add('visible'),50);
        setTimeout(()=>{
          toast.classList.remove('visible');
          setTimeout(()=>toast.remove(),400);
        },4500);
        setTimeout(showNext, 8000+Math.random()*6000);
      };
      setTimeout(showNext, 5000);
    }).catch(()=>{});
}

/* ════════════════════════════════════════════════════════
   ACTIVE VISITOR COUNT
════════════════════════════════════════════════════════ */
function initActiveVisitors() {
  const el=document.getElementById('active-visitors-count');
  const update=()=>{
    fetch(CONFIG.BACKEND+'/api/active')
      .then(r=>r.json())
      .then(d=>{ if(el) el.textContent=d.active||1; activeVisitors=d.active||1; })
      .catch(()=>{ if(el) el.textContent='1'; });
  };
  update();
  setInterval(update, 30000);
}

/* ════════════════════════════════════════════════════════
   VISITOR PING + SCROLL TRACKING
════════════════════════════════════════════════════════ */
function pingVisitor() {
  const device=innerWidth<768?'mobile':innerWidth<1200?'tablet':'desktop';
  const browser=navigator.userAgent.includes('Chrome')?'Chrome':
                 navigator.userAgent.includes('Firefox')?'Firefox':
                 navigator.userAgent.includes('Safari')?'Safari':'Other';
  fetch(CONFIG.BACKEND+'/api/visitor',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      session_id:sessionId, action:'ping',
      data:{device_type:device, browser, referrer:document.referrer||null, landing_page:location.pathname, return_visitor:isReturnVisitor}
    })
  }).catch(()=>{});
  // Ping every 2 min to track active session
  setInterval(()=>{
    fetch(CONFIG.BACKEND+'/api/visitor',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({session_id:sessionId,action:'update',data:{interacted_with_onyx:chatHistory.length>0,pages_viewed:1,time_on_site:timeOnPage,scrolled_depth:maxScrollDepth}})
    }).catch(()=>{});
  },120000);
}

let maxScrollDepth=0;
function initScrollTracking() {
  addEventListener('scroll',()=>{
    const depth=Math.round(scrollY/(document.body.scrollHeight-innerHeight)*100);
    maxScrollDepth=Math.max(maxScrollDepth,depth);
  });
}

function startTimeTracking() {
  setInterval(()=>{ timeOnPage++; },1000);
}

/* ════════════════════════════════════════════════════════
   INIT
════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded',()=>{
  initGrain();
  initCursor();
  initEntry();
});
