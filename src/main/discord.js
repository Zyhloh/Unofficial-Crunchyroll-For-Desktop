const RPC = require('discord-rpc');

let client = null;
let ready = false;
let startTimestamp = null;

function init(appId) {
  try {
    client = new RPC.Client({ transport: 'ipc' });
    startTimestamp = new Date();

    client.on('ready', () => {
      ready = true;
      updatePresence('Browsing Crunchyroll', 'Just opened the app');
    });

    client.login({ clientId: appId }).catch(() => {});
  } catch {
    client = null;
  }
}

function updatePresence(details, state) {
  if (!client || !ready) return;

  try {
    client.setActivity({
      details,
      state,
      largeImageKey: 'crunchyroll_logo',
      largeImageText: 'Crunchyroll For Desktop',
      smallImageKey: 'smallcrunchyroll_logo',
      smallImageText: 'v3.0.0 — by Zyhloh',
      startTimestamp,
      buttons: [
        {
          label: 'Download App',
          url: 'https://github.com/zyhloh/unofficial-crunchyroll-for-desktop'
        }
      ]
    });
  } catch {}
}

function destroy() {
  if (client) {
    try {
      client.destroy();
    } catch {}
    client = null;
    ready = false;
  }
}

module.exports = { init, updatePresence, destroy };
