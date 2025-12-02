

import jwt from 'jsonwebtoken';

export const generateJWT = (user) => {
    const payload = {
        id: user._id,
        spotifyId: user.spotifyId,
        username: user.username,
        email: user.email,
    };

    return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'chave_secreta', 
        { expiresIn: '7d' } 
    );
};