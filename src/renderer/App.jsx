import React, { useState, useEffect, useRef, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import SettingsPanel from './components/SettingsPanel';

const SCROLLBAR_CSS = `
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #141414; }
  ::-webkit-scrollbar-thumb { background: #F47521; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #ff8c3a; }
  ::-webkit-scrollbar-corner { background: #141414; }
`;

const ALLOWED_DOMAINS = [
  'crunchyroll.com',
  'www.crunchyroll.com',
  'beta.crunchyroll.com',
  'static.crunchyroll.com',
  'store.crunchyroll.com',
  'accounts.google.com',
  'ssl.gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

function isDomainAllowed(url) {
  try {
    const { hostname } = new URL(url);
    return ALLOWED_DOMAINS.some(
      (d) => hostname === d || hostname.endsWith('.' + d)
    );
  } catch {
    return false;
  }
}

function parsePageContext(url) {
  try {
    const { pathname } = new URL(url);
    const path = pathname.toLowerCase();

    if (path.includes('/watch/')) {
      return { details: 'Watching something...', state: 'Loading...', needsScrape: true };
    }
    if (path.includes('/series/')) {
      return { details: 'Browsing a series', state: 'Deciding what to watch...', needsScrape: true };
    }
    if (path.includes('/watchlist')) return { details: 'Checking their watchlist', state: 'So much to watch, so little time' };
    if (path.includes('/discover')) return { details: 'Finding something new', state: 'Exploring new anime' };
    if (path.includes('/simulcasts')) return { details: 'Checking simulcasts', state: 'Keeping up with the latest drops' };
    if (path.includes('/history')) return { details: 'Looking at watch history', state: 'What did I watch again?' };
    if (path.includes('/account')) return { details: 'Managing their account', state: 'Settings and stuff' };
    if (path.includes('/search')) return { details: 'Searching for anime', state: 'Looking for something specific' };
    if (path === '/' || path === '') return { details: 'Browsing Crunchyroll', state: 'On the home page' };
    return { details: 'Browsing Crunchyroll', state: 'Exploring anime' };
  } catch {
    return { details: 'Using Crunchyroll', state: 'Watching anime' };
  }
}

const SCRAPE_WATCH_JS = `
  (function() {
    const ep = document.querySelector('h1.title');
    const show = document.querySelector('h4.text--gq6o-');
    return JSON.stringify({
      episode: ep ? ep.textContent.trim() : null,
      show: show ? show.textContent.trim() : null
    });
  })()
`;

const SCRAPE_SERIES_JS = `
  (function() {
    const title = document.querySelector('h1.title') || document.querySelector('h4.text--gq6o-');
    return JSON.stringify({
      show: title ? title.textContent.trim() : null
    });
  })()
`;

function updateDiscordRPC(webview, url) {
  const ctx = parsePageContext(url);
  window.electronAPI.discord.update(ctx.details, ctx.state);

  if (!ctx.needsScrape) return;

  const path = new URL(url).pathname.toLowerCase();
  const isWatch = path.includes('/watch/');
  const script = isWatch ? SCRAPE_WATCH_JS : SCRAPE_SERIES_JS;

  setTimeout(() => {
    try {
      webview.executeJavaScript(script).then((result) => {
        const data = JSON.parse(result);
        if (isWatch && data.show) {
          const details = `Watching ${data.show}`;
          const state = data.episode || 'Enjoying the show';
          window.electronAPI.discord.update(details, state);
        } else if (!isWatch && data.show) {
          window.electronAPI.discord.update(`Browsing ${data.show}`, 'Deciding what to watch...');
        }
      }).catch(() => {});
    } catch {}
  }, 2000);
}

export default function App() {
  const [windowState, setWindowState] = useState('normal');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [webviewKey, setWebviewKey] = useState(0);
  const [savedUrl, setSavedUrl] = useState('https://www.crunchyroll.com/');
  const webviewRef = useRef(null);
  const currentUrlRef = useRef('https://www.crunchyroll.com/');

  useEffect(() => {
    window.electronAPI.window.onStateChange(setWindowState);
    window.electronAPI.window.isMaximized().then((maximized) => {
      setWindowState(maximized ? 'maximized' : 'normal');
    });
  }, []);

  function injectScrollbarCSS(webview) {
    webview.insertCSS(SCROLLBAR_CSS);
  }

  const handleWebviewReady = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    webview.addEventListener('dom-ready', () => {
      setLoading(false);
      injectScrollbarCSS(webview);
    });

    webview.addEventListener('did-navigate', (e) => {
      currentUrlRef.current = e.url;
      injectScrollbarCSS(webview);
      updateDiscordRPC(webview, e.url);
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
      currentUrlRef.current = e.url;
      updateDiscordRPC(webview, e.url);
    });

    webview.addEventListener('new-window', (e) => {
      e.preventDefault();
      if (isDomainAllowed(e.url)) {
        webview.loadURL(e.url);
      }
    });

    webview.addEventListener('will-navigate', (e) => {
      if (!isDomainAllowed(e.url)) {
        e.preventDefault();
        webview.loadURL('https://www.crunchyroll.com/');
      }
    });

    webview.addEventListener('enter-html-full-screen', () => {
      setWindowState('fullscreen');
    });

    webview.addEventListener('leave-html-full-screen', () => {
      window.electronAPI.window.isMaximized().then((maximized) => {
        setWindowState(maximized ? 'maximized' : 'normal');
      });
    });
  }, [webviewKey]);

  useEffect(() => {
    const webview = webviewRef.current;
    if (webview) {
      handleWebviewReady();
    }
  }, [handleWebviewReady]);

  const isFullscreen = windowState === 'fullscreen';

  return (
    <div className="flex flex-col h-screen w-screen bg-cr-dark">
      {!isFullscreen && (
        <TitleBar
          windowState={windowState}
          onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
        />
      )}

      <div className="relative flex-1 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-cr-dark">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-3 border-cr-orange border-t-transparent rounded-full animate-spin" />
              <span className="text-cr-muted text-sm font-medium tracking-wide">Loading Crunchyroll...</span>
            </div>
          </div>
        )}

        <webview
          key={webviewKey}
          ref={webviewRef}
          src={savedUrl}
          className="w-full h-full"
          allowpopups="true"
          partition="persist:crunchyroll"
          plugins="true"
        />

        <SettingsPanel
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
