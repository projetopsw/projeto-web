import axios from 'axios';
import qs from 'querystring';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const getAppToken = async () => {
    try {
        const tokenUrl = 'https://accounts.spotify.com/api/token'; 
        const data = qs.stringify({ grant_type: 'client_credentials' });
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
        };

        const response = await axios.post(tokenUrl, data, { headers });
        return response.data.access_token;
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
            : `https://api.spotify.com/v1${endpoint}`;

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
        const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${types}&limit=${limit}&market=BR`;
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
        const url = `https://api.spotify.com/v1/artists/${artistId}/related-artists`;
        const response = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data.artists || [];
    } catch (error) {
        console.error("Erro ao buscar artistas relacionados:", error.message);
        return [];
    }
};