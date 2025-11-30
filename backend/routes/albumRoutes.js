import express from 'express';
import Album from '../models/album.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const newAlbum = new Album(req.body);
    const savedAlbum = await newAlbum.save();

    await savedAlbum.populate('artists');

    res.status(201).json(savedAlbum);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const albums = await Album.find()
      .populate('artists', 'name cover') 
      .sort({ createdAt: -1 });

    res.json(albums);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate('artists', 'name') 
      .populate('songs', 'title'); 

    if (!album) {
      return res.status(404).json({ message: 'Álbum não encontrado' });
    }
    res.json(album);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updatedAlbum = await Album.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('artists');

    if (!updatedAlbum) return res.status(404).json({ message: 'Álbum não encontrado' });
    res.json(updatedAlbum);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedAlbum = await Album.findByIdAndDelete(req.params.id);
    if (!deletedAlbum) return res.status(404).json({ message: 'Álbum não encontrado' });
    res.json({ message: 'Álbum deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;