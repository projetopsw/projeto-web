import Comentario from '../models/comentario.model.js';

const ComentarioService = {
    findByMusicaId: async (musicaId) => {
        return await Comentario.find({ musicaId }).sort({ data: -1 });
    },

    create: async ({ musicaId, texto, autor, autorId, autorImage }) => {
        const novoComentario = new Comentario({
            musicaId,
            texto,
            autor: autor || 'Anônimo',
            autorId: autorId, 
            autorImage: autorImage, 
        });
        return await novoComentario.save();
    }
};

export default ComentarioService;