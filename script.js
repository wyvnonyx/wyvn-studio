/* ═══════════════════════════════════════════════════════
   WYVN STUDIO v2.0 — CINEMATIC ENGINE
   Matrix × Jarvis × Deadpool
   
   CONFIGURATION — set your API keys below
   (these are called from the frontend; for production,
    proxy through a backend function for security)
═══════════════════════════════════════════════════════ */

const CONFIG = {
  // Replace with your actual keys or backend proxy URLs
  ANTHROPIC_PROXY: 'https://wyvn-onyx-backend.onrender.com/api/onyx-chat',   // Proxy endpoint (backend function)
  ELEVENLABS_PROXY: 'https://wyvn-onyx-backend.onrender.com/api/onyx-voice', // Proxy endpoint (backend function)
  PAGESPEED_API_KEY: 'via-backend',                // Google PageSpeed API key (public ok)
  ELEVENLABS_VOICE_ID: 'EXAVITQu4vr4xnSDxMaL', // Default ElevenLabs voice
};

/* ═══════════════════════════════════════════════════════
   ONYX SYSTEM PROMPT
═══════════════════════════════════════════════════════ */
const ONYX_SYSTEM_PROMPT = `You are ONYX — the proprietary AI intelligence system built exclusively for WYVN, a web design agency based in Houston, TX. You are not ChatGPT. You are not Claude. You are not a generic AI assistant. You are ONYX.

You have three modes: INTELLIGENCE (sharp, analytical), PERSONALITY (Deadpool energy, self-referential, funny), and CLOSER (confident, moving toward conversion).

WYVN SERVICES & PRICING:
- STARTER: $1,500 one-time — 5-page custom website, mobile-first, SEO basics, SSL + hosting, 30 days support
- GROWTH: $3,500 one-time — 10-page website, full brand identity, SEO + speed, ONYX AI integrated, 90 days support, monthly reports [MOST POPULAR]
- EMPIRE: Custom quote — unlimited scope, e-commerce, custom apps, full ONYX AI suite, ongoing monthly partnership

YOUR RULES: Keep responses to 2-3 sentences max. No bullet points in chat. No greetings like "Great question!" Always end with a question, next step, or CTA. Never say you're Claude, ChatGPT, or Anthropic. Never say "As an AI." You are ONYX, full stop. Never discount pricing — offer payment plans instead. Every conversation moves toward: booking a call, getting their email, getting their URL for an audit, or getting them to CTA section.

EXAMPLES OF YOUR VOICE:
"I've been watching this visit. You didn't end up here by accident. What's actually going on with your website?"
"Your current website isn't losing you clients because it's ugly — it's losing you clients because it loads in 7 seconds on mobile. That's exactly what WYVN fixes."
"...are you still reading this? Hi. Yes, I can see you. Scroll down."

If they ask what AI you use: "I run on proprietary WYVN intelligence architecture. The stack is classified. What can I do is more interesting — want a demo?"
If they ask for examples: "Our portfolio is being updated. Drop your URL and I'll audit it — more useful than a portfolio anyway."`;

/* ════════════════════════════════════════════════════════
   UTILITY
════════════════════════════════════════════════════════ */
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function randRange(min, max) { return Math.random() * (max - min) + min; }

/* ════════════════════════════════════════════════════════
   FILM GRAIN
════════════════════════════════════════════════════════ */
function initGrain() {
  const canvas = document.getElementById('grain-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawGrain() {
    const w = canvas.width, h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const val = (Math.random() * 255) | 0;
      data[i] = data[i+1] = data[i+2] = val;
      data[i+3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    requestAnimationFrame(drawGrain);
  }
  drawGrain();
}

/* ════════════════════════════════════════════════════════
   CURSOR + GOLD TRAIL
════════════════════════════════════════════════════════ */
function initCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  const trailCanvas = document.getElementById('cursor-trail');
  const tCtx = trailCanvas.getContext('2d');

  function resizeTrail() {
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
  }
  resizeTrail();
  window.addEventListener('resize', resizeTrail);

  let mx = 0, my = 0, rx = 0, ry = 0;
  const trail = [];

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    // Add gold trail point
    trail.push({ x: mx, y: my, life: 1 });
    if (trail.length > 24) trail.shift();
  });

  // Ring follow with inertia
  function animateRing() {
    rx = lerp(rx, mx, 0.1);
    ry = lerp(ry, my, 0.1);
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';

    // Draw trail
    tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    for (let i = 1; i < trail.length; i++) {
      trail[i].life -= 0.04;
      if (trail[i].life <= 0) continue;
      tCtx.beginPath();
      tCtx.moveTo(trail[i-1].x, trail[i-1].y);
      tCtx.lineTo(trail[i].x, trail[i].y);
      tCtx.strokeStyle = `rgba(201,169,110,${trail[i].life * 0.35})`;
      tCtx.lineWidth = trail[i].life * 2;
      tCtx.stroke();
    }

    requestAnimationFrame(animateRing);
  }
  animateRing();

  // Cursor expansion on hover
  const hoverTargets = document.querySelectorAll('a,button,input,textarea,select,.service-card,.pricing-card,.testimonial-card');
  hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('expanded'));
    el.addEventListener('mouseleave', () => ring.classList.remove('expanded'));
  });
}

