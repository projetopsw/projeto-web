// ./utils/authUtils.js

import jwt from 'jsonwebtoken';

export const generateJWT = (user) => {
    // Payload do token (informações que você quer carregar no token)
    const payload = {
        id: user._id,
        spotifyId: user.spotifyId,
        username: user.username,
        email: user.email,
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'chave_secreta', 
        { expiresIn: '7d' } // Expira em 7 dias
    );
};