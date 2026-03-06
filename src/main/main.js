const { app, BrowserWindow, ipcMain, shell, session, components } = require('electron');
const path = require('path');
const fs = require('fs');
const discord = require('./discord');

let mainWindow = null;
let settings = null;

const configPath = path.join(__dirname, '..', '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const settingsFilePath = path.join(app.getPath('userData'), 'settings.json');
let hardwareAccelEnabled = config.hardwareAcceleration !== undefined ? config.hardwareAcceleration : true;
try {
  if (fs.existsSync(settingsFilePath)) {
    const saved = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
    if ('hardwareAcceleration' in saved) {
      hardwareAccelEnabled = saved.hardwareAcceleration;
    }
  }
} catch {}

if (!hardwareAccelEnabled) {
  app.disableHardwareAcceleration();
}

function createWindow() {
  settings = require('./settings');
  const windowConfig = config.window;

  mainWindow = new BrowserWindow({
    width: windowConfig.width,
    height: windowConfig.height,
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight,
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
      webviewTag: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state', 'normal');
  });

  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('window-state', 'fullscreen');
  });

  mainWindow.on('leave-full-screen', () => {
    const state = mainWindow.isMaximized() ? 'maximized' : 'normal';
    mainWindow.webContents.send('window-state', state);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  if (config.discord.enabled) {
    discord.init(config.discord.appId);
  }
}

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});

ipcMain.handle('settings:get', (_, key) => {
  return settings.get(key);
});

ipcMain.handle('settings:set', (_, key, value) => {
  settings.set(key, value);
});

ipcMain.handle('settings:get-hardware-accel', () => {
  return settings.get('hardwareAcceleration', config.hardwareAcceleration);
});

ipcMain.handle('settings:set-hardware-accel', (_, enabled) => {
  settings.set('hardwareAcceleration', enabled);
});

ipcMain.handle('app:restart', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.handle('app:get-config', () => {
  return config;
});

ipcMain.handle('discord:update', (_, details, state) => {
  discord.updatePresence(details, state);
});

ipcMain.handle('shell:open-external', (_, url) => {
  shell.openExternal(url);
});

app.whenReady().then(async () => {
  await components.whenReady();
  createWindow();
});

app.on('window-all-closed', () => {
  discord.destroy();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
