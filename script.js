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
  gameTitle: "【游戏】黑神话：悟空",
  notices: [
    "没啥说的了，都来我家喝酒吧^^b"
  ],
  themeEffect: "none", // Options: "none" | "lights" | "snow" | "both" | "newyear" | "halloween" | "romantic"
  layoutMode: "light",  // Options: "light" (Top Capsule HUD) | "full" (85% Game Frame + Bottom Dock)
  dayLang: "zh",        // Options: "zh" (周日, 周一...) | "en" (SUN, MON...)
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
let lastCssValues = { domain: undefined, title: undefined, notices: undefined, effect: undefined, mode: undefined, scene: undefined };

function readObsCustomCss() {
  const rootStyle = getComputedStyle(document.documentElement);
  
  // 1. --brand-domain (or alias --band-domain)
  let rawDomain = rootStyle.getPropertyValue('--brand-domain') || rootStyle.getPropertyValue('--band-domain');
  if (rawDomain !== null && rawDomain !== undefined) {
    let cleanDomain = rawDomain.trim().replace(/^["']|["']$/g, '');
    if (cleanDomain !== lastCssValues.domain) {
      lastCssValues.domain = cleanDomain;
      state.brandDomain = cleanDomain;
    }
  }

  // 2. --title (or fallback --game-title)
  let rawTitle = rootStyle.getPropertyValue('--title') || rootStyle.getPropertyValue('--game-title');
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

  // 7. --day-lang
  let rawDayLang = rootStyle.getPropertyValue('--day-lang');
  if (rawDayLang) {
    let cleanDayLang = rawDayLang.trim().replace(/^["']|["']$/g, '').toLowerCase();
    if (cleanDayLang) state.dayLang = cleanDayLang;
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
  else if (params.has('brand')) state.brandDomain = params.get('brand');
  else if (params.has('band')) state.brandDomain = params.get('band');
  if (params.has('title')) state.gameTitle = params.get('title');
  else if (params.has('game')) state.gameTitle = params.get('game');
  
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

  if (params.has('daylang')) {
    state.dayLang = params.get('daylang').toLowerCase();
  } else if (params.has('lang')) {
    state.dayLang = params.get('lang').toLowerCase();
  }

  updateDisplay();
}

// Category badge definitions for Game Title
const CATEGORY_BADGE_CONFIG = {
  '游戏': {
    badgeClass: 'badge-game',
    iconSvg: `<svg class="game-badge-icon badge-icon-game" viewBox="0 0 24 24" fill="none">
      <path class="gamepad-chassis" d="M6.5 6.5h11a5.5 5.5 0 0 1 5.4 6.6l-1.2 5.5A2.8 2.8 0 0 1 19 20.8h-.2a3 3 0 0 1-2.9-2.2l-.7-2.6H8.8l-.7 2.6a3 3 0 0 1-2.9 2.2H5a2.8 2.8 0 0 1-2.7-2.2L1.1 13.1A5.5 5.5 0 0 1 6.5 6.5z" fill="rgba(56, 189, 248, 0.22)" stroke="#38bdf8" stroke-width="1.5" stroke-linejoin="round"/>
      <path class="gamepad-dpad" d="M6 10.5v3M4.5 12h3" stroke="#e0f2fe" stroke-width="1.5" stroke-linecap="round"/>
      <circle class="gamepad-btn btn-top" cx="17.5" cy="10.5" r="1" fill="#f43f5e"/>
      <circle class="gamepad-btn btn-left" cx="16" cy="12" r="1" fill="#38bdf8"/>
      <circle class="gamepad-btn btn-right" cx="19" cy="12" r="1" fill="#4ade80"/>
      <circle class="gamepad-btn btn-bottom" cx="17.5" cy="13.5" r="1" fill="#facc15"/>
    </svg>`
  },
  '观影': {
    badgeClass: 'badge-movie',
    iconSvg: `<svg class="game-badge-icon badge-icon-movie" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="10" width="18" height="10" rx="2" fill="rgba(251, 191, 36, 0.2)" stroke="#fbbf24" stroke-width="1.5"/>
      <line x1="3" y1="14" x2="21" y2="14" stroke="rgba(251, 191, 36, 0.4)" stroke-width="1"/>
      <circle cx="7" cy="17" r="1" fill="#fde68a"/>
      <line x1="11" y1="17" x2="17" y2="17" stroke="#fde68a" stroke-width="1.2" stroke-linecap="round"/>
      <g class="clapper-arm">
        <path d="M3 6.5h18l-1.5 3.5H3z" fill="rgba(251, 191, 36, 0.3)" stroke="#fbbf24" stroke-width="1.4" stroke-linejoin="round"/>
        <line x1="6.5" y1="6.5" x2="8.5" y2="10" stroke="#fef08a" stroke-width="1.4"/>
        <line x1="11.5" y1="6.5" x2="13.5" y2="10" stroke="#fef08a" stroke-width="1.4"/>
        <line x1="16.5" y1="6.5" x2="18.5" y2="10" stroke="#fef08a" stroke-width="1.4"/>
      </g>
    </svg>`
  },
  '杂谈': {
    badgeClass: 'badge-chat',
    iconSvg: `<svg class="game-badge-icon badge-icon-chat" viewBox="0 0 24 24" fill="none">
      <path class="chat-bubble-back" d="M14 4h-4a6 6 0 0 0-6 6c0 1.9.9 3.6 2.3 4.7L5.5 18l3.6-1.2c.3.1.6.1.9.1h4a6 6 0 0 0 6-6 6 6 0 0 0-6-6z" fill="rgba(52, 211, 153, 0.15)" stroke="rgba(52, 211, 153, 0.5)" stroke-width="1.2" stroke-linejoin="round"/>
      <g class="chat-bubble-front">
        <path d="M14 8h-4a5 5 0 0 0-5 5c0 1.6.7 3 1.9 3.9L6 20l3.1-1c.3.1.6.1.9.1h4a5 5 0 0 0 5-5 5 5 0 0 0-5-5z" fill="rgba(52, 211, 153, 0.28)" stroke="#34d399" stroke-width="1.4" stroke-linejoin="round"/>
        <circle class="chat-dot chat-dot-1" cx="9.5" cy="13" r="1.1" fill="#ecfdf5"/>
        <circle class="chat-dot chat-dot-2" cx="12" cy="13" r="1.1" fill="#ecfdf5"/>
        <circle class="chat-dot chat-dot-3" cx="14.5" cy="13" r="1.1" fill="#ecfdf5"/>
      </g>
    </svg>`
  }
};

function parseTitleCategory(rawTitle) {
  if (!rawTitle) return { hasCategory: false, cleanTitle: '' };
  const str = String(rawTitle).trim();
  const match = str.match(/^\s*[【\[](游戏|观影|杂谈)[】\]]\s*(.*)$/);
  if (!match) {
    return { hasCategory: false, cleanTitle: str };
  }
  const category = match[1];
  const remaining = match[2].trim();
  return {
    hasCategory: true,
    category,
    cleanTitle: remaining || category,
    config: CATEGORY_BADGE_CONFIG[category]
  };
}

// DOM renderer
function updateDisplay() {
  const elDomain = document.getElementById('brandDomain');
  const elDomainBay = document.querySelector('.brand-domain-bay');
  const elTitle = document.getElementById('gameTitle');
  const elBadge = document.getElementById('gameBadge');
  const elBadgeIcon = document.getElementById('gameBadgeIcon');
  const elBadgeText = document.getElementById('gameBadgeText');

  const rawDomain = state.brandDomain ? String(state.brandDomain).trim() : '';
  const isDomainEmpty = !rawDomain || rawDomain.toLowerCase() === 'none';

  if (elDomainBay) {
    elDomainBay.classList.toggle('hidden', isDomainEmpty);
    elDomainBay.style.display = isDomainEmpty ? 'none' : 'flex';
  }
  if (elDomain) {
    elDomain.textContent = isDomainEmpty ? '' : rawDomain;
  }

  const parsed = parseTitleCategory(state.gameTitle);

  if (parsed.hasCategory && parsed.config) {
    if (elBadge) {
      elBadge.className = `game-badge ${parsed.config.badgeClass}`;
      elBadge.style.display = 'inline-flex';
    }
    if (elBadgeIcon) {
      elBadgeIcon.innerHTML = parsed.config.iconSvg;
    }
    if (elBadgeText) {
      elBadgeText.textContent = parsed.category;
    }
    if (elTitle) {
      elTitle.textContent = parsed.cleanTitle;
    }
  } else {
    if (elBadge) {
      elBadge.style.display = 'none';
      elBadge.className = 'game-badge';
    }
    if (elTitle) {
      elTitle.textContent = parsed.cleanTitle;
    }
  }
}

// Clock & calendar tick with vertical roll ticker animation
function initClock() {
  const elClock = document.getElementById('clockDigits');
  const elSeconds = document.getElementById('clockSeconds');
  const elCalendar = document.getElementById('dateCalendar');
  const elDay = document.getElementById('dateDay');

  const daysOfWeekZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const daysOfWeekEn = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
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
    const days = state.dayLang === 'en' ? daysOfWeekEn : daysOfWeekZh;
    if (elDay) elDay.textContent = days[now.getDay()];
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
        const inputDomain = document.getElementById('inputDomain');
        if (inputDomain) inputDomain.value = state.brandDomain;
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
      const inputDomain = document.getElementById('inputDomain');
      if (inputDomain && inputDomain.value.trim()) {
        state.brandDomain = inputDomain.value.trim();
      }
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
    if (['snow', 'both', 'newyear', 'romantic'].includes(mode)) {
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
    if (this.mode === 'romantic') count = 140;
    else if (this.mode === 'newyear') count = 110;

    for (let i = 0; i < count; i++) {
      if (this.mode === 'romantic') {
        // Multi-layered Falling Sakura Petals (Hanafubuki) & Soft Starlight Bokeh
        const isSparkle = i % 7 === 0;
        const depth = Math.random(); // 0: far/small/gentle, 1: foreground/large
        const baseW = 11 + depth * 15; // 11 to 26px
        const baseH = 15 + depth * 19; // 15 to 34px
        this.particles.push({
          x: Math.random() * 3840,
          y: Math.random() * 2160,
          w: baseW,
          h: baseH,
          depth: depth,
          speedY: 0.9 + depth * 1.6 + Math.random() * 0.4,
          speedX: 0.6 + depth * 0.9 + Math.random() * 0.5,
          swayAmp: 1.4 + depth * 1.8,
          windPhase: Math.random() * Math.PI * 2,
          windSpeed: Math.random() * 0.022 + 0.01,
          rotZ: Math.random() * Math.PI * 2,
          rotSpeedZ: (Math.random() - 0.5) * 0.045,
          pitchAngle: Math.random() * Math.PI * 2,
          pitchSpeed: Math.random() * 0.038 + 0.016,
          rollAngle: Math.random() * Math.PI * 2,
          rollSpeed: Math.random() * 0.028 + 0.012,
          alpha: (0.42 + depth * 0.5) * (Math.random() * 0.3 + 0.7),
          colorTier: i % 3,
          isSparkle: isSparkle
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
        p.rollAngle += p.rollSpeed;

        // Flutter effect: falls slightly faster when slicing the wind, drifts slower when flat
        const flutter = 0.8 + 0.4 * Math.abs(Math.sin(p.pitchAngle));
        p.y += p.speedY * flutter;
        p.x += p.speedX + Math.sin(p.windPhase) * p.swayAmp;

        if (p.y > 2190) {
          p.y = -30;
          p.x = Math.random() * 3840;
        }
        if (p.x > 3880) p.x = -30;
        else if (p.x < -30) p.x = 3880;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotZ);

        if (p.isSparkle) {
          // Warm romantic starlight dust / ambient blossom pollen
          ctx.beginPath();
          ctx.arc(0, 0, 2.2 + p.depth * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(254, 205, 211, ${p.alpha * 0.9})`;
          ctx.shadowColor = '#fb7185';
          ctx.shadowBlur = 12;
          ctx.fill();
        } else {
          // 3D Pitch & Roll True Sakura Petal with Notched Tip
          const scaleY = Math.cos(p.pitchAngle);
          const scaleX = Math.cos(p.rollAngle);
          ctx.scale(Math.abs(scaleX) < 0.12 ? 0.12 : scaleX, Math.abs(scaleY) < 0.12 ? 0.12 : scaleY);

          const hw = p.w * 0.5;
          const hh = p.h * 0.5;

          ctx.beginPath();
          ctx.moveTo(0, hh);
          // Left lobe curving out and up to notch tip
          ctx.bezierCurveTo(-hw * 0.92, hh * 0.58, -hw * 1.08, -hh * 0.22, -hw * 0.45, -hh);
          // Heart-shaped notch indent
          ctx.quadraticCurveTo(0, -hh * 0.65, hw * 0.45, -hh);
          // Right lobe curving down to base
          ctx.bezierCurveTo(hw * 1.08, -hh * 0.22, hw * 0.92, hh * 0.58, 0, hh);
          ctx.closePath();

          // Delicate multi-tone blossom gradient
          const grad = ctx.createLinearGradient(0, hh, 0, -hh);
          if (p.colorTier === 0) {
            grad.addColorStop(0, `rgba(255, 241, 242, ${p.alpha * 0.95})`);
            grad.addColorStop(0.45, `rgba(251, 207, 232, ${p.alpha * 0.9})`);
            grad.addColorStop(1, `rgba(244, 114, 182, ${p.alpha})`);
          } else if (p.colorTier === 1) {
            grad.addColorStop(0, `rgba(255, 255, 255, ${p.alpha})`);
            grad.addColorStop(0.5, `rgba(254, 226, 226, ${p.alpha * 0.9})`);
            grad.addColorStop(1, `rgba(251, 113, 133, ${p.alpha * 0.88})`);
          } else {
            grad.addColorStop(0, `rgba(253, 232, 238, ${p.alpha * 0.92})`);
            grad.addColorStop(0.5, `rgba(244, 63, 94, ${p.alpha * 0.86})`);
            grad.addColorStop(1, `rgba(225, 29, 72, ${p.alpha * 0.95})`);
          }

          ctx.fillStyle = grad;
          ctx.shadowColor = 'rgba(251, 113, 133, 0.4)';
          ctx.shadowBlur = p.depth > 0.6 ? 10 : 5;
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
