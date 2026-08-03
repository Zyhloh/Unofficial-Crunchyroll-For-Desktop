const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized'),
    onStateChange: (callback) => {
      const listener = (_, state) => callback(state);
      ipcRenderer.on('window-state', listener);
      return () => ipcRenderer.removeListener('window-state', listener);
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
    getConfig: () => ipcRenderer.invoke('app:get-config'),
    getStartUrl: () => ipcRenderer.invoke('app:get-start-url'),
    setLastUrl: (url) => ipcRenderer.invoke('app:set-last-url', url)
  },
  discord: {
    update: (activity) => ipcRenderer.invoke('discord:update', activity)
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url)
  }
});
