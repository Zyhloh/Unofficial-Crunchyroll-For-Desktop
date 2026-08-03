const RPC = require('discord-rpc');
const { app } = require('electron');

const UPDATE_INTERVAL = 15000;
const TIMESTAMP_TOLERANCE = 10000;
const MAX_TIMESTAMP = 2147483647000;
const TEXT_LIMIT = 128;
const REPO_URL = 'https://github.com/zyhloh/unofficial-crunchyroll-for-desktop';

let client = null;
let ready = false;
let launchedAt = null;
let pending = null;
let applied = null;
let flushTimer = null;
let lastSentAt = 0;

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, TEXT_LIMIT) : null;
}

function timestamp(value) {
  return Number.isFinite(value) && value > 0 && value < MAX_TIMESTAMP ? Math.round(value) : null;
}

function buildActivity(activity) {
  const payload = {
    details: activity.details,
    state: activity.state,
    largeImageKey: 'crunchyroll_logo',
    largeImageText: 'Crunchyroll For Desktop',
    smallImageKey: 'smallcrunchyroll_logo',
    smallImageText: `v${app.getVersion()} — by Zyhloh`,
    startTimestamp: activity.startTimestamp ?? launchedAt,
    buttons: [{ label: 'Download App', url: REPO_URL }]
  };

  if (activity.endTimestamp) {
    payload.endTimestamp = activity.endTimestamp;
  }

  return payload;
}

function isSame(a, b) {
  if (!a || !b) return false;
  if (a.details !== b.details || a.state !== b.state) return false;
  return Math.abs((a.endTimestamp ?? 0) - (b.endTimestamp ?? 0)) < TIMESTAMP_TOLERANCE;
}

function flush() {
  flushTimer = null;
  if (!client || !ready || !pending) return;

  const next = pending;
  pending = null;

  if (isSame(applied, next)) return;

  applied = next;
  lastSentAt = Date.now();

  try {
    const result = client.setActivity(buildActivity(next));
    if (result && typeof result.catch === 'function') result.catch(() => {});
  } catch {}
}

function schedule() {
  if (flushTimer || !ready) return;
  const wait = Math.max(0, UPDATE_INTERVAL - (Date.now() - lastSentAt));
  flushTimer = setTimeout(flush, wait);
  flushTimer.unref?.();
}

function init(appId) {
  try {
    client = new RPC.Client({ transport: 'ipc' });
    launchedAt = Date.now();

    client.on('ready', () => {
      ready = true;
      if (!pending) pending = { details: 'Browsing Crunchyroll', state: 'Just opened the app' };
      flush();
    });

    client.on('disconnected', () => {
      ready = false;
    });

    client.login({ clientId: appId }).catch(() => {
      ready = false;
    });
  } catch {
    client = null;
  }
}

function updatePresence(activity) {
  if (!client || !activity || typeof activity !== 'object') return;

  const details = text(activity.details);
  const state = text(activity.state);
  if (!details && !state) return;

  pending = {
    details,
    state,
    startTimestamp: timestamp(activity.startTimestamp),
    endTimestamp: timestamp(activity.endTimestamp)
  };

  schedule();
}

async function shutdown() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!client) return;

  const current = client;
  client = null;
  ready = false;
  pending = null;
  applied = null;

  try {
    await current.clearActivity();
  } catch {}

  try {
    await current.destroy();
  } catch {}
}

module.exports = { init, updatePresence, shutdown };
