import { useState, useEffect, useRef, useCallback } from 'react';
import TitleBar from './components/TitleBar';
import SettingsPanel from './components/SettingsPanel';
import { PAGE_SCRAPE_JS, contextFromUrl, activityFromPage } from './presence';

const SCRAPE_DELAY = 2000;
const WATCH_POLL_INTERVAL = 10000;
const URL_SAVE_DELAY = 1500;

const SCROLLBAR_CSS = `
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: #141414; }
  ::-webkit-scrollbar-thumb { background: #F47521; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #ff8c3a; }
  ::-webkit-scrollbar-corner { background: #141414; }
`;

export default function App() {
  const [windowState, setWindowState] = useState('normal');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [startUrl, setStartUrl] = useState(null);

  const webviewRef = useRef(null);
  const scrapeTimerRef = useRef(null);
  const pollTimerRef = useRef(null);
  const urlTimerRef = useRef(null);
  const trackedUrlRef = useRef(null);

  const scrapePresence = useCallback(async () => {
    const webview = webviewRef.current;
    if (!webview) return;

    try {
      const raw = await webview.executeJavaScript(PAGE_SCRAPE_JS);
      const activity = activityFromPage(JSON.parse(raw));
      if (activity) window.electronAPI.discord.update(activity);
    } catch {}
  }, []);

  const trackPage = useCallback(
    (url) => {
      if (url === trackedUrlRef.current) return;
      trackedUrlRef.current = url;

      clearTimeout(scrapeTimerRef.current);
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;

      const { activity, track } = contextFromUrl(url);
      window.electronAPI.discord.update(activity);
      if (!track) return;

      scrapeTimerRef.current = setTimeout(() => {
        scrapePresence();
        if (track === 'watch') {
          pollTimerRef.current = setInterval(scrapePresence, WATCH_POLL_INTERVAL);
        }
      }, SCRAPE_DELAY);
    },
    [scrapePresence]
  );

  const rememberUrl = useCallback((url) => {
    clearTimeout(urlTimerRef.current);
    urlTimerRef.current = setTimeout(() => {
      window.electronAPI.app.setLastUrl(url);
    }, URL_SAVE_DELAY);
  }, []);

  useEffect(() => {
    const unsubscribe = window.electronAPI.window.onStateChange(setWindowState);

    window.electronAPI.window.isMaximized().then((maximized) => {
      setWindowState(maximized ? 'maximized' : 'normal');
    });

    window.electronAPI.app.getStartUrl().then(setStartUrl);

    return () => {
      unsubscribe?.();
      clearTimeout(scrapeTimerRef.current);
      clearTimeout(urlTimerRef.current);
      clearInterval(pollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return undefined;

    const controller = new AbortController();
    const on = (event, handler) =>
      webview.addEventListener(event, handler, { signal: controller.signal });

    on('dom-ready', () => {
      setLoading(false);
      setLoadError(null);
      webview.insertCSS(SCROLLBAR_CSS).catch(() => {});
    });

    on('did-navigate', (e) => {
      setLoadError(null);
      trackPage(e.url);
      rememberUrl(e.url);
    });

    on('did-navigate-in-page', (e) => {
      if (!e.isMainFrame) return;
      trackPage(e.url);
      rememberUrl(e.url);
    });

    on('media-started-playing', scrapePresence);
    on('media-paused', scrapePresence);

    on('did-fail-load', (e) => {
      if (!e.isMainFrame || e.errorCode === -3) return;
      setLoading(false);
      setLoadError(e.errorDescription || 'Failed to load Crunchyroll');
    });

    on('enter-html-full-screen', () => setWindowState('fullscreen'));

    on('leave-html-full-screen', () => {
      window.electronAPI.window.isMaximized().then((maximized) => {
        setWindowState(maximized ? 'maximized' : 'normal');
      });
    });

    on('render-process-gone', () => setLoadError('The page crashed. Try reloading.'));

    return () => controller.abort();
  }, [startUrl, trackPage, rememberUrl, scrapePresence]);

  const retry = useCallback(() => {
    setLoadError(null);
    setLoading(true);
    webviewRef.current?.reload();
  }, []);

  const isFullscreen = windowState === 'fullscreen';

  return (
    <div className="flex flex-col h-screen w-screen bg-cr-dark">
      {!isFullscreen && (
        <TitleBar
          windowState={windowState}
          onSettingsToggle={() => setSettingsOpen((open) => !open)}
        />
      )}

      <div className="relative flex-1 overflow-hidden">
        {loading && !loadError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-cr-dark">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-3 border-cr-orange border-t-transparent rounded-full animate-spin" />
              <span className="text-cr-muted text-sm font-medium tracking-wide">Loading Crunchyroll...</span>
            </div>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-cr-dark">
            <div className="flex flex-col items-center gap-4 px-8 text-center">
              <span className="text-cr-text text-base font-semibold">Something went wrong</span>
              <span className="text-cr-muted text-sm max-w-sm">{loadError}</span>
              <button
                onClick={retry}
                className="mt-2 px-5 py-2 rounded-lg bg-cr-orange text-white text-sm font-semibold cursor-pointer"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {startUrl && (
          <webview
            ref={webviewRef}
            src={startUrl}
            className="w-full h-full"
            allowpopups="true"
            partition="persist:crunchyroll"
            plugins="true"
          />
        )}

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </div>
    </div>
  );
}