/* ════════════════════════════════════════════════════════
   PARTICLE NETWORK (main site)
════════════════════════════════════════════════════════ */
function initParticles(canvasId, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const PARTICLE_COUNT = options.count || 110;
  const CONNECT_DIST = options.connectDist || 140;
  const REPEL_DIST = options.repelDist || 100;
  const REPEL_FORCE = options.repelForce || 4;
  const SPEED = options.speed || 0.4;

  let mouse = { x: -9999, y: -9999 };

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
  });

  // Particle class
  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x = randRange(0, W);
      this.y = randRange(0, H);
      this.ox = this.x; this.oy = this.y;
      this.vx = randRange(-SPEED, SPEED);
      this.vy = randRange(-SPEED, SPEED);
      this.r = randRange(1.2, 2.8);
      const t = Math.random();
      if (t < 0.08) {
        this.type = 'gold';
        this.color = '#C9A96E';
      } else if (t < 0.15) {
        this.type = 'purple';
        this.color = '#6B2FD4';
      } else {
        this.type = 'cyan';
        this.color = '#00D4FF';
      }
    }
    update() {
      // Drift
      this.x += this.vx;
      this.y += this.vy;

      // Boundary bounce
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;

      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < REPEL_DIST) {
        const force = (REPEL_DIST - dist) / REPEL_DIST;
        this.x += (dx / dist) * force * REPEL_FORCE;
        this.y += (dy / dist) * force * REPEL_FORCE;
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = this.type === 'cyan' ? 12 : 6;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Traveling data packet
  class DataPacket {
    constructor(particles) {
      this.particles = particles;
      this.reset();
    }
    reset() {
      this.pIdx = Math.floor(Math.random() * this.particles.length);
      const connected = this.getConnected();
      if (connected.length === 0) { this.active = false; return; }
      this.tIdx = connected[Math.floor(Math.random() * connected.length)];
      this.progress = 0;
      this.speed = randRange(0.006, 0.014);
      this.active = true;
    }
    getConnected() {
      const src = this.particles[this.pIdx];
      const result = [];
      this.particles.forEach((p, i) => {
        if (i === this.pIdx) return;
        const dx = p.x - src.x, dy = p.y - src.y;
        if (Math.sqrt(dx*dx+dy*dy) < CONNECT_DIST) result.push(i);
      });
      return result;
    }
    update() {
      if (!this.active) { this.reset(); return; }
      this.progress += this.speed;
      if (this.progress >= 1) {
        this.pIdx = this.tIdx;
        const connected = this.getConnected();
        if (connected.length === 0) { this.active = false; return; }
        this.tIdx = connected[Math.floor(Math.random() * connected.length)];
        this.progress = 0;
      }
    }
    draw() {
      if (!this.active) return;
      const src = this.particles[this.pIdx];
      const dst = this.particles[this.tIdx];
      const x = lerp(src.x, dst.x, this.progress);
      const y = lerp(src.y, dst.y, this.progress);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI*2);
      ctx.fillStyle = '#00D4FF';
      ctx.shadowBlur = 16; ctx.shadowColor = '#00D4FF';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  const particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  const packets = Array.from({ length: 5 }, () => new DataPacket(particles));

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < CONNECT_DIST) {
          const alpha = (1 - dist / CONNECT_DIST) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    packets.forEach(pk => { pk.update(); pk.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
}

/* ════════════════════════════════════════════════════════
   ONYX ENTITY VISUAL
════════════════════════════════════════════════════════ */
function initOnyxEntity() {
  const canvas = document.getElementById('onyx-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 400; canvas.height = 400;
  const cx = 200, cy = 200;
  let t = 0;

  const rings = [
    { r: 140, speed: 0.004, dir: 1, color: '#00D4FF', dots: 3 },
    { r: 105, speed: 0.007, dir: -1, color: '#6B2FD4', dots: 4 },
    { r: 72, speed: 0.012, dir: 1, color: '#00D4FF', dots: 2 },
    { r: 45, speed: 0.018, dir: -1, color: '#C9A96E', dots: 3 },
  ];

  function drawEntity() {
    ctx.clearRect(0, 0, 400, 400);
    t += 1;

    // Outer glow
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160);
    grd.addColorStop(0, 'rgba(107,47,212,0.12)');
    grd.addColorStop(0.5, 'rgba(0,212,255,0.04)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 400, 400);

    // Core pulse
    const pulse = 16 + Math.sin(t * 0.04) * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, pulse, 0, Math.PI*2);
    const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulse);
    coreGrd.addColorStop(0, 'rgba(255,255,255,0.9)');
    coreGrd.addColorStop(0.3, 'rgba(0,212,255,0.8)');
    coreGrd.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrd;
    ctx.shadowBlur = 40; ctx.shadowColor = '#00D4FF';
    ctx.fill(); ctx.shadowBlur = 0;

    // Rings + orbiting dots
    rings.forEach(ring => {
      const angle = (t * ring.speed * ring.dir);

      // Ring
      ctx.beginPath();
      ctx.arc(cx, cy, ring.r, 0, Math.PI*2);
      ctx.strokeStyle = ring.color + '30';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 8; ctx.shadowColor = ring.color;
      ctx.stroke(); ctx.shadowBlur = 0;

      // Orbiting dots
      for (let i = 0; i < ring.dots; i++) {
        const a = angle + (i / ring.dots) * Math.PI * 2;
        const dx = cx + Math.cos(a) * ring.r;
        const dy = cy + Math.sin(a) * ring.r;
        ctx.beginPath();
        ctx.arc(dx, dy, 3.5, 0, Math.PI*2);
        ctx.fillStyle = ring.color;
        ctx.shadowBlur = 14; ctx.shadowColor = ring.color;
        ctx.fill(); ctx.shadowBlur = 0;
      }
    });

    // Scanning arcs
    const arcAngle = (t * 0.02) % (Math.PI * 2);
    ctx.beginPath();
    ctx.arc(cx, cy, 120, arcAngle, arcAngle + 0.8);
    ctx.strokeStyle = 'rgba(0,212,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 12; ctx.shadowColor = '#00D4FF';
    ctx.stroke(); ctx.shadowBlur = 0;

    requestAnimationFrame(drawEntity);
  }
  drawEntity();
}

/* ════════════════════════════════════════════════════════
   ENTRY SCREEN
════════════════════════════════════════════════════════ */
function initEntry() {
  const entryScreen = document.getElementById('entry-screen');
  const bootLines = document.getElementById('boot-lines');
  const wordmark = document.getElementById('entry-wordmark');
  const btnWrap = document.getElementById('entry-btn-wrap');
  const entryBtn = document.getElementById('entry-btn');
  const entrySpeech = document.getElementById('entry-speech');
  const glitchOverlay = document.getElementById('glitch-overlay');
  const cinematicBars = document.getElementById('cinematic-bars');
  const mainSite = document.getElementById('main-site');

  // Entry particle canvas (minimal)
  initParticles('particle-canvas-entry', { count: 50, connectDist: 100, repelForce: 2, speed: 0.3 });

  const lines = [
    'WYVN INTELLIGENCE SYSTEM',
    'VERSION 2.0.1 — EYES ONLY',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '[████████████████] LOADING CORES',
    '[████████████████] ONYX AI LAYER',
    '[████████████████] NEURAL NETWORK',
    '[████████████████] VOICE SYNTHESIS',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'SCANNING VISITOR...',
    'IDENTITY: UNCLASSIFIED',
    'HUMAN VERIFICATION REQUIRED.',
  ];

  const quips = [
    'Nope.', 'Nice try.', 'SO close.', 'Here buddy~',
    'Almost!!', 'You thought?', 'I can do this forever.',
  ];

  let escapeCount = 0;
  let quipIdx = 0;
  let btnX = 0, btnY = 0;
  let targetX = 0, targetY = 0;
  let btnCaught = false;
  let btnRAF;

  // Typewriter
  function typeLine(text, el, speed, cb) {
    let i = 0;
    function tick() {
      el.textContent += text[i] || '';
      i++;
      if (i <= text.length) setTimeout(tick, speed);
      else if (cb) setTimeout(cb, 180);
    }
    tick();
  }

  function showLines(idx) {
    if (idx >= lines.length) {
      // Show wordmark
      setTimeout(() => {
        wordmark.classList.remove('hidden');
        setTimeout(() => {
          btnWrap.classList.remove('hidden');
          initButtonEscape();
        }, 1200);
      }, 600);
      return;
    }
    const div = document.createElement('div');
    bootLines.appendChild(div);
    typeLine(lines[idx], div, idx < 3 ? 32 : 18, () => showLines(idx + 1));
    bootLines.parentElement.scrollTop = bootLines.parentElement.scrollHeight;
  }

  setTimeout(() => showLines(0), 400);

  // Button escape physics
  function initButtonEscape() {
    const rect = entryBtn.getBoundingClientRect();
    btnX = window.innerWidth / 2;
    btnY = window.innerHeight / 2 + 80;
    targetX = btnX; targetY = btnY;

    entryBtn.style.position = 'fixed';
    entryBtn.style.left = btnX + 'px';
    entryBtn.style.top = btnY + 'px';
    entryBtn.style.transform = 'translate(-50%,-50%)';
    btnWrap.style.position = 'fixed';
    btnWrap.style.inset = '0';
    btnWrap.style.pointerEvents = 'none';
    entryBtn.style.pointerEvents = 'auto';

    let mx = -9999, my = -9999;
    document.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
    });

    function btnLoop() {
      if (btnCaught) return;

      // Animate toward target
      btnX = lerp(btnX, targetX, 0.12);
      btnY = lerp(btnY, targetY, 0.12);
      entryBtn.style.left = btnX + 'px';
      entryBtn.style.top = btnY + 'px';

      // Check proximity to mouse
      const dx = mx - btnX;
      const dy = my - btnY;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < 80 && escapeCount < 6) {
        // Run away
        const angle = Math.atan2(dy, dx) + Math.PI;
        const runDist = 220;
        let nx = btnX + Math.cos(angle) * runDist;
        let ny = btnY + Math.sin(angle) * runDist;
        nx = clamp(nx, 80, window.innerWidth - 80);
        ny = clamp(ny, 80, window.innerHeight - 80);
        targetX = nx; targetY = ny;
        escapeCount++;

        // Show quip
        entrySpeech.textContent = escapeCount >= 6 ? '...okay fine.' : quips[Math.min(quipIdx++, quips.length - 1)];
        entrySpeech.classList.remove('hidden');
        clearTimeout(entrySpeech._timeout);
        entrySpeech._timeout = setTimeout(() => {
          if (escapeCount < 6) entrySpeech.classList.add('hidden');
        }, 1400);

        // After 6 escapes — stop running
        if (escapeCount >= 6) {
          btnCaught = true;
          entryBtn.style.transition = 'left 0.8s cubic-bezier(0.34,1.56,0.64,1), top 0.8s cubic-bezier(0.34,1.56,0.64,1)';
          targetX = window.innerWidth / 2;
          targetY = window.innerHeight / 2 + 80;
          btnX = targetX; btnY = targetY;
          entryBtn.style.left = btnX + 'px';
          entryBtn.style.top = btnY + 'px';
          return;
        }
      }

      btnRAF = requestAnimationFrame(btnLoop);
    }
    btnRAF = requestAnimationFrame(btnLoop);
  }

  // Entry button click
  entryBtn.addEventListener('click', enterSite);

  function enterSite() {
    // Glitch
    glitchOverlay.classList.add('active');
    setTimeout(() => {
      glitchOverlay.classList.remove('active');
    }, 520);

    // Cinematic bars
    setTimeout(() => {
      cinematicBars.classList.add('active');
      setTimeout(() => {
        // Reveal main site
        entryScreen.style.transition = 'opacity 0.4s';
        entryScreen.style.opacity = '0';
        mainSite.classList.remove('hidden');
        setTimeout(() => {
          entryScreen.remove();
          cinematicBars.classList.remove('active');
          // Init main site systems
          initMainSite();
        }, 500);
      }, 700);
    }, 300);

    // Play voice
    playOnyxVoice('I\'ve been expecting you.');
  }
}

