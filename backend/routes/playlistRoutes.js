import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js'; // Seu middleware de login
import { 
    createPlaylist, 
    deletePlaylist, 
    addSongToPlaylist, 
    toggleLikeSong, 
    getUserPlaylists 
} from '../controller/playlistController.js';

const router = express.Router();

// Aplique o middleware de autenticação em tudo
router.use(verifyToken);

router.post('/', createPlaylist);               // Criar nova playlist
router.get('/', getUserPlaylists);              // Listar todas (incluindo Curtidas)
router.delete('/:id', deletePlaylist);          // Deletar playlist
router.post('/add-song', addSongToPlaylist);    // Adicionar música em playlist específica
router.post('/like', toggleLikeSong);           // Curtir/Descurtir música (Mágica automática)

export default router;