import Musica from '../models/song.model.js';

class MusicService {
    
    async getMusicDetailsByIds(ids) {
        if (!ids || ids.length === 0) {
            return [];
        }

        try {
            let musicas = await Musica.find({ _id: { $in: ids } })
                .populate('artists', 'username img')
                .populate('album', 'title cover')
                .lean();

            const orderedMusicas = ids
                .map(id => musicas.find(m => m._id.toString() === id.toString()))
                .filter(m => m);

            return orderedMusicas;

        } catch (error) {
            throw new Error("Falha ao buscar detalhes das músicas.");
        }
    }

    async getMusicFilePath(musicId) {
        try {
            const musica = await Musica.findById(musicId).select('caminho');
            return musica ? musica.caminho : null;
        } catch (error) {
            return null;
        }
    }
    
    async incrementPlayCount(musicId) {
        try {
            await Musica.findByIdAndUpdate(musicId, { $inc: { playCount: 1 } });
        } catch (error) {
        }
    }
}

export default new MusicService();