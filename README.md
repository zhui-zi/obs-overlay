# Gemini Aura 4K Overlay (OBS HUD & Full Stage Suite)

> **4K Skeuomorphic Obsidian Live Broadcast HUD & Full-Screen Stage Package for OBS Studio**

---

## 🌟 Key Highlights

* 🌓 **Dual-Mode Dynamic Architecture**
  * **Lightweight Mode (`lite` / `light`)**: Pinned suspended top capsule HUD (`2250px × 88px`), minimal, distraction-free, and sleek. Perfect for full-screen immersion gaming where no window frames are needed.
  * **Full Stage Mode (`full`)**: 85% 4K Game Viewport Frame (`3264px × 1836px`, strict 16:9) with an enlarged broadcast-grade bottom dock bar (`112px` height, `1000px` notice marquee, unified `36px` typography, `48px` VU meter, and `64px` giant rolling clock).

* 🎬 **Smart OBS Scene Auto-Switching**
  * Integrates native OBS Studio CEF Browser Source API (`window.obsstudio`) and `obsSceneChanged` / `obsTransitionStarted` events.
  * Automatically switches to **Full Mode** if the scene name contains `[full]` (e.g., `Gaming [full]`).
  * Automatically switches to **Lite Mode** if the scene name contains `[lite]` or `[light]` (e.g., `Just Chatting [lite]`).

* 🛡️ **22px Thick Obsidian Bezel & Square Corner Masking**
  * The Full Mode game frame features an 18px thick solid obsidian chassis plus a 4px outer glowing conic rainbow rim (22px total composite bezel).
  * Overlaps the outer perimeter of square 16:9 game captures underneath, **100% eliminating and masking sharp 90-degree square corners**.

* 🐯 **Dynamic Left-Border Running Little Tiger Mascot**
  * In Full Stage Mode, a delightfully animated little tiger cub patrols and gallops up and down along the outer left bezel of the game frame.
  * Features bespoke vector craftsmanship: iconic forehead "王" (King) mark, cute pink paw pads, a swishing striped tail, and alternating paw gallop physics.
  * Positioned safely outside the frame border so it never occludes game capture content while adding lively mascot charm to the stream.

* 📊 **12-Band Continuous Chromatic VU Equalizer**
  * Continuous horizontal gradient across all 12 bars matching the outer frame (Cyan ➔ Lavender ➔ Rose ➔ Amber), eliminating single-bar isolated blocky colors.
  * Dual-layer vertical glass shine with floating crystal transient peak needles and gravitational falloff physics.

* 🎆 **Bespoke Full-Screen Festive Atmospheres**
  * Stages are custom-crafted across the entire 4K broadcast screen, with specialized layout geometry in Full Mode:
    * **Chinese New Year (`newyear`)**: Flanking grand red palace lanterns with gold tassels and auspicious clouds framing the top corners of the game viewport, plus shimmering gold foil dust.
    * **Halloween Night (`halloween`)**: Top-left spiderweb with bobbing spider on the game frame corner, atmospheric flying bats across the screen, and a carved glowing Jack-o'-Lantern perched on top of the bottom dock bar (completely clear of game capture viewports and zero clutter in the bottom-left).
    * **Romantic Sakura (`romantic`)**: Full-screen pure Hanafubuki falling cherry blossom shower with realistic multi-tone notched sakura petals, multi-axis 3D tumbling flutter physics, and warm rose starlight bokeh (branch-free, completely unobstructed game view).
    * **Holiday Garland Lights (`lights`)**: Cozy draping garland wave string lights over HUD & bottom dock.
    * **Winter Frost & Snow (`snow` / `both`)**: Multi-plane snowfall with crystalline icicles freezing the top corners of the game frame.

---

## 📐 Layout Architecture & Geometry

### 1. Full Stage Mode (`mode-full`)

```text
+------------------------------------------------------------------------------------------------+
|  [Left Sidebar: 528px Margin]    [Top Margin: 36px]             [Right Margin: 48px]           |
|                                  +-----------------------------------------------------------+ |
|  - 100% Reserved for:            |  [Top Flanking Decor: Lanterns / Branches / Cobweb / Frost] |
|    * Camera / Facecam Box        |                                                           | |
|    * VTuber Avatar Model   [🐯]  |           85% 4K GAME VIEWPORT DISPLAY AREA               | |
|    * Live Chat Stream Box  (↕)   |                     (3264 × 1836)                         | |
|                                  |             * 18px Solid Obsidian Chassis Bezel           | |
|                                  |             * 4px Outer Gemini Rainbow Conic Rim          | |
|                                  |                                       [🎃 Jack-o'-Lantern]| |
|                                  +-----------------------------------------------------------+ |
|  [Bottom-Left: 100% Clean Space]                                                               |
|  - Spacious Streamer Zone        +-----------------------------------------------------------+ |
|    (Zero Decor Clutter)          | [Marquee (1000px)] [Game (36px)] [Domain/VU] [Clock(64px)] | |
|                                  +-----------------------------------------------------------+ |
+------------------------------------------------------------------------------------------------+
```

