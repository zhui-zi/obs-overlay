# Gemini Aura 4K Overlay (OBS HUD & Full Stage Suite)

> **4K Skeuomorphic Obsidian Live Broadcast HUD & Full-Screen Stage Package for OBS Studio**  
> **专为 OBS Studio 与高品质直播打造的 4K 拟态黑曜石流光 HUD 与全景舞台包装套件**

---

## 🌟 Key Highlights / 核心特性一览

* 🌓 **Dual-Mode Dynamic Architecture / 双布局模式架构**  
  * **Lightweight Mode (`lite` / `light`)**: Pinned suspended top capsule HUD (`2250px × 88px`), minimal, distraction-free, and sleek.  
    *(轻量模式：顶部居中悬浮极简微晶胶囊条，全屏沉浸，适合无需画面框线的全屏游戏场景)*
  * **Full Stage Mode (`full`)**: 85% 4K Game Viewport Frame (`3264px × 1836px`, strict 16:9) with an enlarged broadcast-grade bottom dock bar (`112px` height, `1000px` notice marquee, `38px` titles, `48px` VU meter, and `58px` giant roll clock).  
    *(全量模式：4K 的 85% 标准 16:9 游戏外框，配备 112px 大号底部右对齐多功能功能条与 1000px 大字号公告)*

* 🎬 **Smart OBS Scene Auto-Switching / 场景名称智能感应切换**  
  * Uses native OBS Studio Browser Source API (`window.obsstudio`) and `obsSceneChanged` event.  
  * Automatically switches to **Full Mode** if the scene name contains `[full]` (e.g., `Gaming [full]`).  
  * Automatically switches to **Lite Mode** if the scene name contains `[lite]` or `[light]` (e.g., `Just Chatting [lite]`).  
    *(原生集成 OBS 内核 API，场景名称包含 `[full]` 自动转为全量游戏框，包含 `[lite]` 自动转为顶部轻量胶囊)*

* 🛡️ **22px Thick Obsidian Bezel & Anti-Corner Masking / 22px 实体黑曜石外框与方角遮挡**  
  * The Full Mode game frame features an 18px thick solid obsidian chassis plus 4px outer glowing conic rainbow rim (22px total composite bezel) with corner armor shields.  
  * Overlaps the outer perimeter of square 16:9 game captures underneath, **100% eliminating and masking sharp 90-degree square corners**.  
    *(18px 实体黑曜石微晶底框 + 4px 彩虹流光外缘，叠压覆盖游戏抓取源直角，彻底解决方角露馅与毛刺)*

* 📊 **12-Band Continuous Chromatic VU Equalizer / 12 频段无缝连续流光音频频谱**  
  * Continuous horizontal gradient across all 12 bars matching the outer frame (Cyan ➔ Lavender ➔ Rose ➔ Amber), eliminating single-bar isolated blocky colors.  
  * Dual-layer vertical glass shine with 1.5px / 2px floating crystal transient peak needles and gravitational falloff physics.  
    *(全频段连续横向流光切片渐变 + 晶莹垂直高光透镜 + 悬浮发光瞬态峰值保持针，告别单调单色色块)*

* 🎆 **Bespoke Full-Screen Festive Atmospheres / 独立定制全屏舞台氛围**  
  * Drapes and stages are custom-crafted across the entire 4K broadcast screen, not restricted to string bulbs:  
    * **Chinese New Year (`newyear`)**: Flanking grand red palace lanterns with gold tassels, corner gold clouds, and gold foil dust.  
    * **Halloween Night (`halloween`)**: Top-left spiderweb with bobbing spider, top-right gnarled bare tree with glowing blinking eyes, flying bats, and bottom glowing Jack-o'-Lantern.  
    * **Romantic Sakura (`romantic`)**: Sprawling flowering cherry branches swaying in breeze + true 3D Hanafubuki falling petal storm.  
    * **Holiday Garland Lights (`lights`)**: Cozy draping garland wave string lights over HUD.  
    * **Winter Frost & Snow (`snow` / `both`)**: Multi-plane snowfall with crystalline icicles.

---

## 📐 Layout Architecture & Geometry / 布局规格与几何测算

### 1. Full Stage Mode (`mode-full`) / 全量模式

