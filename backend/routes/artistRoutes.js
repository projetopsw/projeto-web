import express from 'express';
import Artist from '../models/artist.model.js';
import mongoose from 'mongoose'; // Importado para checagem de ObjectId
// import { verifyToken } from '../middleware/authMiddleware.js'; // Assumindo que está importado/usado em outras rotas

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const newArtist = new Artist(req.body);
        const savedArtist = await newArtist.save();
        res.status(201).json(savedArtist);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Já existe um artista com este nome.' });
        }
        res.status(400).json({ message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const artists = await Artist.find().sort({ name: 1 }); 
        res.json(artists);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.get('/:id', async (req, res) => {
    const artistId = req.params.id;
    let query = {};

    // Verifica se o ID é um ObjectId válido do MongoDB
    if (mongoose.Types.ObjectId.isValid(artistId)) {
        // Se for válido, busca pelo _id ou spotifyId
        query = { $or: [{ _id: artistId }, { spotifyId: artistId }] };
    } else {
        // Se não for um ObjectId, assume que é um ID externo (Spotify ID)
        query = { spotifyId: artistId };
    }

    try {
        // CORREÇÃO: Usando findOne com a query flexível
        const artist = await Artist.findOne(query)
            .populate('albums', 'title year cover') 
            .populate('songs', 'title duration');  

        if (!artist) {
            return res.status(404).json({ message: 'Artista não encontrado' });
        }
        res.json(artist);
    } catch (error) {
        // Se houver um erro de servidor não relacionado ao ID inválido
        res.status(500).json({ message: error.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const updatedArtist = await Artist.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedArtist) {
            return res.status(404).json({ message: 'Artista não encontrado' });
        }
        res.json(updatedArtist);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deletedArtist = await Artist.findByIdAndDelete(req.params.id);

        if (!deletedArtist) {
            return res.status(404).json({ message: 'Artista não encontrado' });
        }
        res.json({ message: 'Artista removido com sucesso' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;