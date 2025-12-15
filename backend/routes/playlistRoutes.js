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
        // Remove a música do array
        playlist.songs = playlist.songs.filter(id => id.toString() !== songId);
        await playlist.save();
        
        // Retorna a playlist atualizada
        // (importante popular as músicas se o front espera objetos completos)
        const populatedPlaylist = await Playlist.findById(playlistId).populate('songs'); 
        res.status(200).json(populatedPlaylist);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.post('/like', toggleLikeSong);           
router.get('/:id', getPlaylistById);
router.patch('/:id', updatePlaylist);

export default router;