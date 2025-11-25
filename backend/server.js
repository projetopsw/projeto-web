import 'dotenv/config'; 
import express from 'express';
import mongoose from 'mongoose';
import app from './app.js';
import userRoutes from './routes/userRoutes.js';
import { search } from './controller/spotifyCacheController.js'; // Importe a função

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URI;

app.use('/users', userRoutes);
app.get('/api/search', search);

console.log('Tentando conectar ao MongoDB com a URI:', MONGODB_URI); 

if (!MONGODB_URI) {
  console.error('❌ ERRO FATAL: A variável MONGODB_URI não está definida no arquivo .env');
  process.exit(1); 
}


mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  });