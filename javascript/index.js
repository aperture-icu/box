const LANYARD_WS = 'wss://api.lanyard.rest/socket';
const LANYARD_OP = {
  PRESENCE: 0,
  HELLO: 1,
  INITIALIZE: 2,
  HEARTBEAT: 3,
};
const EVENTS_TO_CALLBACK = ['INIT_STATE', 'PRESENCE_UPDATE'];
const DISCORD_ID = '1013270483560579165';

let spotifyBarTimer = null;

function initializeLanyard(callback) {
  let ws = new WebSocket(LANYARD_WS);

  ws.onmessage = ({ data }) => {
    const received = JSON.parse(data);

    switch (received.op) {
      case LANYARD_OP.HELLO: {
        ws.send(JSON.stringify({ op: LANYARD_OP.INITIALIZE, d: { subscribe_to_id: DISCORD_ID } }));

        setInterval(() => {
          ws.send(JSON.stringify({ op: LANYARD_OP.HEARTBEAT }));
        }, 1000 * 30);
      }

      case LANYARD_OP.PRESENCE: {
        if (EVENTS_TO_CALLBACK.includes(received.t)) {
          callback(received.d);
        }
      }
    }
  };

  ws.onclose = () => initializeLanyard;
}

initializeLanyard((data) => {
  setupBasicInfo(data);
  setupSpotify(data);
});

function setupBasicInfo({ discord_user, discord_status, activities }) {
  const { username, discriminator, avatar } = discord_user;
  const colorCodes = {
    online: '#30d158',
    offline: '#8e8e93',
    idle: '#ffd60a',
    dnd: '#ff453a',
  };

  let status = '';

  for (const activity of activities) {
    if (activity.type === 4) {
      status = activity.state;
      break;
    }
  }

  const usernameElement = document.getElementById('discord-username');
  const avatarElement = document.getElementById('discord-avatar');
  const statusElement = document.getElementById('discord-status');

  usernameElement.innerText = `${username}#${discriminator}`;
  statusElement.innerText = status;
  avatarElement.src = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${avatar}.webp?size=256`;
  avatarElement.style.borderColor = colorCodes[discord_status];
}

function setupSpotify({ listening_to_spotify, spotify }) {
  if (spotifyBarTimer) clearInterval(spotifyBarTimer);

  const spotifyElement = document.getElementById('discord-spotify');

  if (!listening_to_spotify) {
    spotifyElement.style.display = 'none';
    return;
  }

  spotifyElement.style.display = 'flex';

  const { song, artist, album_art_url, timestamps } = spotify;
  const duration = timestamps.end - timestamps.start;

  const spotifySong = document.getElementById('spotify-song');
  const spotifyArtist = document.getElementById('spotify-artist');
  const spotifyImage = document.getElementById('spotify-image');
  const spotifyBar = document.getElementById('spotify-bar');
  const spotifyEndTime = document.getElementById('spotify-total-time');
  const spotifyCurrentTime = document.getElementById('spotify-current-time');

  spotifySong.innerText = song;
  spotifyArtist.innerText = artist.replaceAll('; ', ', ');
  spotifyImage.src = album_art_url;

  spotifyEndTime.innerText = convertToTimeString(duration);

  spotifyBarTimer = setInterval(() => {
    const current = new Date().getTime() - timestamps.start;
    const percent = Math.round((current / duration) * 100);

    spotifyBar.style.background = `linear-gradient(135deg, #1ed760 ${percent}%, #ffffff calc(${percent}% + 1px)`;
    spotifyCurrentTime.innerText = convertToTimeString(current);
  }, 100);
}

function convertToTimeString(date) {
  const timeString = new Date(date).toTimeString();
  const [_, minute, second] = timeString.split(':');
  const secondFix = second.split(' GMT')[0];

  return `${minute}:${secondFix}`;
}
