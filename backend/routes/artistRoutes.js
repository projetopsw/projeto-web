import express from 'express';
import Artist from '../models/artist.model.js';
import mongoose from 'mongoose'; 
import { getArtistById, getArtistAlbums, getArtistTopTracks, updateArtist } from "../controller/artistController.js";

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


router.get('/:id', getArtistById);
router.get('/:id/albums', getArtistAlbums); 
router.get("/:id/top-tracks", getArtistTopTracks);

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

router.patch('/:id', updateArtist); 


export default router;