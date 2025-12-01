import axios from 'axios';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = process.env.SPOTIFY_API_BASE || 'https://api.spotify.com/v1';

let appToken = {
  access_token: null,
  expires_at: 0,
};

async function fetchAppToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID/SECRET não configurados no ambiente');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
  }).toString();

  const res = await axios.post(SPOTIFY_TOKEN_URL, body, {
    headers: {
      'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const now = Math.floor(Date.now() / 1000);
  appToken = {
    access_token: res.data.access_token,
    expires_at: now + (res.data.expires_in - 30), 
  };
  return appToken.access_token;
}

export async function getAppToken() {
  const now = Math.floor(Date.now() / 1000);
  if (!appToken.access_token || appToken.expires_at <= now) {
    return await fetchAppToken();
  }
  return appToken.access_token;
}

export async function spotifyGet(path, params = {}) {
  const token = await getAppToken();
  try {
    const res = await axios.get(`${SPOTIFY_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 401) {
      await fetchAppToken();
      const res = await axios.get(`${SPOTIFY_API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${appToken.access_token}` },
        params,
      });
      return res.data;
    }
    if (err.response?.status === 429) {
      const retryAfter = parseInt(err.response.headers['retry-after'] || '1', 10) * 1000;
      await new Promise(r => setTimeout(r, retryAfter));
      const res = await axios.get(`${SPOTIFY_API_BASE}${path}`, {
        headers: { Authorization: `Bearer ${appToken.access_token}` },
        params,
      });
      return res.data;
    }
    throw err;
  }
}
