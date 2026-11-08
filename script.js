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
  currentNoticeIndex: 0
};

// Cross-tab broadcast channel
const channel = new BroadcastChannel('obs_overlay_sync');

// Lifecycle initialization
document.addEventListener('DOMContentLoaded', () => {
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

  updateDisplay();
}

// DOM renderer
function updateDisplay() {
  const elDomain = document.getElementById('brandDomain');
  const elTitle = document.getElementById('gameTitle');
  if (elDomain) elDomain.textContent = state.brandDomain;
  if (elTitle) elTitle.textContent = state.gameTitle;
}

// Clock & calendar tick
function initClock() {
  const elClock = document.getElementById('clockDigits');
  const elSeconds = document.getElementById('clockSeconds');
  const elCalendar = document.getElementById('dateCalendar');
  const elDay = document.getElementById('dateDay');

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function tick() {
    const now = new Date();
    
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    
    if (elClock) elClock.textContent = `${hh}:${mm}`;
    if (elSeconds) elSeconds.textContent = ss;

    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    if (elCalendar) elCalendar.textContent = `${month}.${day}`;
    if (elDay) elDay.textContent = daysOfWeek[now.getDay()];
  }

  tick();
  setInterval(tick, 1000);
}

// Simulated dynamic VU meter
function initVuMeter() {
  const bars = document.querySelectorAll('.vu-bar');
  if (!bars || bars.length === 0) return;

  setInterval(() => {
    const volumeLevel = Math.random() * 0.95 + 0.05;
    const activeBarCount = Math.floor(volumeLevel * bars.length);

    bars.forEach((bar, index) => {
      let height = 0;
      if (index < activeBarCount) {
        height = Math.min(100, Math.floor(Math.random() * 40 + 60));
      } else if (index === activeBarCount) {
        height = Math.floor(Math.random() * 40 + 10);
      } else {
        height = Math.floor(Math.random() * 15);
      }
      const pseudoBar = bar.firstElementChild;
      if (pseudoBar) {
        pseudoBar.style.height = `${height}%`;
      }
    });
  }, 120);
}

// Infinite seamless marquee renderer
function renderSeamlessNotices() {
  const elTrack = document.getElementById('noticeTrack');
  if (!elTrack) return;

  const notices = state.notices && state.notices.length > 0 
    ? state.notices 
    : ["✨ Welcome to the stream!"];

  function makeItemHtml(text) {
    return `<span class="notice-item">${text}<span class="notice-separator">✦</span></span>`;
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

    updateDisplay();
  };
}

// In-browser quick setting drawer
function initDrawer() {
  const drawer = document.getElementById('quickDrawer');
  if (!drawer) return;

  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key.toLowerCase() === 'c') {
      drawer.classList.toggle('active');
      if (drawer.classList.contains('active')) {
        document.getElementById('inputGame').value = state.gameTitle;
        document.getElementById('inputNotice').value = state.notices.join(' || ');
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
      
      updateDisplay();
      drawer.classList.remove('active');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => drawer.classList.remove('active'));
  }
}
