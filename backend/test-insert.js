import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: String,
  artist: String,
  duration: String,
});

const Song = mongoose.model('Song', songSchema);

const MONGODB_URI = 'mongodb://127.0.0.1:27017/moosicaDB';

async function testInsert() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado com sucesso.");

    const song = new Song({
      title: "Teste",
      artist: "Artista Teste",
      duration: "3:00"
    });

    await song.save();
    console.log("Música inserida com sucesso.");
  } catch (err) {
    console.error("Erro ao inserir:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Conexão encerrada.");
  }
}

testInsert();