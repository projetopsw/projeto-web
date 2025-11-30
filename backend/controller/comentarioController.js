import Comentario from '../models/comentario.model.js';
import User from '../models/user.model.js'; 

const ComentarioController = {
    getComments: async (req, res) => {
        try {
            const { musicaId } = req.params;

            let comentarios = await Comentario.find({ 
                musicaId,
                autorId: { $ne: null }
            })
                .populate({
                    path: 'autorId',
                    select: 'username img role' 
                })
                .sort({ createdAt: -1 });

            res.status(200).json(comentarios);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar comentários.', error });
        }
    },

    addComment: async (req, res) => {
        try {
            const { musicaId, texto, autor, autorId, autorImage } = req.body; 

            if (!musicaId || !texto) {
                return res.status(400).json({ message: "musicaId e texto são obrigatórios" });
            }
            
            if (autor === 'Anônimo' || !autorId) {
                return res.status(403).json({ message: "Usuários anônimos não podem comentar." });
            }
            
            const novoComentario = await Comentario.create({ 
                musicaId, 
                texto, 
                autor,
                autorId,
                autorImage
            });
            
            const comentarioPopuladofull = await Comentario.findById(novoComentario._id)
                .populate({
                    path: 'autorId',
                    select: 'username img role'
                });

            res.status(201).json(comentarioPopuladofull);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

export default ComentarioController;