| Region / Parameter | Dimension (4K Canvas: 3840 × 2160) | Purpose & Design Rationale |
| :--- | :--- | :--- |
| **Game Viewport** | `3264px × 1836px` (Strict 16:9) | 85% scale of 4K, positioned at `top: 36px; right: 48px;` |
| **Top & Right Margins** | `36px` top, `48px` right | Compact margins for tight, elegant screen framing |
| **Left Sidebar Margin** | `528px` width (`0px` to `528px`) | Spacious zone reserved for webcam, VTuber avatar model, or chat stream box |
| **Bottom Margin** | `288px` height (`1872px` to `2160px`) | Houses the enlarged right-aligned dock; bottom-left is 100% clean |
| **Bottom Dock Bar** | Height `112px`, docked at `bottom: 40px; right: 48px;` | Aligned pixel-perfect with the right edge of the game viewport frame |
| **Notice Marquee** | Width `1000px`, Font `36px` | Unified 36px typography across domain, game title, and notices |
| **Clock Roller** | Height `72px`, Font `64px` | Giant studio master clock with rolling digit physics |
| **Atmosphere Stages** | Custom framing around Game Viewport & Dock | Zero decor in bottom-left; lanterns, branches, web, and frost frame the game viewport |

---

### 2. Lightweight Mode (`mode-light` / `mode-lite`)

* **Position**: Pinned suspended top-center at `top: 28px; left: 50%; transform: translateX(-50%);`.
* **Dimensions**: `2250px × 88px` (~2/3 4K screen width).
* **Best For**: Full-screen immersion games (FPS, AAA open-world titles, esports) without window borders.

---

## 🎨 Themes & Atmosphere Gallery

| Key | Theme Name | Stage Visual Elements | Particle & Atmosphere FX |
| :--- | :--- | :--- | :--- |
| `none` | Standard Aura | Obsidian glass + rotating Gemini rainbow rim | 0 CPU (Canvas animation loop sleeps automatically) |
| `lights` | Holiday Lights | 5-swag Bezier garland wave string lights over HUD | Clean warm filament glow |
| `snow` | Winter Snowfall | Screen top corner ice frost and crystalline icicles | Multi-plane gentle snowfall |
| `both` | Lights + Snow | Garland wave string lights + corner icicles | Gentle snowfall |
| `newyear` | Chinese New Year | Flanking swinging red silk palace lanterns + golden auspicious clouds | Shimmering gold foil diamonds & rising red celebratory embers |
| `halloween` | Halloween Night | Top-left cobweb with bobbing spider + flying bats + glowing Jack-o'-Lantern perched on the bottom dock | Wandering ghostly will-o'-the-wisps with soft trails & purple embers |
| `romantic` | Romantic Sakura | Pure branch-free stage framing for clean game broadcast visibility | True 3D Hanafubuki falling sakura shower with multi-tone notched petals & starlight bokeh |

---

## ⚙️ Control & Configuration Methods

### 1. OBS Scene Name Auto-Detection (Recommended)

Rename your OBS Studio scenes to include `[full]` or `[lite]`:
* `Main Game [full]` (or `[full]`, `【full】`, `[全量]`, `【全量】`) ➔ Overlay instantly transforms into **Full Stage Mode** with 85% game frame.
* `Chatting [lite]` (or `[light]`, `【lite】`, `【light】`, `[轻量]`, `【轻量】`) ➔ Overlay instantly transforms into **Lightweight Top Capsule HUD**.

> **💡 OBS Permission Tip**:  
> In OBS Studio Browser Source properties, ensure **Page permissions** is set to **"Read access to user information"** or higher. This grants native event access (`obsSceneChanged`, `obsTransitionStarted`) for zero-latency instant switching.

---

### 2. OBS Custom CSS Live Parameters

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
  --game-title: "Just Chatting";

  /* Notice marquee items separated by || */
  --notices: "非全职个人势主播，虚拟形象画师&建模：심연의심연 (@gonggye_hs) || 随心所欲玩点游戏，主播是老社畜啦不用花钱投喂哦，点点关注就好 || 欢迎好友++，个人主页https://keita.cc";
}
```

---

### 3. URL Query Parameters

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

### 4. Real-Time Web Controller

Open [`controller.html`](file:///C:/Users/keita/.gemini/antigravity/scratch/obs-skeuomorphic-overlay/controller.html) in any browser window:
* Switch between **Lightweight Mode** and **Full Stage Mode** with live broadcast synchronization.
* Simulate OBS scene names (`[full]` / `[lite]`) with 1-click preset chips.
* Update Game Title, Notices, and Theme Effects on the fly via `BroadcastChannel` with zero OBS reload needed.

---

### 5. In-Browser Quick Settings Drawer

* Press keyboard shortcut **`C`** on the overlay page to open/close the quick settings drawer.
* Switch Layout Mode, change active game title, update marquee notices, or pick visual effects in 1 second.

---

## 🚀 Quick Setup in OBS Studio

1. In OBS Studio, add a **Browser Source** to your scene.
2. Set **URL** to your deployed web URL (e.g. `https://obs.keita.cc`) or local absolute file path to `index.html`.
3. Set Canvas Dimensions:
   * **Width**: `3840`
   * **Height**: `2160`
   * **FPS**: `60`
4. In Full Mode, add your **Game Capture** or **Window Capture** and place it **underneath** the browser source in the source list:
   * Position game capture at $(X = 528\text{px}, Y = 36\text{px})$.
   * Set game capture size to `3264 × 1836`.
   * The 18px obsidian frame will overlap the game boundaries, seamlessly hiding all sharp square corners!
5. Recommended settings:
   * Check **Shutdown source when not visible**.
   * Check **Refresh browser when scene becomes active**.

---

## 📄 License & Open Source

Crafted with high-precision CSS3, SVG vectors, Canvas 2D, and native OBS Studio CEF APIs.  
Available on GitHub: [`https://github.com/zhui-zi/obs-overlay`](https://github.com/zhui-zi/obs-overlay)