```text
+------------------------------------------------------------------------------------------------+
|  [Left Sidebar: 528px Margin]    [Top Margin: 36px]             [Right Margin: 48px]           |
|                                  +-----------------------------------------------------------+ |
|  - Reserved for:                 |                                                           | |
|    * Camera / Facecam Box        |                                                           | |
|    * VTuber Avatar Model         |           85% 4K GAME VIEWPORT DISPLAY AREA               | |
|    * Live Chat Stream            |                     (3264 × 1836)                         | |
|  - Upper Stage Decor:            |             * 18px Solid Obsidian Chassis Bezel           | |
|    * Palace Lanterns             |             * 4px Outer Gemini Rainbow Conic Rim          | |
|    * Spooky Cobweb / Spider      |             * Corner Armor Shields (Zero Square Corner)   | |
|    * Blooming Sakura Branch      |                                                           | |
|                                  |                                                           | |
|                                  +-----------------------------------------------------------+ |
|  [Bottom Margin: 288px]                                                                        |
|  - Left Space (Mascot / Pet)     +-----------------------------------------------------------+ |
|    * Halloween Jack-o'-Lantern   | [Marquee (1000px)] [Game (38px)] [Domain/VU] [Clock(58px)] | |
|                                  +-----------------------------------------------------------+ |
+------------------------------------------------------------------------------------------------+
```

| Region / Parameter | Dimension (4K Canvas: 3840 × 2160) | Purpose & Design Rationale / 设计意图与定位 |
| :--- | :--- | :--- |
| **Game Viewport** | `3264px × 1836px` (Strict 16:9) | 85% scale of 4K, positioned at `top: 36px; right: 48px;` |
| **Top & Right Margins** | `36px` top, `48px` right | Compact margin for tight, elegant screen framing |
| **Left Sidebar Margin** | `528px` width (`0px` to `528px`) | Spacious zone reserved for webcam, VTuber model, or chat box |
| **Bottom Margin** | `288px` height (`1872px` to `2160px`) | Houses the enlarged right-aligned dock and stage decor |
| **Bottom Dock Bar** | Height `112px`, docked at `bottom: 40px; right: 48px;` | Aligned pixel-perfect with the right edge of the game viewport frame |
| **Notice Marquee** | Width `1000px`, Font `34px` | Balanced compact width and clear text for effortless readability |
| **Clock Roller** | Height `64px`, Font `58px` | Giant prominent studio master clock with rolling digit physics |

---

### 2. Lightweight Mode (`mode-light` / `mode-lite`) / 轻量模式

* **Position**: Pinned suspended top-center at `top: 28px; left: 50%; transform: translateX(-50%);`.
* **Dimensions**: `2250px × 88px` (2/3 4K screen width).
* **Best For**: Full-screen immersion games (FPS, AAA open-world titles, esports) without window borders.

---

## 🎨 Themes & Atmosphere Gallery / 节日与舞台特效速查

| Key | Theme Name (EN / 中文) | Stage Visual Elements / 全屏独立定制舞台元素 | Particle & Atmosphere FX |
| :--- | :--- | :--- | :--- |
| `none` | Standard Aura / 经典极简 | Obsidian glass + rotating Gemini rainbow rim | 0 CPU (Canvas loop sleeps automatically) |
| `lights` | Holiday Lights / 节日彩灯 | 5-swag Bezier garland wave string lights over HUD | Clean warm filament glow |
| `snow` | Winter Snowfall / 冬日飘雪 | Screen top corner ice frost and crystalline icicles | Multi-plane gentle snowfall |
| `both` | Lights + Snow / 彩灯飘雪 | Garland wave string lights + corner icicles | Gentle snowfall |
| `newyear` | Chinese New Year / 中国新年 | Flanking swinging red silk palace lanterns + golden auspicious clouds + HUD golden corner brackets | Shimmering gold foil diamonds & rising red celebratory embers |
| `halloween` | Halloween Night / 万圣暗夜 | Top-left cobweb with bobbing spider + top-right gnarled tree with blinking eyes + flying bats + bottom glowing Jack-o'-Lantern | Wandering ghostly will-o'-the-wisps with soft trails & purple embers |
| `romantic` | Romantic Sakura / 盛放春樱 | Top-right & top-left sprawling blooming cherry blossom branches swaying in spring breeze | True 3D Hanafubuki (tumbling falling cherry blossom petals) & warm bokeh |

---

## ⚙️ Control & Configuration Methods / 控制与配置方法

### 1. OBS Scene Name Auto-Detection (Recommended) / 场景名称智能识别（推荐）

