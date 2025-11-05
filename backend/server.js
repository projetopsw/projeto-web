const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');   

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json()); 
const MONGODB_URI = 'mongodb://127.0.0.1:27017/moosicaDB';

mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Conectado ao MongoDB com sucesso!');
    })
    .catch((err) => {
        console.error('❌ Erro ao conectar ao MongoDB:', err);
        process.exit(1);
    });

app.get('/', (req, res) => {
    res.send('API de Músicas rodando com MongoDB!');
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});