import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import albumRoutes from './routes/albumRoutes.js';
import artistRoutes from './routes/artistRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import songRoutes from './routes/songRoutes.js';
import userRoutes from './routes/userRoutes.js';
import spotifyAuthRoutes from './routes/spotifyAuthRoutes.js';
import spotifyRoutes from './routes/spotifyRoutes.js'; 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/albums', albumRoutes);
app.use('/artists', artistRoutes);
app.use('/groups', groupRoutes);
app.use('/songs', songRoutes);
app.use('/users', userRoutes);
app.use('/api/auth/spotify', spotifyAuthRoutes);
app.use('/api/spotify', spotifyRoutes);

export default app