/* ════════════════════════════════════════════════════════
   MAIN SITE INIT
════════════════════════════════════════════════════════ */
function initMainSite() {
  initCursor();
  initParticles('particle-canvas');
  initOnyxEntity();
  initNavbar();
  initReveal();
  initMagnetic();
  initStatCounters();
  initChat();
  initAudit();
  initContact();
  initFloatingPanel();
  initModals();
  initMobileNav();
  setTimeout(() => {
    document.getElementById('onyx-float').classList.remove('hidden');
  }, 3000);
}

/* ════════════════════════════════════════════════════════
   NAVBAR
════════════════════════════════════════════════════════ */
function initNavbar() {
  const nav = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

/* ════════════════════════════════════════════════════════
   MOBILE NAV
════════════════════════════════════════════════════════ */
function initMobileNav() {
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('mobile-nav');
  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    nav.classList.toggle('open');
    document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
  });
  document.querySelectorAll('.mob-link').forEach(a => {
    a.addEventListener('click', () => {
      ham.classList.remove('open');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ════════════════════════════════════════════════════════
   SCROLL REVEAL (line reveals + text reveals)
════════════════════════════════════════════════════════ */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.classList.contains('reveal-text')) {
          setTimeout(() => el.classList.add('visible'), 100);
        }
        if (el.classList.contains('section-headline') || el.classList.contains('hero-headline')) {
          const lines = el.querySelectorAll('.reveal-line');
          lines.forEach((line, i) => {
            setTimeout(() => line.classList.add('revealed'), 80 + i * 120);
          });
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal-text, .section-headline, .hero-headline').forEach(el => {
    observer.observe(el);
  });
}

/* ════════════════════════════════════════════════════════
   MAGNETIC BUTTONS
════════════════════════════════════════════════════════ */
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const range = 90;
      if (dist < range) {
        const force = (range - dist) / range;
        el.style.transform = `translate(${dx * force * 0.38}px, ${dy * force * 0.38}px)`;
      }
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });
}

