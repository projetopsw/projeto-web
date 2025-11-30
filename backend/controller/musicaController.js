import Musica from '../models/song.model.js'; 

const MusicaController = {
    
    getMusicas: async (req, res) => {
        try {
            const musicas = await Musica.find({})
                .populate('artists', 'name')
                .populate('album', 'title cover');
            
            res.status(200).json(musicas);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar músicas.', error: error.message });
        }
    },
    
    createMusica: async (req, res) => {
        try {
            const novaMusica = new Musica(req.body);
            await novaMusica.save();
            
            res.status(201).json(novaMusica);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({ message: 'Música com este ID/ISRC já existe.' });
            }
            res.status(400).json({ message: 'Falha ao criar música.', error: error.message });
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
                if (musica.likes.includes(userId)) {
                    userAction = 'like';
                } else if (musica.dislikes.includes(userId)) {
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
            console.error("Erro ao processar like/dislike:", error);
            res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
        }
    }
};

export default MusicaController;