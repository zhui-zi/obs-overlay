/**
 * Gemini Aura 4K Overlay Core Engine
 * Capabilities:
 * - Realtime digital clock & calendar display
 * - Dynamic simulated VU audio meter animation
 * - Seamless infinite marquee track with dual-buffer auto-cloning
 * - Live CSS variable inspection for OBS Studio Custom CSS hot-reloading
 * - URL query parameter parser
 * - Realtime BroadcastChannel inter-window synchronization
 * - In-browser quick setting drawer
 */

const state = {
  brandDomain: "keita.cc",
  gameTitle: "黑神话：悟空",
  notices: [
    "✨ 欢迎来到直播间！点赞关注不迷路，交流群：888-666-999",
    "🌌 每天晚上 20:00 准时开播，感谢各位老铁的大力支持！",
    "🎮 PC最高画质全景光追 | 欢迎弹幕互动交流点歌！"
  ],
  themeEffect: "none", // Options: "none" | "lights" | "snow" | "both"
  currentNoticeIndex: 0
};

// Cross-tab broadcast channel
const channel = new BroadcastChannel('obs_overlay_sync');
let snowfallInstance = null;

// Lifecycle initialization
document.addEventListener('DOMContentLoaded', () => {
  initFestiveLights();
  initSnowfall();
  initObsCustomCssListener();
  initUrlParams();
  initClock();
  initVuMeter();
  initNotices();
  initSyncListener();
  initDrawer();
});

// Realtime OBS Custom CSS variable watcher
let lastCssValues = { domain: '', title: '', notices: '' };

