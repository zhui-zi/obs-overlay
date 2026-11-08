/**
 * Smartisan Warm Wood Edition - 4K Overlay Script
 * Features:
 * - Realtime digital clock & uptime counter
 * - Dynamic animated VU audio meter simulation
 * - Multi-message rotating marquee notice board with high-dpi speed
 * - URL parameters parsing for instant OBS scene setup
 * - BroadcastChannel sync with standalone controller.html
 * - In-browser quick setting drawer (press 'C')
 */

// 默认状态配置
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

// 跨页面双向通信通道
const channel = new BroadcastChannel('obs_overlay_sync');

// 初始化 DOM
document.addEventListener('DOMContentLoaded', () => {
  initObsCustomCssListener();
  initUrlParams();
  initClock();
  initVuMeter();
  initNotices();
  initSyncListener();
  initDrawer();
});

// 监听并实时读取 OBS「自定义 CSS」中注入的变量
let lastCssValues = { domain: '', title: '', notices: '' };

function readObsCustomCss() {
  const rootStyle = getComputedStyle(document.documentElement);
  
  // 1. 读取 --brand-domain
  let rawDomain = rootStyle.getPropertyValue('--brand-domain');
  if (rawDomain) {
    let cleanDomain = rawDomain.trim().replace(/^["']|["']$/g, '');
    if (cleanDomain && cleanDomain !== lastCssValues.domain) {
      lastCssValues.domain = cleanDomain;
      state.brandDomain = cleanDomain;
    }
  }

  // 2. 读取 --game-title
  let rawTitle = rootStyle.getPropertyValue('--game-title');
  if (rawTitle) {
    let cleanTitle = rawTitle.trim().replace(/^["']|["']$/g, '');
    if (cleanTitle && cleanTitle !== lastCssValues.title) {
      lastCssValues.title = cleanTitle;
      state.gameTitle = cleanTitle;
    }
  }

  // 3. 读取 --notices 或 --game-notice
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

// 1. 读取 URL Query 参数
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

// 2. 更新 DOM 渲染
function updateDisplay() {
  const elDomain = document.getElementById('brandDomain');
  const elTitle = document.getElementById('gameTitle');
  if (elDomain) elDomain.textContent = state.brandDomain;
  if (elTitle) elTitle.textContent = state.gameTitle;
}

// 3. 时钟与日期指示器
function initClock() {
  const elClock = document.getElementById('clockDigits');
  const elSeconds = document.getElementById('clockSeconds');
  const elCalendar = document.getElementById('dateCalendar');
  const elDay = document.getElementById('dateDay');

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  function tick() {
    const now = new Date();
    
    // 时分秒
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    
    if (elClock) elClock.textContent = `${hh}:${mm}`;
    if (elSeconds) elSeconds.textContent = ss;

    // 日期
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    if (elCalendar) elCalendar.textContent = `${month}.${day}`;
    if (elDay) elDay.textContent = daysOfWeek[now.getDay()];
  }

  tick();
  setInterval(tick, 1000);
}

// 4. 模拟拟物 VU 电平表动态跳动
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

// 5. 无缝无限循环跑马灯 (双轨克隆首尾相接，100% 零空白)
function renderSeamlessNotices() {
  const elTrack = document.getElementById('noticeTrack');
  const elViewport = document.getElementById('noticeViewport');
  if (!elTrack) return;

  const notices = state.notices && state.notices.length > 0 
    ? state.notices 
    : ["欢迎来到直播间！"];

  // 单条项模板生成函数
  function makeItemHtml(text) {
    return `<span class="notice-item">${text}<span class="notice-separator">✦</span></span>`;
  }

  // 基础单组拼接
  let baseHtml = notices.map(makeItemHtml).join('');

  // 如果公告条目过少，多重复几次确保第一段足够长
  if (notices.length < 3) {
    baseHtml = baseHtml + baseHtml;
  }

  // 核心：无缝克隆，A 组紧接 B 组形成两段完全相同的内容
  elTrack.innerHTML = baseHtml + baseHtml;

  // 根据总宽度动态计算滚动周期，保证恒定舒适的移速 (约 65px/s)
  // 在下一帧计算实际渲染宽度
  requestAnimationFrame(() => {
    const totalWidth = elTrack.scrollWidth;
    const halfWidth = totalWidth / 2;
    // 移速约每 65px 耗费 1 秒
    const duration = Math.max(18, halfWidth / 65);
    elTrack.style.animationDuration = `${duration}s`;
  });
}

function initNotices() {
  renderSeamlessNotices();
}

// 6. 跨窗口通信监听
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

// 7. 内置快捷抽屉 (测试模式按 'C' 唤起)
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
