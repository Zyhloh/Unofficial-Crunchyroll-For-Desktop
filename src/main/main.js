const { app, BrowserWindow, ipcMain, shell, screen, components } = require('electron');
const path = require('path');
const { config, isDomainAllowed } = require('./config');
const settings = require('./settings');
const discord = require('./discord');

const BOUNDS_SAVE_DELAY = 400;
const BLOCKED_PERMISSIONS = new Set([
  'geolocation',
  'notifications',
  'midi',
  'midiSysex',
  'hid',
  'serial',
  'usb',
  'idle-detection',
  'display-capture',
  'window-management'
]);

let mainWindow = null;
let webviewContents = null;
let boundsTimer = null;
let isQuitting = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
  return;
}

if (!settings.get('hardwareAcceleration', config.hardwareAcceleration)) {
  app.disableHardwareAcceleration();
}

function send(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

function restoreBounds() {
  const { width, height, minWidth, minHeight } = config.window;
  const saved = settings.get('windowBounds', null);

  if (!saved || !Number.isFinite(saved.width) || !Number.isFinite(saved.height)) {
    return { width, height };
  }

  const bounds = {
    width: Math.max(saved.width, minWidth),
    height: Math.max(saved.height, minHeight)
  };

  if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    const area = screen.getDisplayMatching({ x: saved.x, y: saved.y, width: bounds.width, height: bounds.height }).workArea;
    const visible = saved.x < area.x + area.width && saved.x + bounds.width > area.x &&
      saved.y < area.y + area.height && saved.y + bounds.height > area.y;
    if (visible) {
      bounds.x = saved.x;
      bounds.y = saved.y;
    }
  }

  return bounds;
}

function saveBounds() {
  if (boundsTimer) clearTimeout(boundsTimer);
  boundsTimer = setTimeout(() => {
    boundsTimer = null;
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.isMinimized() || mainWindow.isFullScreen()) return;
    settings.set('windowBounds', mainWindow.getNormalBounds());
    settings.set('windowMaximized', mainWindow.isMaximized());
  }, BOUNDS_SAVE_DELAY);
  boundsTimer.unref?.();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    ...restoreBounds(),
    minWidth: config.window.minWidth,
    minHeight: config.window.minHeight,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0F0F0F',
    icon: path.join(__dirname, '..', '..', 'assets', 'icon.ico'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      backgroundThrottling: false,
      webviewTag: true
    }
  });

  if (settings.get('windowMaximized', false)) {
    mainWindow.maximize();
  }

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    send('window-state', 'maximized');
    saveBounds();
  });

  mainWindow.on('unmaximize', () => {
    send('window-state', 'normal');
    saveBounds();
  });

  mainWindow.on('enter-full-screen', () => send('window-state', 'fullscreen'));

  mainWindow.on('leave-full-screen', () => {
    send('window-state', mainWindow.isMaximized() ? 'maximized' : 'normal');
  });

  mainWindow.on('resize', saveBounds);
  mainWindow.on('move', saveBounds);

  mainWindow.on('app-command', (_, command) => {
    if (!webviewContents || webviewContents.isDestroyed()) return;
    const history = webviewContents.navigationHistory;

    if (command === 'browser-backward' && history.canGoBack()) {
      history.goBack();
    } else if (command === 'browser-forward' && history.canGoForward()) {
      history.goForward();
    }
  });

  mainWindow.on('close', () => {
    if (boundsTimer) {
      clearTimeout(boundsTimer);
      boundsTimer = null;
    }
    if (!mainWindow.isMinimized() && !mainWindow.isFullScreen()) {
      settings.set('windowBounds', mainWindow.getNormalBounds());
      settings.set('windowMaximized', mainWindow.isMaximized());
    }
    settings.flush();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (config.discord.enabled) {
    discord.init(config.discord.appId);
  }
}

app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    if (contents.getType() === 'webview' && isDomainAllowed(url)) {
      contents.loadURL(url);
    } else if (isDomainAllowed(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (contents.getType() === 'webview') {
      if (!isDomainAllowed(url)) {
        event.preventDefault();
      }
      return;
    }
    event.preventDefault();
  });

  if (contents.getType() === 'webview') {
    webviewContents = contents;
    contents.on('destroyed', () => {
      if (webviewContents === contents) webviewContents = null;
    });

    contents.on('before-input-event', (event, input) => {
      if (input.type !== 'keyDown') return;
      const history = contents.navigationHistory;

      if (input.alt && input.key === 'ArrowLeft') {
        if (history.canGoBack()) history.goBack();
        event.preventDefault();
      } else if (input.alt && input.key === 'ArrowRight') {
        if (history.canGoForward()) history.goForward();
        event.preventDefault();
      } else if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
        contents.reload();
        event.preventDefault();
      }
    });

    contents.session.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(!BLOCKED_PERMISSIONS.has(permission));
    });
  }
});

app.on('will-attach-webview', (_, webPreferences) => {
  delete webPreferences.preload;
  webPreferences.nodeIntegration = false;
  webPreferences.contextIsolation = true;
  webPreferences.backgroundThrottling = false;
  webPreferences.plugins = true;
});

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);

ipcMain.handle('settings:get', (_, key) => settings.get(key));

ipcMain.handle('settings:set', (_, key, value) => {
  settings.set(key, value);
});

ipcMain.handle('settings:get-hardware-accel', () =>
  settings.get('hardwareAcceleration', config.hardwareAcceleration)
);

ipcMain.handle('settings:set-hardware-accel', (_, enabled) => {
  settings.set('hardwareAcceleration', enabled === true);
  settings.flush();
});

ipcMain.handle('app:restart', () => {
  settings.flush();
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('app:get-config', () => ({
  allowedDomains: config.allowedDomains,
  homeUrl: config.homeUrl,
  version: app.getVersion(),
  discordEnabled: config.discord.enabled
}));

ipcMain.handle('app:get-start-url', () => {
  const saved = settings.get('lastUrl', null);
  return typeof saved === 'string' && isDomainAllowed(saved) ? saved : config.homeUrl;
});

ipcMain.handle('app:set-last-url', (_, url) => {
  if (typeof url === 'string' && isDomainAllowed(url)) {
    settings.set('lastUrl', url);
  }
});

ipcMain.handle('discord:update', (_, activity) => {
  discord.updatePresence(activity);
});

ipcMain.handle('shell:open-external', (_, url) => {
  if (typeof url !== 'string') return;
  let protocol;
  try {
    ({ protocol } = new URL(url));
  } catch {
    return;
  }
  if (protocol === 'https:' || protocol === 'http:') {
    shell.openExternal(url);
  }
});

app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(async () => {
  try {
    await components.whenReady();
  } catch {}
  createWindow();
});

app.on('before-quit', async (event) => {
  if (isQuitting) return;
  event.preventDefault();
  isQuitting = true;

  settings.flush();
  await discord.shutdown();
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
