# Crunchyroll For Desktop

A lightweight desktop client for Crunchyroll, built with Electron and the CastLabs Widevine runtime.

Version 3.x is a complete rewrite of the original C#/WebView2 application.

## Features

- **Widevine DRM playback** — Full catalogue support via the CastLabs Electron runtime with production VMP signing.
- **Discord Rich Presence** — Reads the page's structured metadata to show the series, season and episode you are watching, with a live playback progress bar and a paused indicator.
- **Hardware acceleration toggle** — Disable it to screen share without a black window, enable it for smoother playback. The app restarts to apply the change at the system level.
- **Session restore** — Reopens on the page you left off, and remembers window size, position and maximised state.
- **Custom title bar** — Frameless window with its own controls, hidden automatically during fullscreen playback.
- **Settings sidebar** — Slide-in panel, closable with `Escape` or by clicking outside.
- **Navigation shortcuts** — `Alt + Left` / `Alt + Right` to move through history, mouse back/forward buttons, `F5` or `Ctrl + R` to reload.
- **Error recovery** — Failed page loads and renderer crashes show a retry prompt instead of a blank window.
- **Domain allowlist** — Navigation and popups are restricted to Crunchyroll and its sign-in providers, enforced in the main process.

## Changelog

### 3.1.0

- Rich Presence now reads `schema.org` structured data (`TVEpisode` / `VideoObject`) instead of scraping generated CSS class names, with fallbacks through Open Graph tags, page headings and the document title.
- Rich Presence reports playback position, duration and paused state.
- Added session restore for the last visited page and for window geometry.
- Added history and reload keyboard shortcuts, and mouse back/forward button support.
- Added a retry screen for failed loads and renderer crashes.
- Navigation and popup restrictions moved to the main process, where they are actually enforceable.
- Presence updates are rate limited and de-duplicated to stay within Discord's limits.
- Window bounds and settings are written atomically.
- Reduced the packaged application from 9.7 MB to 2.4 MB by removing build-only dependencies from the bundle.

## Tech Stack

- Electron (CastLabs fork, for Widevine)
- React
- Tailwind CSS
- Webpack

## Install

Download the latest installer from the [Releases](https://github.com/zyhloh/unofficial-crunchyroll-for-desktop/releases) page and run it.

## Build From Source

Requires Node.js, Python, and a free [CastLabs EVS account](https://github.com/castlabs/electron-releases/wiki/EVS) for Widevine VMP signing.

```
npm install
npm run build
npx electron-builder --win
python -m castlabs_evs.vmp sign-pkg release\win-unpacked
npx electron-builder --win --prepackaged release\win-unpacked
```

The signing step is required. Unsigned builds load the Widevine CDM but cannot complete a licence request, so playback stalls before the first frame.

For development, `npm run dev` rebuilds the renderer on change and launches the app. DRM playback does not work in this mode.

## Configuration

`config.json` in the project root controls the window defaults, the Discord application ID, and the navigation allowlist.

User settings — hardware acceleration, window geometry and the last visited page — are stored in `%APPDATA%/crunchyroll-for-desktop/settings.json`.

## Disclaimer

This is an unofficial client and is not affiliated with, endorsed by, or sponsored by Crunchyroll. A valid Crunchyroll account is required; the application does not provide or bypass access to any content.

## License

MIT

---

Built by [Zyhloh](https://github.com/zyhloh)
