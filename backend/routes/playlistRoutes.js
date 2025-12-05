// src/routes/playlist.routes.js
import express from 'express';
import PlaylistController from '../controller/playlistController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; 
import uploadCapaPlaylistMiddleware from '../middleware/uploadPlaylistCapa.js'; 
import mongoose from 'mongoose';
import Multer from 'multer';

const router = express.Router();

const checkObjectId = (req, res, next) => {
    const idToCheck = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(idToCheck)) {
        return res.status(400).json({ message: 'ID da Playlist inválido.' });
    }
    next();
};

const handleMulterError = (err, req, res, next) => {
    if (err instanceof Multer.MulterError) {
        return res.status(400).json({ message: "Erro de Upload da Capa: " + err.message });
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

// POST /api/playlists - Criar Playlist
router.post('/', 
    verifyToken, 
    uploadCapaPlaylistMiddleware, 
    handleMulterError,
    PlaylistController.createPlaylist
);

// GET /api/playlists - Listar todas as Playlists
router.get('/', PlaylistController.getPlaylists);

// GET /api/playlists/:id - Obter detalhes (Requer token para checar acesso a playlists privadas)
router.get('/:id', verifyToken, checkObjectId, PlaylistController.getPlaylistById); 

// PATCH /api/playlists/:id - Atualizar metadados
router.patch('/:id', 
    verifyToken, 
    checkObjectId, 
    uploadCapaPlaylistMiddleware, 
    handleMulterError,
    PlaylistController.updatePlaylist
);

// DELETE /api/playlists/:id - Deletar uma Playlist
router.delete('/:id', verifyToken, checkObjectId, PlaylistController.deletePlaylist);

// POST /api/playlists/:id/songs - Adicionar uma música
router.post('/:id/songs', verifyToken, checkObjectId, PlaylistController.addSongToPlaylist);

// DELETE /api/playlists/:id/songs - Remover uma música
router.delete('/:id/songs', verifyToken, checkObjectId, PlaylistController.removeSongFromPlaylist);


export default router;