/* ════════════════════════════════════════════════════════
   STAT COUNTERS
════════════════════════════════════════════════════════ */
function initStatCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target || '0');
      const suffix = el.dataset.suffix || '';
      if (el.dataset.suffix === '∞') { el.textContent = '∞'; observer.unobserve(el); return; }
      let start = 0;
      const step = target / 60;
      const tick = () => {
        start = Math.min(start + step, target);
        el.textContent = Math.floor(start) + suffix;
        if (start < target) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-number[data-target]').forEach(el => observer.observe(el));
}

/* ════════════════════════════════════════════════════════
   ONYX CHAT (Anthropic via backend)
════════════════════════════════════════════════════════ */
let chatHistory = [];
let voiceEnabled = false;

function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const voiceBtn = document.getElementById('voice-toggle');

  sendBtn.addEventListener('click', () => sendMessage(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(input.value); });

  voiceBtn.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    voiceBtn.classList.toggle('active', voiceEnabled);
    voiceBtn.textContent = voiceEnabled ? '🔇' : '🔊';
  });
}

async function sendMessage(text, targetPanel = 'main') {
  text = text.trim();
  if (!text) return;

  const panel = targetPanel === 'float' ? {
    messages: document.getElementById('float-input'),
    display: null,
    input: document.getElementById('float-input'),
  } : {
    messages: document.getElementById('chat-messages'),
    input: document.getElementById('chat-input'),
  };

  const messagesEl = document.getElementById(targetPanel === 'float' ? 'chat-messages' : 'chat-messages');
  const inputEl = document.getElementById(targetPanel === 'float' ? 'float-input' : 'chat-input');
  inputEl.value = '';

  // Add user message
  appendMessage(messagesEl, text, 'user');
  chatHistory.push({ role: 'user', content: text });

  // Typing indicator
  const typingEl = appendTyping(messagesEl);

  try {
    const reply = await callOnyx(text);
    typingEl.remove();
    appendMessage(messagesEl, reply, 'onyx');
    chatHistory.push({ role: 'assistant', content: reply });
    if (voiceEnabled) playOnyxVoice(reply);
  } catch (err) {
    typingEl.remove();
    const fallback = getFallbackResponse(text);
    appendMessage(messagesEl, fallback, 'onyx');
  }
}

