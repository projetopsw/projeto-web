import axios from 'axios';
import qs from 'querystring';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const API_BASE_URL = 'https://api.spotify.com/v1';

const tokenCache = {
    token: null,
    expiry: 0,
    expiresIn: 3600
};

const getAppToken = async () => {
    const now = Date.now();
    
    if (tokenCache.token && (tokenCache.expiry > now + 5000)) {
        return tokenCache.token;
    }

    try {
        const data = qs.stringify({ grant_type: 'client_credentials' });
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        };

        const response = await axios.post(TOKEN_URL, data, { headers });
        const { access_token, expires_in } = response.data;
        
        tokenCache.token = access_token;
        tokenCache.expiresIn = expires_in;
        tokenCache.expiry = now + (expires_in * 1000);

        return access_token;
    } catch (error) {
        console.error("Erro CRÍTICO ao autenticar no Spotify:", error.message);
        return null;
    }
};

export const spotifyGet = async (endpoint) => {
    const token = await getAppToken();
    if (!token) throw new Error("Token do Spotify não gerado.");

    try {
        const url = endpoint.startsWith('http') 
            ? endpoint 
            : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const searchSpotify = async (query, types = 'track,album,artist', limit = 15) => {
    const token = await getAppToken();
    if (!token) return null;

    try {
        const url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&type=${types}&limit=${limit}&market=BR`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
    } catch (error) {
        console.error("Erro na busca do Spotify:", error.message);
        return null;
    }
};

export const getRelatedArtists = async (artistId) => {
    const token = await getAppToken();
    if (!token) return [];

    try {
        const url = `${API_BASE_URL}/artists/${artistId}/related-artists`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.artists || [];
    } catch (error) {
        console.error("Erro ao buscar artistas relacionados:", error.message);
        return [];
    }
};