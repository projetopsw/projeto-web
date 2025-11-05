import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import albumRoutes from './routes/albumRoutes.js';
// import artistRoutes from './routes/artistRoutes.js';
// import groupRoutes from './routes/groupRoutes.js';
// import playlistRoutes from './routes/playlistRoutes.js';
// import songRoutes from './routes/songRoutes.js';
// import userRoutes from './routes/userRoutes.js';

dotenv.config();
const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.error('❌ Erro na conexão:', err));

app.use('/albums', albumRoutes);
// app.use('/artists', artistRoutes);
// app.use('/groups', groupRoutes);
// app.use('/playlists', playlistRoutes);
// app.use('/songs', songRoutes);
// app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎧 Servidor rodando na porta ${PORT}`));
