import 'dotenv/config'; // Garanta que é a PRIMEIRA importação
import express from 'express';
import mongoose from 'mongoose';
import app from './app.js';

const PORT = process.env.PORT || 3000;
//const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI = 'mongodb://127.0.0.1:27017/moosicaDB';

// --- LOG DE DEPURAÇÃO ---
console.log('Tentando conectar ao MongoDB com a URI:', MONGODB_URI); // Vai mostrar se está undefined

if (!MONGODB_URI) {
  console.error('❌ ERRO FATAL: A variável MONGODB_URI não está definida no arquivo .env');
  process.exit(1); // Encerra o servidor se não tiver URI
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