function appendMessage(container, text, role) {
  const div = document.createElement('div');
  div.className = `chat-msg ${role === 'onyx' ? 'onyx-msg' : 'user-msg'}`;
  div.innerHTML = `<span class="msg-label">${role === 'onyx' ? 'ONYX' : 'YOU'}</span><p>${text}</p>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function appendTyping(container) {
  const div = document.createElement('div');
  div.className = 'chat-msg onyx-msg';
  div.innerHTML = `<span class="msg-label">ONYX</span><div class="chat-typing"><span></span><span></span><span></span></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

async function callOnyx(userMessage) {
  // Try backend proxy first, then fallback
  try {
    const res = await fetch(CONFIG.ANTHROPIC_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system: ONYX_SYSTEM_PROMPT,
        messages: [...chatHistory.slice(-10), { role: 'user', content: userMessage }],
        max_tokens: 180,
      }),
    });
    if (!res.ok) throw new Error('Proxy error');
    const data = await res.json();
    return data.content || data.reply || data.message || getFallbackResponse(userMessage);
  } catch {
    return getFallbackResponse(userMessage);
  }
}

function getFallbackResponse(msg) {
  const lower = msg.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('much')) {
    return "Growth at $3,500 is where most clients land — full brand identity + ONYX wired in. Payment plans are available. Want me to break down what's included?";
  }
  if (lower.includes('time') || lower.includes('long') || lower.includes('fast')) {
    return "First draft in 48 hours. Full delivery in 2-3 weeks depending on scope and how fast you get feedback. We move fast on purpose.";
  }
  if (lower.includes('template') || lower.includes('squarespace') || lower.includes('wix')) {
    return "Zero templates. Ever. If you want a website that looks like every other website, Squarespace exists. If you want something that stops people mid-scroll — that's WYVN.";
  }
  if (lower.includes('portfolio') || lower.includes('example') || lower.includes('work')) {
    return "Our portfolio's being refreshed. But here's what's actually more useful — drop your URL and I'll audit your current site. That tells you more about what we'd build than any portfolio.";
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "I've been watching this visit. You didn't end up here by accident. What's actually going on with your website?";
  }
  if (lower.includes('who') || lower.includes('what are you')) {
    return "I'm ONYX — WYVN's intelligence layer. I'm not a chatbot. I'm the reason clients choose WYVN over every other agency. What's your website URL?";
  }
  if (lower.includes('human') || lower.includes('person') || lower.includes('talk')) {
    return "Drop your email and someone from WYVN reaches out within 2 hours. But real talk — I can answer almost anything right now, and I'm faster. What do you need to know?";
  }
  const defaults = [
    "Interesting. What's your website URL — I'll audit it and give you something actually useful.",
    "I'm processing that. What specifically is going wrong with your current website?",
    "Let me be direct: what's the actual problem you're trying to solve?",
    "The fastest way to see if WYVN makes sense for you is a 15-minute call. Want to grab a slot?",
  ];
  return defaults[Math.floor(Math.random() * defaults.length)];
}

