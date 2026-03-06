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
      const segments = path.split('/');
      if (segments.length > 2) {
        const title = segments[2]
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return { details: `Watching ${title}`, state: 'Enjoying anime content' };
      }
      return { details: 'Watching anime', state: 'Enjoying content' };
    }
    if (path.includes('/series/')) return { details: 'Browsing anime series', state: 'Looking for something to watch' };
    if (path.includes('/simulcasts')) return { details: 'Checking simulcasts', state: 'Finding new episodes' };
    if (path.includes('/watchlist')) return { details: 'Managing watchlist', state: 'Organizing anime to watch' };
    return { details: 'Browsing Crunchyroll', state: 'Exploring anime content' };
  } catch {
    return { details: 'Using Crunchyroll', state: 'Watching anime' };
  }
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
      const ctx = parsePageContext(e.url);
      window.electronAPI.discord.update(ctx.details, ctx.state);
    });

    webview.addEventListener('did-navigate-in-page', (e) => {
      currentUrlRef.current = e.url;
      const ctx = parsePageContext(e.url);
      window.electronAPI.discord.update(ctx.details, ctx.state);
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
