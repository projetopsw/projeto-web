import express from 'express';
import axios from 'axios';
import { generateJWT } from '../utils/authUtils.js'; 
import User from '../models/user.model.js'; 

const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI; 

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

const generateRandomString = (length) => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

router.get('/', (req, res) => {
    const state = generateRandomString(16);
    const scopes = 'user-read-private user-read-email playlist-read-private user-top-read';
    
    const authorizeUrl = 'https://accounts.spotify.com/authorize?' +
        new URLSearchParams({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: scopes,
            redirect_uri: REDIRECT_URI,
            state: state
        }).toString();

    res.redirect(authorizeUrl);
});

router.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const error = req.query.error || null;
    
    if (error || code === null) {
        return res.redirect(`http://localhost:5173/login?error=auth_failed`); 
    }

    try {
        const tokenResponse = await axios.post(SPOTIFY_TOKEN_URL, 
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }).toString(), 
            {
                headers: {
                    'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        const { access_token, refresh_token } = tokenResponse.data;

        const userResponse = await axios.get(`${SPOTIFY_API_BASE}/me`, {
            headers: { 'Authorization': `Bearer ${access_token}` }
        });
        const spotifyUser = userResponse.data;

        let user = await User.findOne({ spotifyId: spotifyUser.id });

        if (!user) {
            user = new User({
                spotifyId: spotifyUser.id,
                email: spotifyUser.email,
                username: spotifyUser.display_name || spotifyUser.id,
                refresh_token_spotify: refresh_token,
                access_token_spotify: access_token, 
            });
        } else {
            user.refresh_token_spotify = refresh_token || user.refresh_token_spotify;
            user.access_token_spotify = access_token;
        }
        await user.save();
        
        const moosicaToken = generateJWT(user); 

        res.redirect(`http://localhost:5173/callback?token=${moosicaToken}`); 
        
    } catch (error) {
        console.error('Erro no fluxo de autorização do Spotify:', error.response?.data || error.message);
        res.redirect(`http://localhost:5173/login?error=auth_failed`); 
    }
});

router.post('/refresh-token', async (req, res) => {
    const { userId } = req.body; 

    if (!userId) {
        return res.status(400).json({ message: 'O ID do usuário é obrigatório.' });
    }

    try {
        const user = await User.findById(userId).select('+refresh_token_spotify'); 

        if (!user || !user.refresh_token_spotify) {
            return res.status(404).json({ message: 'Usuário ou Refresh Token não encontrado. Login necessário.' });
        }

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

        const { access_token: new_access_token, refresh_token: new_refresh_token } = tokenResponse.data;

        if (new_refresh_token) {
            user.refresh_token_spotify = new_refresh_token;
        }
        user.access_token_spotify = new_access_token; 
        await user.save();

        res.json({ 
            access_token: new_access_token,
            expires_in: tokenResponse.data.expires_in
        });

    } catch (error) {
        res.status(401).json({ message: 'Sessão expirada. Faça login novamente.', error: 'refresh_failed' });
    }
});

export default router;