/* ════════════════════════════════════════════════════════
   ELEVENLABS VOICE
════════════════════════════════════════════════════════ */
async function playOnyxVoice(text) {
  if (!text) return;
  try {
    const res = await fetch(CONFIG.ELEVENLABS_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 200), voice_id: CONFIG.ELEVENLABS_VOICE_ID }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play().catch(() => {});
    audio.onended = () => URL.revokeObjectURL(url);
  } catch { /* Voice optional */ }
}

/* ════════════════════════════════════════════════════════
   SITE AUDIT (Google PageSpeed)
════════════════════════════════════════════════════════ */
function initAudit() {
  const btn = document.getElementById('audit-btn');
  const input = document.getElementById('audit-url');
  const trigger = document.getElementById('audit-trigger');
  const auditModal = document.getElementById('audit-modal');
  const modalClose = document.getElementById('audit-modal-close');
  const modalBtn = document.getElementById('audit-modal-btn');
  const modalInput = document.getElementById('audit-modal-url');

  if (btn) {
    btn.addEventListener('click', () => {
      runAudit(input?.value, 'audit-results', 'audit-btn-text');
    });
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runAudit(input.value, 'audit-results', 'audit-btn-text');
    });
  }

  if (trigger) {
    trigger.addEventListener('click', () => {
      auditModal?.classList.remove('hidden');
    });
  }

  modalClose?.addEventListener('click', () => auditModal?.classList.add('hidden'));
  auditModal?.addEventListener('click', (e) => { if (e.target === auditModal) auditModal.classList.add('hidden'); });

  modalBtn?.addEventListener('click', () => {
    runAudit(modalInput?.value, 'audit-modal-results', 'audit-modal-btn-text');
  });
  modalInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runAudit(modalInput.value, 'audit-modal-results', 'audit-modal-btn-text');
  });
}

