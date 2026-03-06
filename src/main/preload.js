const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onStateChange: (callback) => {
      ipcRenderer.on('window-state', (_, state) => callback(state));
    }
  },
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getHardwareAccel: () => ipcRenderer.invoke('settings:get-hardware-accel'),
    setHardwareAccel: (enabled) => ipcRenderer.invoke('settings:set-hardware-accel', enabled)
  },
  app: {
    restart: () => ipcRenderer.invoke('app:restart'),
    getConfig: () => ipcRenderer.invoke('app:get-config')
  },
  discord: {
    update: (details, state) => ipcRenderer.invoke('discord:update', details, state)
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url)
  }
});
