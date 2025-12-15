import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js'; 
import { 
    createPlaylist, 
    deletePlaylist, 
    addSongToPlaylist, 
    toggleLikeSong, 
    getUserPlaylists,
    getPlaylistById,
    updatePlaylist
} from '../controller/playlistController.js';

import Playlist from '../models/playlist.model.js';

const router = express.Router();

router.use(verifyToken);

router.post('/', createPlaylist);               
router.get('/', getUserPlaylists);             
router.delete('/:id', deletePlaylist);         
router.post('/add-song', addSongToPlaylist);
router.post('/remove-song', async (req, res) => {
    const { playlistId, songId } = req.body;
    try {
        const playlist = await Playlist.findById(playlistId);
        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();
        const populatedPlaylist = await Playlist.findById(playlistId).populate('songs'); 
        res.status(200).json(populatedPlaylist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.get('/limpar-lixo', async (req, res) => {
    try {
        const Playlist = require('../models/Playlist'); 
        
        const result = await Playlist.deleteMany({ 
            isLikedSongs: true, 
            owner: null 
        });
        
        res.json({ message: "Limpeza concluída", deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/like', toggleLikeSong);           
router.get('/:id', getPlaylistById);
router.patch('/:id', updatePlaylist);

router.get('/fix-database', async (req, res) => {
    try {
        const Playlist = require('../models/Playlist');
        
        const deleteResult = await Playlist.deleteMany({ 
            isLikedSongs: true, 
            owner: null 
        });

        res.json({ 
            message: "Limpeza realizada.", 
            deleted: deleteResult.deletedCount,
            info: "Tente dar like novamente agora."
        });
    } catch (error) {
        res.status(500).json(error);
    }
});

export default router;