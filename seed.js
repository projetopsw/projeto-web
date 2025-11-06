import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import Album from './backend/models/album.model.js';
import Artist from './backend/models/artist.model.js';
import Group from './backend/models/group.model.js';
import Playlist from './backend/models/playlist.model.js';
import Song from './backend/models/song.model.js';
import User from './backend/models/user.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = 'mongodb://127.0.0.1:27017/moosicaDB';
const JSON_FILE_PATH = path.join(__dirname, 'db.json');

// Mapas para guardar a tradução de ID Antigo (String) -> Novo ID (ObjectId)
const idMap = {
    users: new Map(),
    artists: new Map(),
    albums: new Map(),
    songs: new Map()
};

async function seedDatabase() {
    try {
        console.log('🌱 Iniciando migration seed...');
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 30000 });
        console.log('🔌 Conectado ao MongoDB.');

        const data = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
        const jsonData = JSON.parse(data);

        // --- 1. LIMPEZA ---
        console.log('🧹 Limpando base atual...');
        await Promise.all([
            User.deleteMany({}), Artist.deleteMany({}), Album.deleteMany({}),
            Song.deleteMany({}), Playlist.deleteMany({}), Group.deleteMany({})
        ]);

        // --- 2. INSERÇÃO ORDENADA E MAPEAMENTO ---
        // A ordem importa aqui! Inserimos primeiro quem não tem dependências.

        // 2.1. USERS
        if (jsonData.users) {
            console.log('👤 Migrando Users...');
            for (const item of jsonData.users) {
                const oldId = item.id;
                const newItem = { ...item };
                delete newItem.id; // Remove o ID antigo

                const doc = await new User(newItem).save();
                idMap.users.set(oldId, doc._id); // Guarda o mapeamento
            }
            console.log(`   -> ${idMap.users.size} users migrados.`);
        }

        // 2.2. ARTISTS
        if (jsonData.artists) {
            console.log('🎤 Migrando Artists...');
            for (const item of jsonData.artists) {
                const oldId = item.id;
                const newItem = { ...item };
                delete newItem.id;

                const doc = await new Artist(newItem).save();
                idMap.artists.set(oldId, doc._id);
            }
            console.log(`   -> ${idMap.artists.size} artists migrados.`);
        }

        // 2.3. ALBUMS (Depende de Artists)
        if (jsonData.albums) {
            console.log('💿 Migrando Albums...');
            for (const item of jsonData.albums) {
                const oldId = item.id;
                const newItem = { ...item };
                delete newItem.id;

                // Atualiza referência: artistId (string) -> artist (ObjectId)
                if (newItem.artistId && idMap.artists.has(newItem.artistId)) {
                    newItem.artist = idMap.artists.get(newItem.artistId);
                    delete newItem.artistId; // Remove o campo antigo se quiser limpar
                }

                const doc = await new Album(newItem).save();
                idMap.albums.set(oldId, doc._id);
            }
             console.log(`   -> ${idMap.albums.size} albums migrados.`);
        }

        // 2.4. SONGS (Depende de Albums e talvez Artists)
        if (jsonData.songs) {
             console.log('🎵 Migrando Songs...');
             for (const item of jsonData.songs) {
                const oldId = item.id;
                const newItem = { ...item };
                delete newItem.id;

                // Atualiza referências
                if (newItem.albumId && idMap.albums.has(newItem.albumId)) {
                    newItem.album = idMap.albums.get(newItem.albumId);
                    delete newItem.albumId;
                }
                // Algumas estruturas tem artistId direto na música também
                if (newItem.artistId && idMap.artists.has(newItem.artistId)) {
                    newItem.artist = idMap.artists.get(newItem.artistId);
                    delete newItem.artistId;
                }

                const doc = await new Song(newItem).save();
                idMap.songs.set(oldId, doc._id);
            }
            console.log(`   -> ${idMap.songs.size} songs migrados.`);
        }

        // 2.5. PLAYLISTS (Depende de User e Songs)
        if (jsonData.userPlaylists) {
            console.log('📜 Migrando Playlists...');
            let count = 0;
            for (const item of jsonData.userPlaylists) {
                const newItem = { ...item };
                delete newItem.id;

                // Mapeia o dono da playlist
                if (newItem.userId && idMap.users.has(newItem.userId)) {
                    newItem.user = idMap.users.get(newItem.userId);
                    delete newItem.userId;
                }

                // Se sua playlist tiver um array de músicas (ex: 'songs': ['song-1', 'song-2'])
                // Você precisa mapear esse array também:
                /*
                if (newItem.songs && Array.isArray(newItem.songs)) {
                    newItem.songs = newItem.songs.map(oldSongId => idMap.songs.get(oldSongId)).filter(Boolean);
                }
                */

                await new Playlist(newItem).save();
                count++;
            }
            console.log(`   -> ${count} playlists migradas.`);
        }

        // 2.6. GROUPS (Depende de Users?)
        if (jsonData.groups) {
             console.log('👥 Migrando Groups...');
             let count = 0;
             for (const item of jsonData.groups) {
                 const newItem = { ...item };
                 delete newItem.id;
                 // Adicione lógica de mapeamento aqui se Groups tiverem membros (users)
                 await new Group(newItem).save();
                 count++;
             }
             console.log(`   -> ${count} groups migrados.`);
        }

        console.log('✅ MIGRATION SEED CONCLUÍDO!');

    } catch (error) {
        console.error('❌ Erro no seed:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

seedDatabase();