import Playlist from '../models/playlist.model.js';
import Song from '../models/song.model.js';

// 1. Cria uma playlist customizada (ex: "Para Treinar")
export const createPlaylist = async (req, res) => {
    try {
        const { name, description, cover } = req.body;
        const ownerId = req.user.id; // Assumindo que você tem um middleware de autenticação que popula req.user

        const newPlaylist = await Playlist.create({
            name,
            description,
            cover,
            owner: ownerId,
            isLikedSongs: false // Playlist normal
        });

        res.status(201).json(newPlaylist);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar playlist', error: error.message });
    }
};

// 2. Excluir Playlist
export const deletePlaylist = async (req, res) => {
    try {
        const { id } = req.params;
        const ownerId = req.user.id;

        const playlist = await Playlist.findOneAndDelete({ _id: id, owner: ownerId });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist não encontrada ou sem permissão.' });
        }

        res.json({ message: 'Playlist excluída com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir playlist', error: error.message });
    }
};

// 3. Adicionar música a uma playlist específica
export const addSongToPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.body;
        const ownerId = req.user.id;

        const playlist = await Playlist.findOne({ _id: playlistId, owner: ownerId });
        if (!playlist) return res.status(404).json({ message: 'Playlist não encontrada' });

        // Evita duplicatas
        if (playlist.songs.includes(songId)) {
            return res.status(400).json({ message: 'Música já está na playlist' });
        }

        playlist.songs.push(songId);
        await playlist.save();

        res.json(playlist);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar música', error: error.message });
    }
};

// 4. LÓGICA DE CURTIR (Toggle Like)
// Se a playlist "Músicas Curtidas" não existir, cria ela. Se existir, adiciona/remove a música.
export const toggleLikeSong = async (req, res) => {
    try {
        const { songId } = req.body;
        const ownerId = req.user.id;

        // Tenta achar a playlist de curtidas desse usuário
        let likedPlaylist = await Playlist.findOne({ owner: ownerId, isLikedSongs: true });

        // Se não existir, cria agora (Lazy creation)
        if (!likedPlaylist) {
            likedPlaylist = await Playlist.create({
                name: 'Músicas Curtidas',
                owner: ownerId,
                isLikedSongs: true,
                songs: []
            });
        }

        const songIndex = likedPlaylist.songs.indexOf(songId);
        let isLiked = false;

        if (songIndex > -1) {
            // Se já curtiu, remove (Descurtir)
            likedPlaylist.songs.splice(songIndex, 1);
            isLiked = false;
        } else {
            // Se não curtiu, adiciona (Curtir)
            likedPlaylist.songs.push(songId);
            isLiked = true;
        }

        await likedPlaylist.save();

        res.json({ isLiked, playlistId: likedPlaylist._id });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao curtir música', error: error.message });
    }
};

// 5. Listar playlists do usuário
export const getUserPlaylists = async (req, res) => {
    try {
        const ownerId = req.user.id;
        // Busca todas, ordenando: Músicas Curtidas primeiro, depois as criadas recentemente
        const playlists = await Playlist.find({ owner: ownerId })
                                        .sort({ isLikedSongs: -1, createdAt: -1 }); 
        
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar playlists', error: error.message });
    }
};