import express from 'express';
import Playlist from '../models/playlist.model.js';
import User from '../models/user.model.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

const getPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find();
    
    res.status(200).json(playlists);
  } catch (err) {
    next(err);
  }
}; 

router.get("/", getPlaylists);

router.get('/:id', async (req, res) => {
    try {
        const playlist = await Playlist.findById(req.params.id);
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist não encontrada' });
        }
        res.status(200).json(playlist);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    const { name, creatorId, img, type, description, songs = [], isPublic = false } = req.body;

    let creatorName = 'Usuário Desconhecido';
    try {
        const user = await User.findById(creatorId);
        if (user) {
            creatorName = user.name;
        }
    } catch (e) {
        console.error("Erro ao buscar criador:", e.message);
    }

    const newPlaylist = new Playlist({
        name,
        creatorId,
        creator: creatorName,
        img: img || '/assets/img/vacateste.jpg',
        type: type || "Playlist do Usuário",
        description: description || `Playlist criada por ${creatorName}.`,
        songs,
        duration: "0 min",
        songCount: 0,
        isPublic
    });

    try {
        const savedPlaylist = await newPlaylist.save();

        if (creatorId) {
             await User.findByIdAndUpdate(creatorId, { 
                $push: { userPlaylists: savedPlaylist._id }
            });
        }
        
        res.status(201).json(savedPlaylist); 
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.patch('/:id', verifyToken, async (req, res) => {
    const { name, description, img, isPublic, songs } = req.body;

    if (req.params.id === '0') {
        return res.status(403).json({ message: 'Não é possível editar a playlist "Músicas Curtidas" diretamente por esta rota.' });
    }

    try {
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            req.params.id, 
            { name, description, img, isPublic, songs }, 
            { new: true, runValidators: true }
        );

        if (!updatedPlaylist) {
            return res.status(404).json({ message: 'Playlist não encontrada' });
        }
        
        res.status(200).json(updatedPlaylist); 
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    if (req.params.id === '0') {
        return res.status(403).json({ message: 'Não é possível excluir a playlist "Músicas Curtidas".' });
    }
    
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

export default router