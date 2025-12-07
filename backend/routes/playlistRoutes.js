import express from 'express';
import PlaylistController from '../controller/playlistController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; 
import uploadCapaPlaylistMiddleware from '../middleware/uploadPlaylistCapa.js'; 
import mongoose from 'mongoose';
import Multer from 'multer'; 
const router = express.Router();

const checkObjectId = (req, res, next) => {
    const idToCheck = req.params.id || req.body.id; 
    if (!mongoose.Types.ObjectId.isValid(idToCheck)) {
        return res.status(400).json({ message: 'ID da Playlist inválido.' });
    }
    next();
};

const optionalUpload = (req, res, next) => {
    uploadCapaPlaylistMiddleware(req, res, (err) => {
        if (err instanceof Multer.MulterError) {
            return res.status(400).json({ message: "Erro de Upload da Capa: " + err.message });
        } else if (err && err.message === 'Tipo de arquivo de imagem não suportado.') {
            return res.status(400).json({ message: err.message });
        } else if (err && err.message === 'Campo de arquivo desconhecido para playlist.') {
            return next();
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

router.post('/', 
    verifyToken, 
    optionalUpload, 
    PlaylistController.createPlaylist
);

router.get('/', PlaylistController.getPlaylists);

router.get('/:id', verifyToken, checkObjectId, PlaylistController.getPlaylistById); 

router.patch('/:id', 
    verifyToken, 
    checkObjectId, 
    optionalUpload, 
    PlaylistController.updatePlaylist
);

router.delete('/:id', verifyToken, checkObjectId, PlaylistController.deletePlaylist);

router.post('/:id/songs', verifyToken, checkObjectId, PlaylistController.addSongToPlaylist);

router.delete('/:id/songs', verifyToken, checkObjectId, PlaylistController.removeSongFromPlaylist);


export default router;