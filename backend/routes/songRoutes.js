import express from 'express';
import Song from '../models/song.model.js';
import { getSongLyrics } from '../controller/lyricsController.js';
import MusicaController from '../controller/musicaController.js';
import uploadMusicaMiddleware from '../middleware/uploadMusica.js';
import uploadCapaMiddleware from '../middleware/uploadCapa.js'; 
import mongoose from 'mongoose';
import Multer from 'multer';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const checkObjectId = (req, res, next) => {
    const idToCheck = req.params.id || req.params.musicaId;
    if (!mongoose.Types.ObjectId.isValid(idToCheck)) {
        return res.status(404).json({ message: 'ID de música inválido.' });
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

router.post('/', verifyToken, (req, res, next) => {
    uploadMusicaMiddleware(req, res, function (err) {
        if (err instanceof Multer.MulterError) {
            return res.status(400).json({ message: "Erro de Upload: " + err.message });
        } else if (err) {
            return res.status(400).json({ message: err.message });
        }
        next();
    });
}, MusicaController.createMusica);

router.get('/', async (req, res) => {
    try {
        const songs = await Song.find({})
            .populate('artists', 'name username img')
            .populate('owner', 'name username')
            .populate('album', 'title cover') 
            .lean();

        res.status(200).json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar as músicas', error: error.message });
    }
});

router.get('/:id', checkObjectId, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artists', 'name username img')
            .populate('owner', 'name username')
            .populate('album', 'title cover') 
            .lean();

        if (!song) {
            return res.status(404).json({ message: 'Música não encontrada.' });
        }
        res.status(200).json(song);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar a música', error: error.message });
    }
});

router.get('/:id/lyrics', getSongLyrics);

router.patch('/:id', 
    verifyToken, 
    checkObjectId, 
    uploadCapaMiddleware.fields([
        { name: 'coverImage', maxCount: 1 }, 
        { name: 'updateData', maxCount: 1 }  
    ]),
    handleMulterError,
    MusicaController.updateMusica
);

router.delete('/:id', verifyToken, checkObjectId, MusicaController.deleteMusica);

router.post('/:id/interacao', verifyToken, MusicaController.toggleLikeDislike);

export default router;