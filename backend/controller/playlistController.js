import Playlist from '../models/playlist.model.js';
import Song from '../models/song.model.js';

export const createPlaylist = async (req, res) => {
    try {
        const { name, description, cover, isPublic } = req.body; 
        
        const userId = req.user.id; 

        if (!name) {
            return res.status(400).json({ message: "O nome da playlist é obrigatório." });
        }

        const newPlaylist = await Playlist.create({
            title: name,      
            description,
            cover,
            user: userId,       
            isLikedSongs: false,
            isPublic: isPublic !== undefined ? isPublic : true,
            songs: [],
            songCount: 0
        });

        res.status(201).json(newPlaylist);
    } catch (error) {
        console.error("Erro ao criar playlist:", error);
        res.status(500).json({ message: 'Erro ao criar playlist', error: error.message });
    }
};

export const getPlaylistById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const playlist = await Playlist.findById(id)
            .populate('songs') 
            .populate('user', 'name username'); 

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist não encontrada.' });
        }


        if (!playlist.isPublic && playlist.user._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Acesso negado a esta playlist privada.' });
        }

        res.json(playlist);
    } catch (error) {
        console.error("Erro ao buscar playlist:", error);
        res.status(500).json({ message: 'Erro ao buscar playlist', error: error.message });
    }
};

export const getUserPlaylists = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const playlists = await Playlist.find({ user: userId })
                                        .sort({ createdAt: -1 }); 
        
        res.json(playlists);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar playlists', error: error.message });
    }
};

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

export const addSongToPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.body;
        const ownerId = req.user.id;

        const playlist = await Playlist.findOne({ _id: playlistId, owner: ownerId });
        if (!playlist) return res.status(404).json({ message: 'Playlist não encontrada' });

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

export const toggleLikeSong = async (req, res) => {
    try {
        const { songId } = req.body;
        const ownerId = req.user.id;

        let likedPlaylist = await Playlist.findOne({ owner: ownerId, isLikedSongs: true });

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
            likedPlaylist.songs.splice(songIndex, 1);
            isLiked = false;
        } else {
            likedPlaylist.songs.push(songId);
            isLiked = true;
        }

        await likedPlaylist.save();

        res.json({ isLiked, playlistId: likedPlaylist._id });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao curtir música', error: error.message });
    }
};

export const updatePlaylist = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, cover, isPublic } = req.body; 
        const userId = req.user.id;

        const playlist = await Playlist.findOneAndUpdate(
            { _id: id, user: userId }, 
            { 
                title, 
                description, 
                cover, 
                isPublic 
            },
            { new: true } 
        );

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist não encontrada ou você não tem permissão para editá-la.' });
        }

        res.json(playlist);
    } catch (error) {
        console.error("Erro ao atualizar playlist:", error);
        res.status(500).json({ message: 'Erro ao atualizar playlist', error: error.message });
    }
};