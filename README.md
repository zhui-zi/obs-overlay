# Gemini Aura Overlay (4K OBS HUD)

A high-performance, ultra-clean 4K HUD overlay designed for OBS Studio and modern live streaming, styled with Google Gemini's Prismatic Aura design language.

---

## Architecture & Visual Specs

- **Canvas & Dimensions**: Optimized for 3840×2160 (4K UHD). Centered suspended capsule spanning 2560px (2/3 width) with a compact 88px height.
- **Gemini Prismatic Aura**: 2px rotating conic rainbow rim (`#4285f4`, `#8b5cf6`, `#ec4899`, `#f59e0b`) masked to exclude interior bleeding, paired with a tight 3px subtle outer glow (`drop-shadow`).
- **Obsidian Glass Chassis**: Semi-translucent obsidian backplate (`rgba(10, 13, 18, 0.68)`) with `backdrop-filter: blur(24px) saturate(160%)` to allow dynamic in-game light transmission while maintaining text sharpness.
- **Seamless Notice Marquee**: Dual-buffer continuous scrolling marquee (`notice-track`) eliminating blank gaps, with an enlarged `公告` badge and sparkle separators (`✦`).
- **Typography**: Hierarchical typography using Google Sans, JetBrains Mono, and Noto Sans SC. High-contrast clock display (48px / 24px) with calendar and day labels.

---

## Live Configuration via OBS Custom CSS

Directly edit properties in OBS Studio via **Browser Source Properties -> Custom CSS** for instant hot-reloading:

```css
:root {
  /* Brand domain (left bay) */
  --brand-domain: "keita.cc";

  /* Active game title */
  --game-title: "Black Myth: Wukong";

  /* Marquee notices separated by || */
  --notices: "✨ Welcome to the stream! || 🌌 Live daily at 20:00 || 🎮 4K Ray Tracing Enabled";
}
```

---

## Quick Setup in OBS Studio

1. In OBS Studio, add a **Browser Source**.
2. Set **URL** to your deployed endpoint (e.g. `https://obs.keita.cc`) or local file path.
3. Configure dimensions:
   - **Width**: `3840`
   - **Height**: `2160`
   - **FPS**: `60`
4. Enable **Shutdown source when not visible** and **Refresh browser when scene becomes active** as desired.

---

## Additional Control Methods

- **URL Query Parameters**:
  ```text
  https://obs.keita.cc/?domain=keita.cc&game=Elden+Ring&notice=First+Notice||Second+Notice
  ```
- **Web Controller**: Open [`controller.html`](file:///C:/Users/keita/.gemini/antigravity/scratch/obs-skeuomorphic-overlay/controller.html) to broadcast title and notice updates in real-time via `BroadcastChannel`.
- **In-Browser Quick Drawer**: Press `C` when focused on the overlay page to toggle the config drawer.
