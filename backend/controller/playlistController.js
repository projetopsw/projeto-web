import Playlist from '../models/playlist.model.js';
import Song from '../models/song.model.js';
import User from '../models/user.model.js';

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
            .populate('user', 'name username') 
            .populate({
                path: 'songs', 
                populate: [
                    { 
                        path: 'album', 
                        select: 'title cover' 
                    },
                    { 
                        path: 'artists', 
                        select: 'name' 
                    }
                ]
            });

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist não encontrada.' });
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
        const userId = req.user.id;

        const playlist = await Playlist.findById(id);

        if (!playlist) {
            return res.status(404).json({ message: 'Playlist não encontrada no banco de dados.' });
        }

        const donoDaPlaylist = (playlist.user || playlist.owner || '').toString();

        if (donoDaPlaylist !== userId) {
            return res.status(403).json({ message: 'Você não tem permissão para excluir esta playlist.' });
        }

        await Playlist.deleteOne({ _id: id });

        await User.findByIdAndUpdate(userId, {
            $pull: { userPlaylists: id }
        });

        res.json({ message: 'Playlist excluída com sucesso.' });

    } catch (error) {
        console.error("Erro ao excluir playlist:", error);
        res.status(500).json({ message: 'Erro interno ao excluir playlist', error: error.message });
    }
};

export const addSongToPlaylist = async (req, res) => {
    try {
        const { playlistId, songId } = req.body;
        const userId = req.user.id; 

        if (!playlistId || !songId) {
            return res.status(400).json({ message: 'PlaylistId e SongId são obrigatórios.' });
        }

        const playlist = await Playlist.findOne({ _id: playlistId, user: userId });
        
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist não encontrada ou você não tem permissão.' });
        }

        const songExists = playlist.songs.some(s => s.toString() === songId);

        if (songExists) {
            return res.status(400).json({ message: 'Esta música já está na playlist.' });
        }

        playlist.songs.push(songId);
        
        playlist.songCount = playlist.songs.length;
        
        await playlist.save();

        res.json(playlist);

    } catch (error) {
        console.error("Erro ao adicionar música:", error);
        res.status(500).json({ message: 'Erro interno ao adicionar música', error: error.message });
    }
};

export const toggleLikeSong = async (req, res) => {
    try {
        const { songId } = req.body;
        const userId = req.user.id || req.user._id;

        if (!songId) {
            return res.status(400).json({ message: 'SongId é obrigatório.' });
        }

        let likedPlaylist = await Playlist.findOne({ 
            $or: [{ owner: userId }, { user: userId }],
            isLikedSongs: true 
        });

        if (!likedPlaylist) {
            const userProfile = await User.findById(userId);
            
            likedPlaylist = await Playlist.create({
                title: 'Músicas Curtidas',
                
                owner: userId, 
                user: userId,  
                
                isLikedSongs: true,
                isPublic: false,
                songs: userProfile?.likedSongs || [], 
                description: 'Músicas que você curtiu',
                cover: '/assets/img/liked_cover_0.png'
            });

            await User.findByIdAndUpdate(userId, {
                $addToSet: { userPlaylists: likedPlaylist._id }
            });
        }

        if (!likedPlaylist.songs) likedPlaylist.songs = [];

        const songIdStr = songId.toString();
        const songIndex = likedPlaylist.songs.findIndex(s => s && s.toString() === songIdStr);
        
        let isLiked = false;

        if (songIndex > -1) {
            likedPlaylist.songs.splice(songIndex, 1);
            await User.findByIdAndUpdate(userId, { $pull: { likedSongs: songId } });
            isLiked = false;
        } else {
            likedPlaylist.songs.push(songId);
            await User.findByIdAndUpdate(userId, { $addToSet: { likedSongs: songId } });
            isLiked = true;
        }

        likedPlaylist.songCount = likedPlaylist.songs.length;
        await likedPlaylist.save();

        return res.json({ 
            isLiked, 
            playlistId: likedPlaylist._id 
        });

    } catch (error) {
        console.error("ERRO AO CURTIR:", error);
        return res.status(500).json({ message: 'Erro interno', error: error.message });
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