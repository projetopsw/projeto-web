import express from 'express';
import Album from '../models/album.model.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const albums = await Album.find().populate('songs'); 
    res.json(albums);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const album = await Album.findById(req.params.id).populate('songs');
    if (!album) return res.status(404).json({ erro: 'Álbum não encontrado' });
    res.json(album);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const novoAlbum = new Album(req.body);
    await novoAlbum.save();
    res.status(201).json(novoAlbum);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const albumAtualizado = await Album.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } 
    ).populate('songs');

    if (!albumAtualizado)
      return res.status(404).json({ erro: 'Álbum não encontrado' });

    res.json(albumAtualizado);
  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const albumRemovido = await Album.findByIdAndDelete(req.params.id);
    if (!albumRemovido)
      return res.status(404).json({ erro: 'Álbum não encontrado' });

    res.json({ mensagem: 'Álbum removido com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

export default router;
