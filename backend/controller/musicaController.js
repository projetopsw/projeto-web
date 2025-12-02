import Musica from '../models/song.model.js'; 
import User from '../models/user.model.js'; 

const convertDurationToSeconds = (durationString) => {
    if (!durationString || typeof durationString !== 'string') {
        return 0;
    }
    const parts = durationString.split(':').map(p => parseInt(p, 10));
    
    if (parts.length === 2) {
        const minutes = parts[0] || 0;
        const seconds = parts[1] || 0;
        return minutes * 60 + seconds;
    } 
    return 0;
};

const getArtistIdFromAuth = (req) => {
    return req.userId; 
};

const API_BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000'; 

const MusicaController = {
    
    getMusicas: async (req, res) => {
        try {
            const musicas = await Musica.find({})
                .populate('artists', 'username img')
                .populate('album', 'title cover');
            
            res.status(200).json(musicas);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar músicas.', error: error.message });
        }
    },
    
    createMusica: async (req, res) => {
        
        const {
            title, 
            duration,         
            descricao,        
            letra,            
            generos,          
            recordLabel,      
        } = req.body;
        
        if (!req.files || !req.files.arquivoMusica || !req.files.arquivoCapa) {
             return res.status(400).json({ message: 'Arquivos de música e capa são obrigatórios.' });
        }
        
        if (!title || !duration || !generos) {
            return res.status(400).json({ message: 'Dados de música incompletos (título, duração e gênero são obrigatórios).' });
        }
        
        try {
            
            const durationInSeconds = convertDurationToSeconds(duration);

            if (durationInSeconds === 0) {
                 return res.status(400).json({ message: 'Duração da música inválida.' });
            }
            
            const artistId = getArtistIdFromAuth(req); 
            if (!artistId) {
                return res.status(401).json({ message: 'Falha na autenticação: ID do usuário (artista) ausente na requisição.' });
            }

            const musicaFilename = req.files.arquivoMusica[0].filename;
            const capaFilename = req.files.arquivoCapa[0].filename;
            
            const finalCaminho = `${API_BASE_URL}/music_files/${musicaFilename}`; 
            const finalCoverUrl = `${API_BASE_URL}/cover_images/${capaFilename}`;
            
            let finalGenres = generos;
            if (typeof generos === 'string') {
                 try {
                     finalGenres = JSON.parse(generos);
                 } catch (e) {
                     finalGenres = [generos];
                 }
            }
            
            const musicData = {
                title: title,
                duration: durationInSeconds,
                
                description: descricao,
                lyrics: letra,
                recordLabel: recordLabel,
                
                caminho: finalCaminho,
                cover: finalCoverUrl,
                
                artists: [artistId], 
                
                genres: finalGenres,
                releaseDate: new Date(),
            };
            
            const novaMusica = new Musica(musicData);
            await novaMusica.save();
            
            await User.findByIdAndUpdate(artistId, {
                $push: { myMusics: novaMusica._id }
            }, { new: true });
            
            res.status(201).json(novaMusica);
            
        } catch (error) {
            if (error.code === 11000) {
                 return res.status(409).json({ message: 'Música com este ID/ISRC já existe.' });
            }
            if (error.name === 'ValidationError') {
                 return res.status(400).json({ message: 'Erro de validação nos dados da música.', error: error.message });
            }
            
            res.status(500).json({ message: 'Falha ao criar música (Erro interno do servidor).', error: error.message });
        }
    },
    
    updateMusica: async (req, res) => {
        try {
            const { musicaId } = req.params;
            
            const musicaAtualizada = await Musica.findByIdAndUpdate(
                musicaId,
                req.body,
                { new: true, runValidators: true }
            );

            if (!musicaAtualizada) {
                return res.status(404).json({ message: 'Música não encontrada.' });
            }
            
            res.status(200).json(musicaAtualizada);
        } catch (error) {
            res.status(400).json({ message: 'Falha ao atualizar música.', error: error.message });
        }
    },
    
    deleteMusica: async (req, res) => {
        try {
            const { musicaId } = req.params;
            
            const musicaDeletada = await Musica.findByIdAndDelete(musicaId);

            if (!musicaDeletada) {
                return res.status(404).json({ message: 'Música não encontrada.' });
            }
            
            const artistId = musicaDeletada.artists[0];
            if (artistId) {
                await User.findByIdAndUpdate(artistId, {
                    $pull: { myMusics: musicaId }
                });
            }

            res.status(200).json({ message: 'Música deletada com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Falha ao deletar música.', error: error.message });
        }
    },
    
    getVoteStatus: async (req, res) => {
        const { musicaId } = req.params;
        const { userId } = req.query;

        try {
            const musica = await Musica.findById(musicaId).select('likes dislikes');

            if (!musica) {
                return res.status(404).json({ message: "Música não encontrada." }); 
            }

            let userAction = null;
            if (userId) {
                if (musica.likes.map(id => id.toString()).includes(userId)) {
                    userAction = 'like';
                } else if (musica.dislikes.map(id => id.toString()).includes(userId)) {
                    userAction = 'dislike';
                }
            }

            res.status(200).json({
                likes: musica.likes.length,
                dislikes: musica.dislikes.length,
                userAction: userAction
            });

        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar status do voto.', error: error.message });
        }
    },

    toggleLikeDislike: async (req, res) => {
        const { musicaId } = req.params;
        const { userId, action } = req.body; 

        if (!['like', 'dislike'].includes(action)) {
            return res.status(400).json({ message: "Ação inválida. Use 'like' ou 'dislike'." });
        }

        try {
            const musica = await Musica.findById(musicaId); 
            if (!musica) {
                return res.status(404).json({ message: "Música não encontrada." });
            }
            
            const userIdString = userId.toString(); 

            const isLiked = musica.likes.map(id => id.toString()).includes(userIdString);
            const isDisliked = musica.dislikes.map(id => id.toString()).includes(userIdString);

            let update = {};
            let finalAction = action;

            if (action === 'like') {
                if (isLiked) {
                    update = { $pull: { likes: userId } };
                    finalAction = null;
                } else {
                    update = { $addToSet: { likes: userId }, $pull: { dislikes: userId } };
                }
            } else if (action === 'dislike') {
                if (isDisliked) {
                    update = { $pull: { dislikes: userId } };
                    finalAction = null;
                } else {
                    update = { $addToSet: { dislikes: userId }, $pull: { likes: userId } };
                }
            }
            
            const updatedMusica = await Musica.findByIdAndUpdate(
                musicaId,
                update,
                { new: true, select: 'likes dislikes' } 
            );

            const userActionToReturn = finalAction === null ? null : action; 

            return res.status(200).json({ 
                likes: updatedMusica.likes.length,
                dislikes: updatedMusica.dislikes.length,
                userAction: userActionToReturn
            });

        } catch (error) {
            res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
        }
    }
};

export default MusicaController;