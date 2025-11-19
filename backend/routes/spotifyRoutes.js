import express from 'express';
import axios from 'axios';
import User from '../models/user.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

async function getValidSpotifyToken(userId) {
    const user = await User.findById(userId).select('+refresh_token_spotify +access_token_spotify');
    
    if (!user || !user.refresh_token_spotify) {
        throw new Error('Usuário não autenticado via Spotify.');
    }

    try {
        const tokenResponse = await axios.post(SPOTIFY_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: user.refresh_token_spotify
            }).toString(),
            {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        
        const newAccessToken = tokenResponse.data.access_token;
        const newRefreshToken = tokenResponse.data.refresh_token; 
        
        user.access_token_spotify = newAccessToken;
        if (newRefreshToken) user.refresh_token_spotify = newRefreshToken;
        await user.save();
        
        return newAccessToken;

    } catch (error) {
        console.error("Erro ao renovar token no proxy:", error.response?.data || error.message);
        throw new Error('Falha na renovação do token Spotify.');
    }
}

router.get('/data', verifyToken, async (req, res) => {
    const { endpoint } = req.query;
    
    if (!endpoint) {
        return res.status(400).json({ message: 'Parâmetro "endpoint" é obrigatório.' });
    }
    
    try {
        const accessToken = await getValidSpotifyToken(req.user.id);
        
        const spotifyResponse = await axios.get(`${SPOTIFY_API_BASE}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        res.json(spotifyResponse.data);

    } catch (error) {
        const statusCode = error.message.includes('não autenticado') ? 401 : 500;
        res.status(statusCode).json({ message: error.message });
    }
});

export default router;