function readObsCustomCss() {
  const rootStyle = getComputedStyle(document.documentElement);
  
  // 1. --brand-domain
  let rawDomain = rootStyle.getPropertyValue('--brand-domain');
  if (rawDomain) {
    let cleanDomain = rawDomain.trim().replace(/^["']|["']$/g, '');
    if (cleanDomain && cleanDomain !== lastCssValues.domain) {
      lastCssValues.domain = cleanDomain;
      state.brandDomain = cleanDomain;
    }
  }

  // 2. --game-title
  let rawTitle = rootStyle.getPropertyValue('--game-title');
  if (rawTitle) {
    let cleanTitle = rawTitle.trim().replace(/^["']|["']$/g, '');
    if (cleanTitle && cleanTitle !== lastCssValues.title) {
      lastCssValues.title = cleanTitle;
      state.gameTitle = cleanTitle;
    }
  }

  // 3. --notices or --game-notice
  let rawNotices = rootStyle.getPropertyValue('--notices') || rootStyle.getPropertyValue('--game-notice');
  if (rawNotices) {
    let cleanNotices = rawNotices.trim().replace(/^["']|["']$/g, '');
    if (cleanNotices && cleanNotices !== lastCssValues.notices) {
      lastCssValues.notices = cleanNotices;
      const parsed = cleanNotices.split('||').map(s => s.trim()).filter(Boolean);
      if (parsed.length > 0) {
        state.notices = parsed;
        renderSeamlessNotices();
      }
    }
  }

  // 4. --theme-effect
  let rawEffect = rootStyle.getPropertyValue('--theme-effect');
  if (rawEffect) {
    let cleanEffect = rawEffect.trim().replace(/^["']|["']$/g, '').toLowerCase();
    if (cleanEffect && cleanEffect !== state.themeEffect) {
      setThemeEffect(cleanEffect);
    }
  }

  updateDisplay();
}

function initObsCustomCssListener() {
  readObsCustomCss();
  window.addEventListener('load', readObsCustomCss);

  const observer = new MutationObserver(() => {
    readObsCustomCss();
  });
  observer.observe(document.head, { childList: true, subtree: true, characterData: true });

  setInterval(readObsCustomCss, 1200);
}

// URL query parameter parser
function initUrlParams() {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('domain')) state.brandDomain = params.get('domain');
  if (params.has('game')) state.gameTitle = params.get('game');
  
  if (params.has('notice')) {
    const customNotices = params.get('notice').split('||').map(s => s.trim()).filter(Boolean);
    if (customNotices.length > 0) {
      state.notices = customNotices;
      renderSeamlessNotices();
    }
  }

  if (params.has('effect')) {
    setThemeEffect(params.get('effect').toLowerCase());
  }

  updateDisplay();
}

// DOM renderer
function updateDisplay() {
  const elDomain = document.getElementById('brandDomain');
  const elTitle = document.getElementById('gameTitle');
  if (elDomain) elDomain.textContent = state.brandDomain;
  if (elTitle) elTitle.textContent = state.gameTitle;
}

// Clock & calendar tick with vertical roll ticker animation
function initClock() {
  const elClock = document.getElementById('clockDigits');
  const elSeconds = document.getElementById('clockSeconds');
  const elCalendar = document.getElementById('dateCalendar');
  const elDay = document.getElementById('dateDay');

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  let lastTimeStr = '';
  let lastSecStr = '';

  function rollTo(element, newValue, duration = 300) {
    if (!element) return;
    let track = element.querySelector('.roll-track');
    if (!track) {
      const currentVal = element.textContent.trim();
      element.innerHTML = `<div class="roll-track"><span class="roll-item">${currentVal}</span></div>`;
      track = element.querySelector('.roll-track');
    }

    const currentItem = track.firstElementChild;
    if (currentItem && currentItem.textContent === newValue) return;

    // Append incoming number below
    const nextItem = document.createElement('span');
    nextItem.className = 'roll-item';
    nextItem.textContent = newValue;
    track.appendChild(nextItem);

    // Smooth vertical roll transition
    track.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.9, 0.25, 1)`;
    track.style.transform = 'translateY(-50%)';

    const onEnd = () => {
      track.removeEventListener('transitionend', onEnd);
      track.style.transition = 'none';
      track.style.transform = 'translateY(0)';
      if (track.children.length > 1) {
        track.removeChild(track.children[0]);
      }
    };
    track.addEventListener('transitionend', onEnd, { once: true });
  }

  function tick() {
    const now = new Date();
    
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;

    if (ss !== lastSecStr) {
      lastSecStr = ss;
      rollTo(elSeconds, ss, 280);
    }

    if (timeStr !== lastTimeStr) {
      lastTimeStr = timeStr;
      rollTo(elClock, timeStr, 400);
    }

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    if (elCalendar) elCalendar.textContent = `${month}.${day}`;
    if (elDay) elDay.textContent = daysOfWeek[now.getDay()];
  }

  tick();
  setInterval(tick, 250); // Sample at 4Hz for zero-latency response
}

// Realistic physics-based audio spectrum simulation with organic wave harmonics & smooth decay
function initVuMeter() {
  const fills = document.querySelectorAll('.vu-bar-fill');
  if (!fills || fills.length === 0) return;

  const barCount = fills.length;
  const currentScales = new Float32Array(barCount).fill(0.15);
  const targetScales = new Float32Array(barCount).fill(0.15);

  let phase = 0;
  let beatTimer = 0;

  function updateTargets() {
    phase += 0.08;
    beatTimer++;
    const beat = Math.sin(beatTimer * 0.05) > 0.72 ? 0.35 : 0;

    for (let i = 0; i < barCount; i++) {
      // Frequency weighting: heavy resonant bass on left, agile flutter on right
      const freqFactor = 1 - (i / barCount) * 0.42;
      const wave1 = Math.sin(phase + i * 0.58);
      const wave2 = Math.cos(phase * 1.5 + i * 0.88);
      const noise = (Math.random() - 0.5) * 0.22;

      const energy = (wave1 * 0.34 + wave2 * 0.24 + noise + 0.48) * freqFactor + beat;
      targetScales[i] = Math.max(0.1, Math.min(0.96, energy));
    }
  }

  setInterval(updateTargets, 60);

  function renderLoop() {
    for (let i = 0; i < barCount; i++) {
      const target = targetScales[i];
      const current = currentScales[i];

      // Fast attack (rise), smooth damped decay (fall)
      const lerpFactor = target > current ? 0.28 : 0.085;
      currentScales[i] += (target - current) * lerpFactor;

      fills[i].style.transform = `scaleY(${currentScales[i].toFixed(3)})`;
    }
    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);
}

// Infinite seamless marquee renderer
function renderSeamlessNotices() {
  const elTrack = document.getElementById('noticeTrack');
  if (!elTrack) return;

  const notices = state.notices && state.notices.length > 0 
    ? state.notices 
    : ["✨ Welcome to the stream!"];

  function makeItemHtml(text) {
    return `<span class="notice-item">${text}<span class="notice-separator"><svg class="sparkle-icon" viewBox="0 0 24 24"><path d="M12 0C12 6.627 6.627 12 0 12c6.627 0 12 5.373 12 12 0-6.627 5.373-12 12-12-6.627 0-12-5.373-12-12z"/></svg></span></span>`;
  }

  let baseHtml = notices.map(makeItemHtml).join('');

  if (notices.length < 3) {
    baseHtml = baseHtml + baseHtml;
  }

  // Dual-buffer cloning: Track A + Track B for seamless loop
  elTrack.innerHTML = baseHtml + baseHtml;

  requestAnimationFrame(() => {
    const totalWidth = elTrack.scrollWidth;
    const halfWidth = totalWidth / 2;
    // Maintain a smooth translation velocity (~65px/s)
    const duration = Math.max(18, halfWidth / 65);
    elTrack.style.animationDuration = `${duration}s`;
  });
}

function initNotices() {
  renderSeamlessNotices();
}

// Inter-window BroadcastChannel listener
function initSyncListener() {
  channel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.brandDomain !== undefined) state.brandDomain = data.brandDomain;
    if (data.gameTitle !== undefined) state.gameTitle = data.gameTitle;
    if (data.notices && Array.isArray(data.notices)) {
      state.notices = data.notices;
      renderSeamlessNotices();
    }
    if (data.themeEffect !== undefined) {
      setThemeEffect(data.themeEffect);
    }

    updateDisplay();
  };
}

// In-browser quick setting drawer
function initDrawer() {
  const drawer = document.getElementById('quickDrawer');
  if (!drawer) return;

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key.toLowerCase() === 'c') {
      drawer.classList.toggle('active');
      if (drawer.classList.contains('active')) {
        document.getElementById('inputGame').value = state.gameTitle;
        document.getElementById('inputNotice').value = state.notices.join(' || ');
        const selectEffect = document.getElementById('inputEffect');
        if (selectEffect) selectEffect.value = state.themeEffect;
      }
    }
  });

  const btnApply = document.getElementById('btnDrawerApply');
  const btnClose = document.getElementById('btnDrawerClose');

  if (btnApply) {
    btnApply.addEventListener('click', () => {
      state.gameTitle = document.getElementById('inputGame').value;
      
      const noticesRaw = document.getElementById('inputNotice').value;
      if (noticesRaw) {
        state.notices = noticesRaw.split('||').map(s => s.trim()).filter(Boolean);
        renderSeamlessNotices();
      }

      const selectEffect = document.getElementById('inputEffect');
      if (selectEffect) {
        setThemeEffect(selectEffect.value);
      }
      
      updateDisplay();
      drawer.classList.remove('active');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => drawer.classList.remove('active'));
  }
}

// ================= Atmosphere Effects: Festive Lights & Snowfall =================
function initFestiveLights() {
  const container = document.getElementById('festiveLights');
  if (!container) return;

  container.innerHTML = '';
  const colors = ['color-gold', 'color-ruby', 'color-emerald', 'color-sapphire', 'color-amethyst'];
  
  const swagCount = 5; // 5 graceful garland wave arches
  const bulbsPerSwag = 7;
  const totalBulbs = swagCount * bulbsPerSwag;
  const maxSag = 24; // 24px vertical wave sag amplitude

  // 1. Build SVG Swag Wire
  const wireSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wireSvg.setAttribute('class', 'festive-wire-svg');
  wireSvg.setAttribute('viewBox', '0 0 1000 48');
  wireSvg.setAttribute('preserveAspectRatio', 'none');

  let pathD = 'M 0,6';
  const swagWidthRatio = 1000 / swagCount;
  for (let s = 0; s < swagCount; s++) {
    const startX = s * swagWidthRatio;
    const endX = (s + 1) * swagWidthRatio;
    const midX = (startX + endX) / 2;
    pathD += ` Q ${midX},${6 + maxSag} ${endX},6`;
  }

  const wirePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  wirePath.setAttribute('d', pathD);
  wirePath.setAttribute('class', 'festive-wire-path');
  wireSvg.appendChild(wirePath);
  container.appendChild(wireSvg);

  // 2. Build Wave-Draped Bulbs Track
  const bulbsTrack = document.createElement('div');
  bulbsTrack.className = 'festive-bulbs-track';

  for (let i = 0; i < totalBulbs; i++) {
    const posInSwag = (i % bulbsPerSwag) / (bulbsPerSwag - 1); // 0 to 1
    const sagY = Math.sin(posInSwag * Math.PI) * maxSag;

    const socket = document.createElement('div');
    const colorClass = colors[i % colors.length];
    socket.className = `festive-bulb-socket ${colorClass}`;
    socket.style.top = `${sagY.toFixed(1)}px`;
    socket.style.animationDelay = `${-(i * 0.22).toFixed(2)}s`;

    socket.innerHTML = `
      <div class="bulb-wire"></div>
      <div class="bulb-cap"></div>
      <div class="bulb-glass" style="animation-delay: ${-(i * 0.35).toFixed(2)}s;"></div>
    `;
    bulbsTrack.appendChild(socket);
  }

  container.appendChild(bulbsTrack);
}

class Snowfall {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.active = false;
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = 3840;
    this.canvas.height = 2160;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.particles = [];
    for (let i = 0; i < 115; i++) {
      this.particles.push({
        x: Math.random() * 3840,
        y: Math.random() * 2160,
        radius: Math.random() * 2.8 + 1.2,
        density: Math.random() * 1.2 + 0.6,
        alpha: Math.random() * 0.65 + 0.25,
        windPhase: Math.random() * Math.PI * 2,
        windSpeed: Math.random() * 0.015 + 0.008
      });
    }
    this.render();
  }

  stop() {
    this.active = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  render() {
    if (!this.active) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 3840, 2160);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.windPhase += p.windSpeed;
      p.y += p.density * 1.2;
      p.x += Math.sin(p.windPhase) * 0.85;

      if (p.y > 2160) {
        p.y = -10;
        p.x = Math.random() * 3840;
      }
      if (p.x > 3840) p.x = 0;
      else if (p.x < 0) p.x = 3840;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = p.radius * 2;
      ctx.fill();
    }

    this.animId = requestAnimationFrame(() => this.render());
  }
}

function initSnowfall() {
  const canvas = document.getElementById('snowCanvas');
  if (canvas) {
    snowfallInstance = new Snowfall(canvas);
  }
}

function setThemeEffect(effect) {
  const valid = ['none', 'lights', 'snow', 'both'];
  const mode = valid.includes(effect) ? effect : 'none';
  state.themeEffect = mode;

  document.body.classList.remove('effect-lights', 'effect-snow', 'effect-both');
  if (mode !== 'none') {
    document.body.classList.add(`effect-${mode}`);
  }

  if (snowfallInstance) {
    if (mode === 'snow' || mode === 'both') {
      snowfallInstance.start();
    } else {
      snowfallInstance.stop();
    }
  }

  const selectEl = document.getElementById('inputEffect');
  if (selectEl) selectEl.value = mode;
}
