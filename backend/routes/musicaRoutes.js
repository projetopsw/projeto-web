import express from 'express';
import { getSongLyrics } from '../controller/lyricsController.js'; 

const router = express.Router();

router.get('/:id/lyrics', getSongLyrics); 

export default router;