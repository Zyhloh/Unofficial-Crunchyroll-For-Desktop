const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let settingsPath = null;
let cache = null;

function getSettingsPath() {
  if (!settingsPath) {
    settingsPath = path.join(app.getPath('userData'), 'settings.json');
  }
  return settingsPath;
}

function load() {
  if (cache) return cache;

  try {
    const filePath = getSettingsPath();
    if (fs.existsSync(filePath)) {
      cache = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } else {
      cache = {};
    }
  } catch {
    cache = {};
  }

  return cache;
}

function save() {
  try {
    const filePath = getSettingsPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
  } catch {}
}

function get(key, defaultValue) {
  const data = load();
  return key in data ? data[key] : defaultValue;
}

function set(key, value) {
  load();
  cache[key] = value;
  save();
}

module.exports = { get, set };
