import express from 'express';
import mongoose from 'mongoose';
import Playlist from '../models/playlist.model.js';
import User from '../models/user.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper: transforma doc Playlist para o formato esperado no frontend
function toClientPlaylist(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : doc;
  const songsIds = (obj.songs || []).map((s) => (s && s.song ? s.song.toString() : s));
  return {
    id: obj._id.toString(),
    _id: obj._id,
    name: obj.name,
    description: obj.description || '',
    img: obj.img || '',
    userId: obj.user?.toString?.() || obj.user || null,
    songs: songsIds,
    songCount: obj.songCount ?? songsIds.length,
    duration: `${(obj.songCount ?? songsIds.length)} músicas`,
  };
}

// Helper: valida e converte array de ids (strings) para [{ song: ObjectId }]
function toSongRefs(songs) {
  if (!Array.isArray(songs)) return undefined;
  return songs
    .filter(Boolean)
    .map((id) => {
      const str = typeof id === 'object' && id._id ? String(id._id) : String(id);
      if (!mongoose.Types.ObjectId.isValid(str)) {
        throw new Error(`ID de música inválido: ${id}`);
      }
      return { song: new mongoose.Types.ObjectId(str), addedAt: new Date() };
    });
}

// GET /playlists - lista todas (opcional, não usado pelo FE atual)
router.get('/', async (req, res, next) => {
  try {
    const playlists = await Playlist.find();
    res.status(200).json(playlists.map(toClientPlaylist));
  } catch (err) {
    next(err);
  }
});

// GET /playlists/:id - obtém detalhes (normaliza songs como array de IDs)
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist não encontrada' });
    }
    res.status(200).json(toClientPlaylist(playlist));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /playlists - cria playlist (usa campo 'user' exigido pelo schema)
router.post('/', verifyToken, async (req, res) => {
  const { name, creatorId, user: userFromBody, img, type, description, songs = [], isPublic = false } = req.body;

  try {
    const userId = userFromBody || creatorId || req.user?.id;
    if (!userId) {
      return res.status(400).json({ message: 'creatorId (ou user) é obrigatório.' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'creatorId inválido.' });
    }

    const songsRefs = toSongRefs(songs) || [];

    const newPlaylist = new Playlist({
      name,
      description: description || '',
      img: img || '/assets/img/vacateste.jpg',
      user: userId,
      songs: songsRefs,
      durationSeconds: 0,
      songCount: songsRefs.length,
    });

    const savedPlaylist = await newPlaylist.save();

    // Vincula ao usuário
    await User.findByIdAndUpdate(userId, { $push: { userPlaylists: savedPlaylist._id } });

    res.status(201).json(toClientPlaylist(savedPlaylist));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PATCH /playlists/:id - atualiza dados e/ou songs (aceita songs como array de IDs)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const update = {};
    const { name, description, img, isPublic, songs } = req.body;

    if (typeof name === 'string') update.name = name;
    if (typeof description === 'string') update.description = description;
    if (typeof img === 'string') update.img = img;
    // isPublic não está no schema atual; ignorado para evitar validação

    if (Array.isArray(songs)) {
      const songsRefs = toSongRefs(songs);
      update.songs = songsRefs;
      update.songCount = songsRefs.length;
    }

    const updated = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Playlist não encontrada' });
    }

    res.status(200).json(toClientPlaylist(updated));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /playlists/:id - exclui playlist e remove referência do usuário
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist não encontrada' });
    }

    await User.updateMany(
      { userPlaylists: req.params.id },
      { $pull: { userPlaylists: req.params.id } }
    );

    res.status(200).json({ message: 'Playlist excluída com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
