import express from 'express';
import Song from '../models/song.model.js'; 
import musicaController from '../controller/musicaController.js';
import mongoose from 'mongoose';

const router = express.Router();

const checkObjectId = (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: 'ID de música inválido.' });
    }
    next();
};

router.post('/', async (req, res) => {
    try {
        const newSong = new Song(req.body);
        const savedSong = await newSong.save();
        await savedSong.populate('artists', 'name').populate('album', 'title');
        res.status(201).json(savedSong);
    } catch (error) {
        if (error.name === 'ValidationError') {
             res.status(400).json({ message: error.message });
        } else {
             res.status(500).json({ message: 'Erro ao criar a música', error: error.message });
        }
    }
});

router.get('/', async (req, res) => {
    try {
        const songs = await Song.find({})
            .populate('artists', 'name') 
            .populate('album', 'title')
            .lean();

        res.status(200).json(songs);
    } catch (error) {
        console.error("Erro no GET /songs:", error);
        res.status(500).json({ message: 'Erro ao buscar as músicas', error: error.message });
    }
});

router.get('/:id', checkObjectId, async (req, res) => {
    try {
        const song = await Song.findById(req.params.id)
            .populate('artists', 'name')
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

router.put('/:id', checkObjectId, async (req, res) => {
    try {
        const updatedSong = await Song.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
        .populate('artists', 'name')
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

// router.post('/:musicaId/interacao', MusicaController.toggleLikeDislike);

export default router;