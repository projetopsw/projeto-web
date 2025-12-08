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

const router = express.Router();

router.use(verifyToken);

router.post('/', createPlaylist);               
router.get('/', getUserPlaylists);             
router.delete('/:id', deletePlaylist);         
router.post('/add-song', addSongToPlaylist);    
router.post('/like', toggleLikeSong);           
router.get('/:id', getPlaylistById);
router.patch('/:id', updatePlaylist);

export default router;