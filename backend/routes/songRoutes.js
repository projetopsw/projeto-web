import express from 'express';
import Song from '../models/song.model.js'; 
import { getSongLyrics } from '../controller/lyricsController.js';
import MusicaController from '../controller/musicaController.js';
import uploadMusicaMiddleware from '../middleware/uploadMusica.js';
import mongoose from 'mongoose';
import Multer from 'multer';
import { verifyToken } from '../middleware/authMiddleware.js'; 

const router = express.Router();

const checkObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: 'ID de música inválido.' });
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
            .populate('artists', 'name img') 
            .populate('album', 'title')
            .lean();

        res.status(200).json(songs);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar as músicas', error: error.message });
    }
});

router.get('/:id', checkObjectId, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artists', 'name img')
            .populate('album', 'title')
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

router.put('/:id', checkObjectId, async (req, res) => {
    try {
        const updatedSong = await Song.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('artists', 'name img')
        .populate('album', 'title');

        if (!updatedSong) {
            return res.status(404).json({ message: 'Música não encontrada para atualização.' });
        }
        res.status(200).json(updatedSong);
    } catch (error) {
        if (error.name === 'ValidationError') {
             res.status(400).json({ message: error.message });
        } else {
             res.status(500).json({ message: 'Erro ao atualizar a música', error: error.message });
        }
    }
});

router.delete('/:id', checkObjectId, async (req, res) => {
    try {
        const deletedSong = await Song.findByIdAndDelete(req.params.id);

        if (!deletedSong) {
            return res.status(404).json({ message: 'Música não encontrada para exclusão.' });
        }
        res.status(200).json({ message: 'Música excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir a música', error: error.message });
    }
});

router.post('/:musicaId/interacao', verifyToken, MusicaController.toggleLikeDislike);

export default router;