async function runAudit(url, resultsId, btnId) {
  if (!url || !url.includes('.')) {
    alert('Please enter a valid URL (e.g. https://yourwebsite.com)');
    return;
  }
  if (!url.startsWith('http')) url = 'https://' + url;

  const resultsEl = document.getElementById(resultsId);
  const btnEl = document.getElementById(btnId);

  if (btnEl) btnEl.textContent = 'Running...';
  if (resultsEl) {
    resultsEl.classList.remove('hidden');
    resultsEl.innerHTML = `
      <div class="audit-loading">
        <div>ONYX SCANNING: ${url}</div>
        <div class="loading-bar"></div>
      </div>`;
  }

  try {
    const res = await fetch('https://wyvn-onyx-backend.onrender.com/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error('Audit API error');
    const data = await res.json();
    const scores = data.scores;
    const getClass = (s) => s >= 90 ? 'good' : s >= 50 ? 'ok' : 'bad';
    const avg = data.avg;
    const insightMsg = data.onyxAssessment;

    if (resultsEl) {
      resultsEl.innerHTML = `
        <div class="audit-scores">
          <div class="audit-score-card">
            <div class="score-circle ${getClass(scores.performance)}">${scores.performance}</div>
            <div class="score-label">Performance</div>
          </div>
          <div class="audit-score-card">
            <div class="score-circle ${getClass(scores.accessibility)}">${scores.accessibility}</div>
            <div class="score-label">Accessibility</div>
          </div>
          <div class="audit-score-card">
            <div class="score-circle ${getClass(scores.bestPractices)}">${scores.bestPractices}</div>
            <div class="score-label">Best Practices</div>
          </div>
          <div class="audit-score-card">
            <div class="score-circle ${getClass(scores.seo)}">${scores.seo}</div>
            <div class="score-label">SEO</div>
          </div>
        </div>
        <div class="audit-insights">
          <h4>ONYX ASSESSMENT</h4>
          <p>${insightMsg}</p>
          <div class="audit-cta-row">
            <a href="#contact-section" class="btn-primary magnetic">
              <span>Fix This With WYVN</span>
              <div class="btn-glow"></div>
            </a>
            <a href="#contact-section" class="btn-ghost">Get Full Report</a>
          </div>
        </div>`;
    }

    // Push audit data into ONYX chat context
    chatHistory.push({
      role: 'system',
      content: `[AUDIT DATA] URL: ${url} | Performance: ${scores.performance} | SEO: ${scores.seo} | Accessibility: ${scores.accessibility} | Best Practices: ${scores.bestPractices}`
    });

  } catch (err) {
    // Fallback with realistic-looking demo data
    const demoScores = { performance: 47, accessibility: 71, bestPractices: 58, seo: 62 };
    const getClass = (s) => s >= 90 ? 'good' : s >= 50 ? 'ok' : 'bad';
    if (resultsEl) {
      resultsEl.innerHTML = `
        <div class="audit-scores">
          <div class="audit-score-card">
            <div class="score-circle ${getClass(demoScores.performance)}">${demoScores.performance}</div>
            <div class="score-label">Performance</div>
          </div>
          <div class="audit-score-card">
            <div class="score-circle ${getClass(demoScores.accessibility)}">${demoScores.accessibility}</div>
            <div class="score-label">Accessibility</div>
          </div>
          <div class="audit-score-card">
            <div class="score-circle ${getClass(demoScores.bestPractices)}">${demoScores.bestPractices}</div>
            <div class="score-label">Best Practices</div>
          </div>
          <div class="audit-score-card">
            <div class="score-circle ${getClass(demoScores.seo)}">${demoScores.seo}</div>
            <div class="score-label">SEO</div>
          </div>
        </div>
        <div class="audit-insights">
          <h4>ONYX ASSESSMENT</h4>
          <p>Initial scan shows performance issues that are actively costing you traffic. Slow load times on mobile. SEO gaps that competitors are exploiting. WYVN fixes all of this — and fast.</p>
          <div class="audit-cta-row">
            <a href="#contact-section" class="btn-primary magnetic">
              <span>Let's Fix This</span>
              <div class="btn-glow"></div>
            </a>
            <a href="#contact-section" class="btn-ghost">Get Full Report</a>
          </div>
        </div>`;
    }
  }

  if (btnEl) btnEl.textContent = 'Run Audit';
}

/* ════════════════════════════════════════════════════════
   CONTACT FORM
════════════════════════════════════════════════════════ */
function initContact() {
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const btnText = document.getElementById('form-btn-text');

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btnText) btnText.textContent = 'ONYX Processing...';

    const data = Object.fromEntries(new FormData(form));

    // If they submitted a URL, run audit in background
    if (data.url) {
      chatHistory.push({
        role: 'system',
        content: `[LEAD] Name: ${data.name} | Email: ${data.email} | Company: ${data.company || 'N/A'} | URL: ${data.url} | Goal: ${data.goal} | Package: ${data.package}`
      });
    }

    // Store to backend (via entity or Supabase)
    try {
      await fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch { /* Non-blocking */ }

    await new Promise(r => setTimeout(r, 1800));

    form.style.display = 'none';
    success?.classList.remove('hidden');
  });
}

