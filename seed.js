import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; 

import Album from './backend/models/album.model.js'
import Artist from './backend/models/artist.model.js'
import Group from './backend/models/group.model.js'
import Playlist from './backend/models/playlist.model.js'
import Song from './backend/models/song.model.js'
import User from './backend/models/user.model.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = 'mongodb://127.0.0.1:27017/moosicaDB';
const JSON_FILE_PATH = path.join(__dirname, 'db.json'); 

async function seedDatabase() {
    try {
        console.log('Iniciando o script de seed...');
        
        await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // 30 segundos
        });

        console.log('Conectado ao MongoDB para o seed.');

        console.log(`Lendo o arquivo ${JSON_FILE_PATH}...`);
        const data = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
        const jsonData = JSON.parse(data);

        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        if (collectionNames.includes('songs')) {
        console.log("Coleção 'songs' encontrada. Deletando documentos...");
        await Song.deleteMany({});
        } else {
        console.log("Coleção 'songs' ainda não existe. Pulando deleteMany.");
        }

        if (collectionNames.includes('albums')) {
        console.log("Coleção 'albums' encontrada. Deletando documentos...");
        await Album.deleteMany({});
        } else {
        console.log("Coleção 'albums' ainda não existe. Pulando deleteMany.");
        }

        if (collectionNames.includes('artists')) {
        console.log("Coleção 'artists' encontrada. Deletando documentos...");
        await Artist.deleteMany({});
        } else {
        console.log("Coleção 'artists' ainda não existe. Pulando deleteMany.");
        }

        if (collectionNames.includes('playlists')) {
        console.log("Coleção 'playlists' encontrada. Deletando documentos...");
        await Playlist.deleteMany({});
        } else {
        console.log("Coleção 'playlists' ainda não existe. Pulando deleteMany.");
        }

        if (collectionNames.includes('users')) {
        console.log("Coleção 'users' encontrada. Deletando documentos...");
        await User.deleteMany({});
        } else {
        console.log("Coleção 'users' ainda não existe. Pulando deleteMany.");
        }

        if (collectionNames.includes('groups')) {
        console.log("Coleção 'groups' encontrada. Deletando documentos...");
        await Group.deleteMany({});
        } else {
        console.log("Coleção 'groups' ainda não existe. Pulando deleteMany.");
        }

        console.log('Populando o banco de dados...');

        if (jsonData.songs) {
            await Song.insertMany(jsonData.songs);
            console.log(` -> ${jsonData.songs.length} músicas inseridas.`);
        }

        if (jsonData.artists) {
            await Artist.insertMany(jsonData.artists);
            console.log(` -> ${jsonData.artists.length} artistas inseridos.`);
        }

        if (jsonData.albums) {
            await Album.insertMany(jsonData.albums);
            console.log(` -> ${jsonData.albums.length} álbuns inseridos.`);
        }

        if (jsonData.userPlaylists) {
            await Playlist.insertMany(jsonData.userPlaylists);
            console.log(` -> ${jsonData.users.length} usuários inseridos.`);
        }

        if (jsonData.users) {
            await User.insertMany(jsonData.users);
            console.log(` -> ${jsonData.users.length} usuários inseridos.`);
        }

        if (jsonData.groups) {
            await Group.insertMany(jsonData.groups);
            console.log(` -> ${jsonData.users.length} usuários inseridos.`);
        }

        console.log('✅ Seed concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro durante o processo de seed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexão com o MongoDB fechada.');
        process.exit(0);
    }
}

seedDatabase();