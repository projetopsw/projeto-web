// src/controller/playlistController.js

import Playlist from '../models/playlist.model.js';
import User from '../models/user.model.js'; 
import Song from '../models/song.model.js'; 
import mongoose from 'mongoose';

const PlaylistController = {
    createPlaylist: async (req, res) => {
        const { title, description, isPublic } = req.body;
        const userId = req.user._id || req.user.id; 

        if (!title) {
            return res.status(400).json({ message: 'O título da playlist é obrigatório.' });
        }
        
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
             return res.status(401).json({ message: 'ID de usuário inválido após autenticação. Refaça o login.' });
        }

        try {
            const coverUrl = req.file 
                ? `/cover_images/${req.file.filename}` 
                : (req.body.cover || undefined);

            const novaPlaylist = new Playlist({
                title,
                description,
                user: userId, 
                cover: coverUrl,
                isPublic: isPublic !== undefined ? isPublic : true,
                songs: [], 
                songCount: 0,
            });

            const savedPlaylist = await novaPlaylist.save();
            
            await User.findByIdAndUpdate(userId, {
                $push: { userPlaylists: savedPlaylist._id }
            });

            res.status(201).json({ 
                message: 'Playlist criada com sucesso!', 
                playlist: savedPlaylist 
            });

        } catch (error) {
            console.error("Erro ao criar playlist no controller:", error); 
            if (error.name === 'ValidationError') {
                 return res.status(400).json({ message: 'Dados inválidos para a playlist.', errors: error.errors });
            }
            res.status(500).json({ message: 'Erro interno do servidor ao criar playlist.', error: error.message });
        }
    },
    
    getPlaylists: async (req, res) => {
        try {
            const playlists = await Playlist.find({ isPublic: true })
                .populate('user', 'username img') 
                .select('-songs') 
                .lean();

            res.status(200).json(playlists);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar playlists.', error: error.message });
        }
    },

    getPlaylistById: async (req, res) => {
        const { id } = req.params;
        const loggedInUserId = req.user?._id || req.user?.id; 

        try {
            const playlist = await Playlist.findById(id)
                .populate('user', 'username img') 
                .populate('songs', 'title duration cover artists caminho') 
                .lean();

            if (!playlist) {
                return res.status(404).json({ message: 'Playlist não encontrada.' });
            }

            const isOwner = loggedInUserId && playlist.user._id.toString() === loggedInUserId.toString();
            if (!playlist.isPublic && !isOwner) {
                return res.status(403).json({ message: 'Acesso negado. Esta playlist é privada.' });
            }

            res.status(200).json(playlist);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar playlist.', error: error.message });
        }
    },

    updatePlaylist: async (req, res) => {
        const { id } = req.params;
        const { title, description, isPublic, cover } = req.body; // Pega 'cover' (que pode ser o link) do body
        const userId = (req.user._id || req.user.id)?.toString(); 

        try {
            const playlist = await Playlist.findById(id);
            if (!playlist) {
                return res.status(404).json({ message: 'Playlist não encontrada.' });
            }

            if (playlist.user.toString() !== userId) {
                return res.status(403).json({ message: 'Acesso negado. Você não é o proprietário desta playlist.' });
            }

            let updateFields = {};
            if (title !== undefined) updateFields.title = title;
            if (description !== undefined) updateFields.description = description;
            if (isPublic !== undefined) updateFields.isPublic = isPublic;
            
            // Aceita o link do body JSON como capa
            if (cover !== undefined) {
                 updateFields.cover = cover; 
            }

            // Prioridade ao arquivo de upload (se você usar o middleware de upload)
            if (req.file) { 
                updateFields.cover = `/cover_images/${req.file.filename}`;
            }

            if (Object.keys(updateFields).length === 0) {
                 return res.status(200).json({ message: 'Nenhuma alteração detectada.', playlist });
            }

            const updatedPlaylist = await Playlist.findByIdAndUpdate(
                id,
                updateFields,
                { new: true, runValidators: true }
            );

            res.status(200).json({ message: 'Playlist atualizada com sucesso.', playlist: updatedPlaylist });
        } catch (error) {
            res.status(500).json({ message: 'Falha ao atualizar playlist.', error: error.message });
        }
    },
    
    deletePlaylist: async (req, res) => {
        const { id } = req.params;
        const userId = (req.user._id || req.user.id)?.toString();

        try {
            const playlist = await Playlist.findById(id);
            if (!playlist) {
                return res.status(404).json({ message: 'Playlist não encontrada.' });
            }

            if (playlist.user.toString() !== userId) {
                return res.status(403).json({ message: 'Acesso negado. Você não é o proprietário desta playlist.' });
            }

            await Playlist.findByIdAndDelete(id);

            await User.findByIdAndUpdate(userId, {
                $pull: { userPlaylists: id }
            });

            res.status(200).json({ message: 'Playlist deletada com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Falha ao deletar playlist.', error: error.message });
        }
    },
    
    addSongToPlaylist: async (req, res) => {
        const { id } = req.params;
        const { songId } = req.body;
        const userId = (req.user._id || req.user.id)?.toString();

        if (!mongoose.Types.ObjectId.isValid(songId)) {
             return res.status(400).json({ message: 'ID de música inválido.' });
        }

        try {
            const playlist = await Playlist.findById(id);

            if (!playlist) return res.status(404).json({ message: 'Playlist não encontrada.' });
            
            if (playlist.user.toString() !== userId) {
                return res.status(403).json({ message: 'Acesso negado. Você não é o proprietário desta playlist.' });
            }

            const songExists = await Song.findById(songId).select('_id');
            if (!songExists) return res.status(404).json({ message: 'Música não encontrada.' });
            
            const updatedPlaylist = await Playlist.findByIdAndUpdate(
                id,
                { 
                    $addToSet: { songs: songId }, 
                    $inc: { songCount: 1 } 
                }, 
                { new: true }
            );

            res.status(200).json({ 
                message: 'Música adicionada à playlist com sucesso.', 
                playlist: updatedPlaylist 
            });

        } catch (error) {
            res.status(500).json({ message: 'Falha ao adicionar música.', error: error.message });
        }
    },

    removeSongFromPlaylist: async (req, res) => {
        const { id } = req.params; 
        const { songId } = req.body;
        const userId = (req.user._id || req.user.id)?.toString();

        if (!mongoose.Types.ObjectId.isValid(songId)) {
             return res.status(400).json({ message: 'ID de música inválido.' });
        }

        try {
            const playlist = await Playlist.findById(id);

            if (!playlist) return res.status(404).json({ message: 'Playlist não encontrada.' });
            
            if (playlist.user.toString() !== userId) {
                return res.status(403).json({ message: 'Acesso negado. Você não é o proprietário desta playlist.' });
            }
            
            const updatedPlaylist = await Playlist.findByIdAndUpdate(
                id,
                { 
                    $pull: { songs: songId }, 
                    $inc: { songCount: -1 } 
                }, 
                { new: true }
            );

            if (updatedPlaylist.songCount < 0) {
                updatedPlaylist.songCount = 0;
                await updatedPlaylist.save();
            }

            res.status(200).json({ 
                message: 'Música removida da playlist com sucesso.', 
                playlist: updatedPlaylist 
            });

        } catch (error) {
            res.status(500).json({ message: 'Falha ao remover música.', error: error.message });
        }
    },
};

export default PlaylistController;