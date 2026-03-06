# Crunchyroll For Desktop

A lightweight, native desktop client for Crunchyroll — built from the ground up with Electron.

**v3.0.0** is a complete rewrite of the original C#/WebView2 app. Faster, cleaner, and actually good this time.

---

## What's New in V3

The old version was held together with duct tape. This is what it should have been from the start.

- **Full Widevine DRM** — Watch any content, no restrictions. Powered by CastLabs ECS with production VMP signing.
- **Hardware Acceleration Toggle** — Turn it off to screenshare with friends on Discord. Turn it on for buttery smooth playback. Full app restart applies the change properly at the system level.
- **Custom Title Bar** — Montserrat font, orange gradient branding, properly spaced window controls. No more default Electron chrome.
- **Settings Sidebar** — Slide-in panel with smooth open/close animations. Clean, minimal design that matches the title bar aesthetic.
- **Discord Rich Presence** — Shows what you're watching, browsing, or searching on Crunchyroll. Updates in real-time.
- **Orange Scrollbar** — Injected into the Crunchyroll webview. Small detail, big difference.
- **Domain Allowlist** — Locked down navigation so you stay on Crunchyroll. No random redirects.
- **Fullscreen Support** — Native fullscreen for video playback, title bar hides automatically.

## Tech Stack

- Electron (CastLabs fork for Widevine DRM)
- React
- TailwindCSS
- Webpack

## Install

Download the latest installer from [Releases](https://github.com/zyhloh/unofficial-crunchyroll-for-desktop/releases) and run it.

## Build From Source

```
npm install
npm run build
npx electron-builder --win
python -m castlabs_evs.vmp sign-pkg release\win-unpacked
npx electron-builder --win --prepackaged release\win-unpacked
```

Requires a [CastLabs EVS account](https://github.com/castlabs/electron-releases/wiki/EVS) (free) for Widevine VMP signing.

## Config

Settings are stored locally in `%APPDATA%/crunchyroll-for-desktop/settings.json`. App config lives in `config.json` at the project root.

## License

MIT

---

Built by [Zyhloh](https://github.com/zyhloh)
