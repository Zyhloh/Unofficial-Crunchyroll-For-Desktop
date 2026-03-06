const RPC = require('discord-rpc');

let client = null;
let ready = false;

function init(appId) {
  try {
    client = new RPC.Client({ transport: 'ipc' });

    client.on('ready', () => {
      ready = true;
      updatePresence('Browsing Crunchyroll', 'Just started watching');
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
      details: 'Made With ❤️ By Zyhloh',
      state: 'github.com/zyhloh',
      largeImageKey: 'crunchyroll_logo',
      largeImageText: 'Crunchyroll For Desktop',
      smallImageKey: 'smallcrunchyroll_logo',
      smallImageText: 'Crunchyroll For Desktop',
      startTimestamp: new Date(),
      buttons: [
        {
          label: 'Download',
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
