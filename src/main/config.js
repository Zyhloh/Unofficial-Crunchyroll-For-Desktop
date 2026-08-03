const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  discord: {
    appId: '',
    enabled: false
  },
  hardwareAcceleration: true,
  window: {
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600
  },
  homeUrl: 'https://www.crunchyroll.com/',
  allowedDomains: ['crunchyroll.com']
};

function readConfigFile() {
  const configPath = path.join(__dirname, '..', '..', 'config.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

function normalize(raw) {
  const domains = Array.isArray(raw.allowedDomains) && raw.allowedDomains.length
    ? raw.allowedDomains.filter((d) => typeof d === 'string' && d.length).map((d) => d.toLowerCase())
    : DEFAULTS.allowedDomains;

  const window = { ...DEFAULTS.window, ...(raw.window || {}) };
  for (const key of Object.keys(DEFAULTS.window)) {
    if (!Number.isFinite(window[key]) || window[key] <= 0) {
      window[key] = DEFAULTS.window[key];
    }
  }
  window.width = Math.max(window.width, window.minWidth);
  window.height = Math.max(window.height, window.minHeight);

  const discord = { ...DEFAULTS.discord, ...(raw.discord || {}) };
  discord.enabled = discord.enabled === true && typeof discord.appId === 'string' && discord.appId.length > 0;

  return {
    discord,
    hardwareAcceleration: raw.hardwareAcceleration !== false,
    window,
    homeUrl: typeof raw.homeUrl === 'string' && raw.homeUrl ? raw.homeUrl : DEFAULTS.homeUrl,
    allowedDomains: [...new Set(domains)]
  };
}

const config = normalize(readConfigFile());

function isDomainAllowed(url) {
  let hostname;
  let protocol;
  try {
    ({ hostname, protocol } = new URL(url));
  } catch {
    return false;
  }
  if (protocol !== 'https:' && protocol !== 'http:') return false;

  const host = hostname.toLowerCase();
  return config.allowedDomains.some((domain) => host === domain || host.endsWith('.' + domain));
}

module.exports = { config, isDomainAllowed };
