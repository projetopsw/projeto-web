import express from 'express';
import Artist from '../models/artist.model.js';

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
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('albums', 'title year cover') 
      .populate('songs', 'title duration');   

    if (!artist) {
      return res.status(404).json({ message: 'Artista não encontrado' });
    }
    res.json(artist);
  } catch (error) {
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