Rename your OBS Studio scenes to include `[full]` or `[lite]`:
* `Main Game [full]` (or `【full】`, `[全量]`, `【全量】`) ➔ Overlay instantly transforms into **Full Stage Mode** with 85% game frame.
* `Chatting [lite]` (or `[light]`, `【lite】`, `【light】`, `[轻量]`, `【轻量】`) ➔ Overlay instantly transforms into **Lightweight Top Capsule HUD**.

> **💡 OBS Permission Tip / OBS 权限设置提示**:  
> In OBS Studio Browser Source properties, ensure **Page permissions** (页面权限) is set to **"Read access to user information"** (只读访问用户信息) or higher, which grants native event access (`obsSceneChanged`, `obsTransitionStarted`) for zero-latency instant switching.

*(支持英文半角 `[full]` / `[lite]` 与中文全角 `【full】` / `【lite】` / `【全量】` / `【轻量】`，切场景即刻毫秒级响应)*

---

### 2. OBS Custom CSS Live Parameters / OBS 自定义 CSS 热更新

In OBS Studio, right-click your Browser Source ➔ **Properties** ➔ **Custom CSS**:

```css
:root {
  /* Layout Mode: "light" (or "lite") | "full" */
  --layout-mode: "full";

  /* Optional Scene Name Override (Alternative to OBS API) */
  --obs-scene-name: "Gaming [full]";

  /* Thematic Atmosphere Effect:
     "none" | "lights" | "snow" | "both" | "newyear" | "halloween" | "romantic" */
  --theme-effect: "newyear";

  /* Brand domain label (left bay) */
  --brand-domain: "keita.cc";

  /* Game title */
  --game-title: "Black Myth: Wukong";

  /* Notice marquee items separated by || */
  --notices: "✨ Welcome to the stream! || 🌌 Live daily at 20:00 || 🎮 4K Ray Tracing Enabled";
}
```

---

### 3. URL Query Parameters / URL 查询参数一键载入

```text
https://obs.keita.cc/?mode=full&effect=newyear&domain=keita.cc&game=Elden+Ring
```

Supported query keys:
* `mode`: `full` | `light` | `lite`
* `scene`: e.g. `Apex+[full]`
* `effect`: `none` | `lights` | `snow` | `both` | `newyear` | `halloween` | `romantic`
* `domain`: e.g. `keita.cc`
* `game`: e.g. `Black+Myth`
* `notice`: `Notice+One||Notice+Two`

---

### 4. Real-Time Web Controller / 专属远程控制台

Open [`controller.html`](file:///C:/Users/keita/.gemini/antigravity/scratch/obs-skeuomorphic-overlay/controller.html) in any browser window:
* Switch between **Lightweight Mode** and **Full Stage Mode** with live broadcast synchronization.
* Simulate OBS scene names (`[full]` / `[lite]`) with 1-click preset chips.
* Update Game Title, Notices, and Theme Effects on the fly via `BroadcastChannel` with zero OBS reload needed.

---

### 5. In-Browser Quick Settings Drawer / 快捷管理抽屉

* Press keyboard shortcut **`C`** on the overlay page to open/close the quick settings drawer.
* Switch Layout Mode, change active game title, update marquee notices, or pick visual effects in 1 second.

---

## 🚀 Quick Setup in OBS Studio / OBS Studio 极速上手

1. In OBS Studio, add a **Browser Source (浏览器源)** to your scene.
2. Set **URL** to your deployed web URL (e.g. `https://obs.keita.cc`) or local absolute file path to `index.html`.
3. Set Canvas Dimensions:
   * **Width**: `3840`
   * **Height**: `2160`
   * **FPS**: `60`
4. In Full Mode, add your **Game Capture (游戏源)** or **Window Capture (窗口采集)** and place it **underneath** the browser source in the source order:
   * Position game capture at $(X = 528\text{px}, Y = 36\text{px})$.
   * Set game capture size to `3264 × 1836`.
   * The 18px obsidian frame will overlap the game boundaries, seamlessly hiding all sharp square corners!
5. Recommended settings:
   * Check **Shutdown source when not visible** (不可见时关闭源).
   * Check **Refresh browser when scene becomes active** (场景激活时刷新浏览器).

---

## 📄 License & Open Source

Crafted with high-precision CSS3, SVG vectors, Canvas 2D, and native OBS Studio CEF APIs.  
Available on GitHub: [`https://github.com/zhui-zi/obs-overlay`](https://github.com/zhui-zi/obs-overlay)
