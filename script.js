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
  gameTitle: "Just Chatting",
  notices: [
    "非全职个人势主播，虚拟形象画师&建模：심연의심연 (@gonggye_hs)",
    "随心所欲玩点游戏，主播是老社畜啦不用花钱投喂哦，点点关注就好",
    "欢迎好友++，个人主页https://keita.cc"
  ],
  themeEffect: "none", // Options: "none" | "lights" | "snow" | "both" | "newyear" | "halloween" | "romantic"
  layoutMode: "light",  // Options: "light" (Top Capsule HUD) | "full" (85% Game Frame + Bottom Dock)
  currentNoticeIndex: 0
};

// Cross-tab broadcast channel
const channel = new BroadcastChannel('obs_overlay_sync');
let atmosphereInstance = null;

// Lifecycle initialization
document.addEventListener('DOMContentLoaded', () => {
  initAtmosphere();
  initObsSceneAutoSwitch();
  initObsCustomCssListener();
  initUrlParams();
  initClock();
  initVuMeter();
  initNotices();
  initSyncListener();
  initDrawer();
});

// Realtime OBS Custom CSS variable watcher
let lastCssValues = { domain: '', title: '', notices: '', effect: '', mode: '', scene: '' };

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
    if (cleanEffect && cleanEffect !== lastCssValues.effect) {
      lastCssValues.effect = cleanEffect;
      if (cleanEffect !== state.themeEffect) {
        setThemeEffect(cleanEffect);
      }
    }
  }

  // 5. --layout-mode
  let rawMode = rootStyle.getPropertyValue('--layout-mode');
  if (rawMode) {
    let cleanMode = rawMode.trim().replace(/^["']|["']$/g, '').toLowerCase();
    if (cleanMode && cleanMode !== lastCssValues.mode) {
      lastCssValues.mode = cleanMode;
      if (cleanMode !== state.layoutMode) {
        setLayoutMode(cleanMode);
      }
    }
  }

  // 6. --obs-scene-name or --scene (manual CSS override for scene name)
  let rawScene = rootStyle.getPropertyValue('--obs-scene-name') || rootStyle.getPropertyValue('--scene');
  if (rawScene) {
    let cleanScene = rawScene.trim().replace(/^["']|["']$/g, '');
    if (cleanScene && cleanScene !== lastCssValues.scene) {
      lastCssValues.scene = cleanScene;
      evaluateSceneName(cleanScene);
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

  if (params.has('mode')) {
    setLayoutMode(params.get('mode').toLowerCase());
  }

  if (params.has('scene')) {
    evaluateSceneName(params.get('scene'));
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

// Realistic physics-based audio spectrum simulation with organic wave harmonics & floating peak caps
function initVuMeter() {
  const fills = document.querySelectorAll('.vu-bar-fill');
  const peaks = document.querySelectorAll('.vu-bar-peak');
  if (!fills || fills.length === 0) return;

  const barCount = fills.length;
  const currentScales = new Float32Array(barCount).fill(0.15);
  const targetScales = new Float32Array(barCount).fill(0.15);
  const peakScales = new Float32Array(barCount).fill(0.15);
  const peakHoldCounters = new Int16Array(barCount).fill(0);

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
      const lerpFactor = target > current ? 0.32 : 0.088;
      currentScales[i] += (target - current) * lerpFactor;
      const cur = currentScales[i];

      fills[i].style.transform = `scaleY(${cur.toFixed(3)})`;

      if (peaks[i]) {
        if (cur > peakScales[i]) {
          peakScales[i] = cur;
          peakHoldCounters[i] = 12; // Hold at transient peak for 12 frames
        } else {
          if (peakHoldCounters[i] > 0) {
            peakHoldCounters[i]--;
          } else {
            // Gravitational fall
            peakScales[i] = Math.max(cur, peakScales[i] - 0.016);
          }
        }
        const maxH = document.body.classList.contains('mode-full') ? 48 : 32;
        const peakPx = Math.min(maxH - 2.5, Math.max(2.5, peakScales[i] * maxH));
        peaks[i].style.bottom = `${peakPx.toFixed(1)}px`;
      }
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
    if (data.layoutMode !== undefined) {
      setLayoutMode(data.layoutMode);
    }
    if (data.sceneName !== undefined) {
      lastEvaluatedScene = '';
      evaluateSceneName(data.sceneName);
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
        const selectMode = document.getElementById('inputMode');
        if (selectMode) selectMode.value = state.layoutMode;
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

      const selectMode = document.getElementById('inputMode');
      if (selectMode) {
        setLayoutMode(selectMode.value);
      }
      
      updateDisplay();
      drawer.classList.remove('active');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => drawer.classList.remove('active'));
  }
}

// ================= Multi-Theme Hanging Decor & Bespoke Stage FX =================
function initHangingDecor(theme) {
  const container = document.getElementById('festiveLights');
  if (!container) return;

  container.innerHTML = '';
  // Garland string lights are specifically tailored for 'lights' and 'both'
  if (theme !== 'lights' && theme !== 'both') return;

  const swagCount = 5;
  const bulbsPerSwag = 7;
  const totalItems = swagCount * bulbsPerSwag;
  const maxSag = 24;

  // 1. Build SVG Swag Wire across the top overlay
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

  // 2. Build Cozy Glass Bulbs
  const track = document.createElement('div');
  track.className = 'festive-bulbs-track';

  const lightColors = ['color-gold', 'color-ruby', 'color-emerald', 'color-sapphire', 'color-amethyst'];

  for (let i = 0; i < totalItems; i++) {
    const posInSwag = (i % bulbsPerSwag) / (bulbsPerSwag - 1);
    const sagY = Math.sin(posInSwag * Math.PI) * maxSag;
    const delay = `${-(i * 0.22).toFixed(2)}s`;

    const socket = document.createElement('div');
    socket.style.top = `${sagY.toFixed(1)}px`;
    socket.style.animationDelay = delay;

    const colorClass = lightColors[i % lightColors.length];
    socket.className = `festive-bulb-socket ${colorClass}`;
    socket.innerHTML = `
      <div class="bulb-wire"></div>
      <div class="bulb-cap"></div>
      <div class="bulb-glass" style="animation-delay: ${-(i * 0.35).toFixed(2)}s;"></div>
    `;

    track.appendChild(socket);
  }

  container.appendChild(track);
}

class AtmosphereParticleFX {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.active = false;
    this.animId = null;
    this.mode = 'none';
    this.tick = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = 3840;
    this.canvas.height = 2160;
  }

  setMode(mode) {
    this.mode = mode;
    if (['snow', 'both', 'newyear', 'halloween', 'romantic'].includes(mode)) {
      this.start();
    } else {
      this.stop();
    }
  }

  start() {
    this.active = true;
    this.particles = [];
    this.tick = 0;

    let count = 90;
    if (this.mode === 'romantic') count = 65;
    else if (this.mode === 'newyear') count = 110;
    else if (this.mode === 'halloween') count = 75;

    for (let i = 0; i < count; i++) {
      if (this.mode === 'romantic') {
        // Falling Sakura Petals & Gentle Bokeh
        this.particles.push({
          x: Math.random() * 3840,
          y: Math.random() * 2160,
          w: Math.random() * 12 + 10,
          h: Math.random() * 16 + 14,
          speedY: Math.random() * 1.5 + 1.1,
          speedX: Math.random() * 0.8 + 0.4,
          windPhase: Math.random() * Math.PI * 2,
          windSpeed: Math.random() * 0.02 + 0.008,
          rotZ: Math.random() * Math.PI * 2,
          rotSpeedZ: (Math.random() - 0.5) * 0.035,
          pitchAngle: Math.random() * Math.PI * 2,
          pitchSpeed: Math.random() * 0.04 + 0.015,
          alpha: Math.random() * 0.55 + 0.35,
          isSparkle: i % 5 === 0
        });
      } else if (this.mode === 'newyear') {
        // Golden Foil Flecks & Celebration Embers
        const isEmber = i % 3 === 0;
        this.particles.push({
          x: Math.random() * 3840,
          y: Math.random() * 2160,
          size: isEmber ? Math.random() * 3 + 1.5 : Math.random() * 6 + 3,
          speedY: isEmber ? -(Math.random() * 1.4 + 0.8) : (Math.random() * 1.6 + 1.0),
          speedX: (Math.random() - 0.5) * 1.2,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.05,
          alpha: Math.random() * 0.7 + 0.3,
          isEmber: isEmber,
          color: isEmber 
            ? (i % 2 === 0 ? '#ef4444' : '#f59e0b') 
            : (i % 4 === 0 ? '#fde047' : '#fbbf24')
        });
      } else if (this.mode === 'halloween') {
        // Will-o'-the-Wisps & Spooky Rising Embers
        const isWisp = i < 10;
        this.particles.push({
          x: Math.random() * 3840,
          y: Math.random() * 2160,
          isWisp: isWisp,
          radius: isWisp ? Math.random() * 14 + 10 : Math.random() * 3 + 1.5,
          vx: isWisp ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 0.8,
          vy: isWisp ? (Math.random() - 0.5) * 1.2 : -(Math.random() * 1.5 + 0.8),
          trail: [],
          alpha: isWisp ? Math.random() * 0.4 + 0.35 : Math.random() * 0.65 + 0.25,
          color: isWisp
            ? (i % 2 === 0 ? 'rgba(168, 85, 247,' : 'rgba(56, 189, 248,')
            : (i % 3 === 0 ? '#f97316' : (i % 3 === 1 ? '#a855f7' : '#84cc16'))
        });
      } else {
        // Winter Snowfall
        this.particles.push({
          x: Math.random() * 3840,
          y: Math.random() * 2160,
          radius: Math.random() * 2.8 + 1.2,
          speedY: Math.random() * 1.4 + 0.8,
          alpha: Math.random() * 0.65 + 0.3,
          windPhase: Math.random() * Math.PI * 2,
          windSpeed: Math.random() * 0.015 + 0.008
        });
      }
    }

    if (!this.animId) {
      this.render();
    }
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
    this.tick++;
    ctx.clearRect(0, 0, 3840, 2160);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      if (this.mode === 'romantic') {
        p.windPhase += p.windSpeed;
        p.rotZ += p.rotSpeedZ;
        p.pitchAngle += p.pitchSpeed;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.windPhase) * 1.2;

        if (p.y > 2180) {
          p.y = -20;
          p.x = Math.random() * 3840;
        }
        if (p.x > 3860) p.x = -20;
        else if (p.x < -20) p.x = 3860;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotZ);

        if (p.isSparkle) {
          // Warm romantic starlight dust
          ctx.beginPath();
          ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(254, 205, 211, ${p.alpha * 0.9})`;
          ctx.shadowColor = '#fb7185';
          ctx.shadowBlur = 10;
          ctx.fill();
        } else {
          // 3D Flipping Cherry Blossom Petal
          const scaleY = Math.cos(p.pitchAngle);
          ctx.scale(1, scaleY);
          ctx.beginPath();
          ctx.ellipse(0, 0, p.w * 0.5, p.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 113, 133, ${p.alpha * 0.88})`;
          ctx.shadowColor = 'rgba(251, 113, 133, 0.45)';
          ctx.shadowBlur = 8;
          ctx.fill();
        }
        ctx.restore();

      } else if (this.mode === 'newyear') {
        p.rot += p.rotSpeed;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(this.tick * 0.02 + i) * 0.4;

        if (p.isEmber) {
          if (p.y < -20) {
            p.y = 2180;
            p.x = Math.random() * 3840;
          }
        } else {
          if (p.y > 2180) {
            p.y = -20;
            p.x = Math.random() * 3840;
          }
        }
        if (p.x > 3860) p.x = -20;
        else if (p.x < -20) p.x = 3860;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        ctx.beginPath();
        if (p.isEmber) {
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
        } else {
          // Gilded gold foil diamond
          ctx.rect(-p.size * 0.5, -p.size * 0.5, p.size, p.size * 0.7);
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 8;
        }
        ctx.fill();
        ctx.restore();

      } else if (this.mode === 'halloween') {
        if (p.isWisp) {
          // Wandering Ghostly Will-o'-the-Wisp
          p.x += p.vx + Math.sin(this.tick * 0.015 + i) * 1.4;
          p.y += p.vy + Math.cos(this.tick * 0.012 + i) * 1.2;

          if (p.x < 100 || p.x > 3740) p.vx *= -1;
          if (p.y < 80 || p.y > 2080) p.vy *= -1;

          // Trail handling
          p.trail.unshift({ x: p.x, y: p.y });
          if (p.trail.length > 5) p.trail.pop();

          for (let t = 0; t < p.trail.length; t++) {
            const tr = p.trail[t];
            const tAlpha = (p.alpha * (1 - t / p.trail.length) * 0.5).toFixed(2);
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, p.radius * (1 - t * 0.15), 0, Math.PI * 2);
            ctx.fillStyle = `${p.color} ${tAlpha})`;
            ctx.shadowColor = p.color.includes('168') ? '#a855f7' : '#38bdf8';
            ctx.shadowBlur = 18;
            ctx.fill();
          }
        } else {
          // Rising Spooky Ember
          p.y += p.vy;
          p.x += p.vx + Math.sin(this.tick * 0.03 + i) * 0.6;
          if (p.y < -20) {
            p.y = 2180;
            p.x = Math.random() * 3840;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.fill();
        }

      } else {
        // Winter Snowfall
        p.windPhase += p.windSpeed;
        p.y += p.speedY;
        p.x += Math.sin(p.windPhase) * 0.85;

        if (p.y > 2180) {
          p.y = -20;
          p.x = Math.random() * 3840;
        }
        if (p.x > 3860) p.x = -20;
        else if (p.x < -20) p.x = 3860;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.shadowBlur = 6;
        ctx.fill();
      }
    }

    this.animId = requestAnimationFrame(() => this.render());
  }
}

function initAtmosphere() {
  const canvas = document.getElementById('snowCanvas');
  if (canvas) {
    atmosphereInstance = new AtmosphereParticleFX(canvas);
  }
  initHangingDecor(state.themeEffect);
}

function setThemeEffect(effect) {
  const valid = ['none', 'lights', 'snow', 'both', 'newyear', 'halloween', 'romantic'];
  const mode = valid.includes(effect) ? effect : 'none';
  state.themeEffect = mode;

  document.body.classList.remove(
    'effect-lights', 'effect-snow', 'effect-both',
    'effect-newyear', 'effect-halloween', 'effect-romantic'
  );
  if (mode !== 'none') {
    document.body.classList.add(`effect-${mode}`);
  }

  initHangingDecor(mode);

  if (atmosphereInstance) {
    atmosphereInstance.setMode(mode);
  }

  const selectEl = document.getElementById('inputEffect');
  if (selectEl) selectEl.value = mode;
}

function setLayoutMode(mode) {
  if (!mode) return;
  const normalized = (mode.toLowerCase() === 'full') ? 'full' : 'light';

  // Guard against redundant DOM class thrashing and animation resets
  if (state.layoutMode === normalized && 
      document.body.classList.contains(`mode-${normalized}`)) {
    return;
  }

  state.layoutMode = normalized;

  document.body.classList.remove('mode-light', 'mode-full', 'mode-lite');
  document.body.classList.add(`mode-${normalized}`);
  if (normalized === 'light') {
    document.body.classList.add('mode-lite');
  }

  const selectEl = document.getElementById('inputMode');
  if (selectEl) selectEl.value = normalized;
}

let lastEvaluatedScene = '';

// Universal extractor supporting multiple OBS browser source event shapes & strings
function extractSceneName(data) {
  if (!data) return null;
  if (typeof data === 'string') return data.trim();
  if (typeof data === 'object') {
    const candidate = data.name || data.sceneName || data.current_program_scene ||
      (data.detail ? (typeof data.detail === 'string' ? data.detail : (data.detail.name || data.detail.sceneName)) : null) ||
      data.scene;
    if (typeof candidate === 'string') return candidate.trim();
  }
  return null;
}

// Evaluate scene name for automatic mode switching with zero-latency & anti-jitter
function evaluateSceneName(nameInput) {
  const sceneName = extractSceneName(nameInput);
  if (!sceneName) return;

  if (sceneName === lastEvaluatedScene) return;
  lastEvaluatedScene = sceneName;

  const lower = sceneName.toLowerCase();

  // Full mode markers: [full], 【full】, [全量], 【全量】, (full), （full）
  const isFull = lower.includes('[full]') || lower.includes('【full】') || 
                 lower.includes('[全量]') || lower.includes('【全量】') ||
                 lower.includes('(full)') || lower.includes('（full）');

  // Lite mode markers: [lite], 【lite】, [light], 【light】, [轻量], 【轻量】, (lite), （lite）
  const isLite = lower.includes('[lite]') || lower.includes('【lite】') || 
                 lower.includes('[light]') || lower.includes('【light】') ||
                 lower.includes('[轻量]') || lower.includes('【轻量】') ||
                 lower.includes('(lite)') || lower.includes('（lite）');

  if (isFull && !isLite) {
    setLayoutMode('full');
  } else if (isLite && !isFull) {
    setLayoutMode('light');
  }
}

// OBS Studio Native Scene Auto-Switch Engine
function initObsSceneAutoSwitch() {
  let obsCallbacksHooked = false;

  function hookObsStudioCallbacks() {
    if (obsCallbacksHooked || !window.obsstudio) return;
    obsCallbacksHooked = true;
    try {
      window.obsstudio.onSceneChange = function(scene) {
        const name = extractSceneName(scene);
        if (name) evaluateSceneName(name);
        else checkNativeScene();
      };
      window.obsstudio.onActiveChange = function() {
        checkNativeScene();
        setTimeout(checkNativeScene, 50);
      };
      window.obsstudio.onVisibilityChange = function() {
        checkNativeScene();
        setTimeout(checkNativeScene, 50);
      };
    } catch (e) {
      // Ignored if restricted
    }
  }

  function checkNativeScene() {
    if (window.obsstudio) {
      hookObsStudioCallbacks();
      if (typeof window.obsstudio.getCurrentScene === 'function') {
        try {
          window.obsstudio.getCurrentScene((scene) => {
            const name = extractSceneName(scene);
            if (name) {
              evaluateSceneName(name);
            }
          });
        } catch (e) {
          // Safe failover
        }
      }
    }
  }

  // 1. High-frequency bootstrap probes (0ms, 25ms, 60ms, 120ms, 250ms, 500ms, 1000ms)
  // Guarantees instant mode resolution as soon as OBS injects window.obsstudio
  [0, 25, 60, 120, 250, 500, 1000].forEach((delay) => {
    setTimeout(checkNativeScene, delay);
  });
  window.addEventListener('load', checkNativeScene);

  // 2. Real-time OBS Studio scene changed event (instantaneous event-driven response)
  window.addEventListener('obsSceneChanged', (event) => {
    const name = extractSceneName(event);
    if (name) {
      evaluateSceneName(name);
    } else {
      checkNativeScene();
    }
  });

  // 3. OBS transition & visibility lifecycle triggers (catches cutovers on transition start, cut & end)
  const lifecycleEvents = [
    'obsTransitionStarted',
    'obsTransitionEnded',
    'obsSourceVisibleChanged',
    'obsSourceActiveChanged',
    'obsSceneListChanged'
  ];
  lifecycleEvents.forEach((evtName) => {
    window.addEventListener(evtName, (event) => {
      const name = extractSceneName(event);
      if (name) {
        evaluateSceneName(name);
      }
      checkNativeScene();
      setTimeout(checkNativeScene, 40);
      setTimeout(checkNativeScene, 120);
      setTimeout(checkNativeScene, 260);
    });
  });

  // 4. Fast polling safeguard (250ms interval for near-instant fallback without CPU overhead)
  setInterval(checkNativeScene, 250);
}
