const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const WRITE_DELAY = 300;

let settingsPath = null;
let cache = null;
let writeTimer = null;

function getSettingsPath() {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  return settingsPath;
}

function load() {
  if (cache) return cache;

  try {
    const parsed = JSON.parse(fs.readFileSync(getSettingsPath(), 'utf-8'));
    cache = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    cache = {};
  }

  return cache;
}

function writeNow() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (!cache) return;

  const filePath = getSettingsPath();
  const tempPath = filePath + '.tmp';

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(tempPath, JSON.stringify(cache, null, 2));
    fs.renameSync(tempPath, filePath);
  } catch {
    try {
      fs.rmSync(tempPath, { force: true });
    } catch {}
  }
}

function scheduleWrite() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(writeNow, WRITE_DELAY);
  writeTimer.unref?.();
}

function get(key, defaultValue) {
  const data = load();
  return key in data ? data[key] : defaultValue;
}

function set(key, value) {
  const data = load();
  if (data[key] === value) return;
  data[key] = value;
  scheduleWrite();
}

module.exports = { get, set, flush: writeNow };