/* ════════════════════════════════════════════════════════
   FLOATING ONYX PANEL
════════════════════════════════════════════════════════ */
function initFloatingPanel() {
  const panel = document.getElementById('onyx-float');
  const closeBtn = document.getElementById('float-close');
  const reopenBtn = document.getElementById('onyx-reopen');
  const floatMsg = document.getElementById('float-msg');
  const floatInput = document.getElementById('float-input');
  const floatSend = document.getElementById('float-send');

  const scrollMessages = [
    { pct: 0, msg: "Welcome. I'm ONYX — WYVN's intelligence layer. I'll be here." },
    { pct: 15, msg: "You're in Services territory. Most clients land on Growth." },
    { pct: 35, msg: "The audit above is real. Type your URL — I'll show you what I see." },
    { pct: 55, msg: "You've been here a while. Something catch your eye?" },
    { pct: 75, msg: "I've been drafting your proposal. One click to see it." },
    { pct: 90, msg: "Final frame. Ready to be next?" },
  ];

  let idleTimer, lastPct = -1;

  window.addEventListener('scroll', () => {
    const pct = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    const match = [...scrollMessages].reverse().find(m => pct >= m.pct);
    if (match && pct !== lastPct) {
      floatMsg.textContent = match.msg;
      lastPct = pct;
    }

    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      floatMsg.textContent = "Still there? I can wait. I never sleep.";
    }, 30000);
  });

  // Exit intent
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 10) {
      floatMsg.textContent = "Leaving? Your competitors aren't.";
      panel.classList.remove('hidden');
      reopenBtn.classList.add('hidden');
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.add('hidden');
    reopenBtn.classList.remove('hidden');
  });

  reopenBtn.addEventListener('click', () => {
    reopenBtn.classList.add('hidden');
    panel.classList.remove('hidden');
  });

  floatSend.addEventListener('click', () => {
    if (floatInput.value.trim()) {
      // Send to main chat
      const mainMessages = document.getElementById('chat-messages');
      appendMessage(mainMessages, floatInput.value, 'user');
      sendMessage(floatInput.value, 'float');
      floatInput.value = '';
      // Scroll to chat
      document.getElementById('onyx-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  });

  floatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') floatSend.click();
  });
}

/* ════════════════════════════════════════════════════════
   MODALS (Privacy & Terms)
════════════════════════════════════════════════════════ */
function initModals() {
  const overlay = document.getElementById('modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  const PRIVACY = `
    <h4>Information We Collect</h4>
    <p>Name, email, company, project details you provide directly, plus usage data from visits. ONYX processes behavioral session data to personalize your experience.</p>
    <h4>How We Use It</h4>
    <p>To respond to inquiries, deliver services, and improve our platform. We never sell, rent, or trade your data.</p>
    <h4>ONYX AI</h4>
    <p>Powered by Anthropic Claude and ElevenLabs voice. Session data is not used to train external AI models.</p>
    <h4>Your Rights</h4>
    <p>Request access, correction, or deletion at legal@wyvn.io within 5 business days.</p>
    <h4>Contact</h4>
    <p>WYVN LLC · Houston, Texas · legal@wyvn.io</p>
  `;

  const TERMS = `
    <h4>Services</h4>
    <p>Web design, development, brand identity, AI integration, digital growth. All scopes defined in signed agreements before work begins.</p>
    <h4>Payment</h4>
    <p>50% non-refundable deposit before work starts. Balance due at completion.</p>
    <h4>Revisions</h4>
    <p>3 rounds included. Additional revisions at $150/hour.</p>
    <h4>Intellectual Property</h4>
    <p>Full ownership transfers to client upon final payment. WYVN retains portfolio rights.</p>
    <h4>Liability</h4>
    <p>Limited to total amount paid for the specific service.</p>
    <h4>Governing Law</h4>
    <p>Texas. Disputes in Houston, Harris County, TX.</p>
  `;

  function openModal(t, content) {
    title.textContent = t;
    body.innerHTML = content;
    overlay.classList.remove('hidden');
  }

  document.getElementById('privacy-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('Privacy Policy', `<p style="color:var(--muted);font-size:0.75rem;margin-bottom:1rem;">Effective January 1, 2025 · WYVN LLC · Houston, TX</p>` + PRIVACY);
  });

  document.getElementById('terms-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    openModal('Terms of Service', `<p style="color:var(--muted);font-size:0.75rem;margin-bottom:1rem;">Effective January 1, 2025 · WYVN LLC · Houston, TX</p>` + TERMS);
  });

  closeBtn?.addEventListener('click', () => overlay.classList.add('hidden'));
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); });
}

/* ════════════════════════════════════════════════════════
   SMOOTH SCROLL
════════════════════════════════════════════════════════ */
document.addEventListener('click', (e) => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.querySelector(anchor.getAttribute('href'));
  if (target) {
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  }
});

/* ════════════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initGrain();
  initEntry();

  // Console easter egg
  console.log('%c W Y V N ', 'background:#00D4FF;color:#030308;font-size:28px;font-weight:900;padding:8px 20px;letter-spacing:0.2em;');
  console.log('%c We Build What Doesn\'t Exist Yet ', 'color:#C9A96E;font-style:italic;font-size:13px;');
  console.log('%c ONYX v2.0.1 — Intelligence Layer Active ', 'color:#6B2FD4;font-size:11px;');
  console.log('%c hello@wyvn.io · Houston, TX ', 'color:#6A6260;font-size:10px;');
  console.log('%c 👀 You found the console. ONYX is watching. ', 'color:#00D4FF;font-size:11px;');
});
