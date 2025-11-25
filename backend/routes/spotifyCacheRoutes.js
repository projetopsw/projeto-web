import express from 'express';
import { getArtistById, getArtistAlbums, getAlbumById, getTrackById, search } from '../controller/spotifyCacheController.js';

const router = express.Router();

router.get('/search', search);
router.get('/artists/:id', getArtistById);
router.get('/artists/:id/albums', getArtistAlbums);
router.get('/albums/:id', getAlbumById);
router.get('/tracks/:id', getTrackById);

export default router;
