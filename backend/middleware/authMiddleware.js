import jwt from 'jsonwebtoken';
import Song from '../models/song.model.js';
import User from '../models/user.model.js'; 

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

export const authorizeCreatorOrAdmin = async (req, res, next) => {
    const resourceId = req.params.id; 
    const userId = req.user._id;

    try {
        const user = await User.findById(userId);
        
        if (user && user.role === 'admin') {
            return next(); 
        }

        const song = await Song.findById(resourceId);

        if (!song) {
            return res.status(404).json({ message: 'Música não encontrada.' });
        }

        let creatorId = null;

        if (song.owner) {
            creatorId = song.owner.toString();
        } else if (song.artists && song.artists.length > 0) {
             creatorId = song.artists[0].toString();
        }
        
        if (creatorId && creatorId === userId.toString()) {
            return next();
        }

        return res.status(403).json({ message: 'Acesso negado. Você não é o criador nem um administrador.' });

    } catch (error) {
        console.error('Erro de autorização:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao verificar a autorização.' });
    }
};