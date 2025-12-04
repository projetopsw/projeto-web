import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import albumRoutes from './routes/albumRoutes.js';
import artistRoutes from './routes/artistRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import songRoutes from './routes/songRoutes.js';
import userRoutes from './routes/userRoutes.js';
import spotifyAuthRoutes from './routes/spotifyAuthRoutes.js';
import spotifyRoutes from './routes/spotifyRoutes.js'; 
import spotifyCacheRoutes from './routes/spotifyCacheRoutes.js'; 
import playlistRoutes from "./routes/playlistRoutes.js";
import comentariosRoutes from "./routes/comentarioRoutes.js"
import searchRoutes from './routes/search.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use('/music_files', express.static(path.join(__dirname, 'public', 'music_files')));
app.use('/cover_images', express.static(path.join(__dirname, 'public', 'cover_images')));
app.use(express.static(path.join(__dirname, 'public'))); 

app.use('/api/search', searchRoutes);
app.use('/albums', albumRoutes);
app.use('/artists', artistRoutes);
app.use('/groups', groupRoutes);
app.use('/songs', songRoutes);
app.use('/users', userRoutes);
app.use('/api/auth/spotify', spotifyAuthRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/spotify-cache', spotifyCacheRoutes);
app.use("/playlists", playlistRoutes);
app.use('/api/comentarios', comentariosRoutes);

export default app