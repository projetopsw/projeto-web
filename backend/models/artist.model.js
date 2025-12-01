import mongoose, { Schema } from 'mongoose';

const artistSchema = new Schema({
    spotifyId: { type: String, required: true, unique: true, index: true, sparse: true },
    name: { type: String, required: true, index: true, trim: true },
    image: { type: String, default: '' },
    genres: [{ type: String, trim: true }],
    popularity: { type: Number, default: 0 },
    followers: { type: Number, default: 0 }, 
    spotifyUrl: { type: String, default: '' }, 
}, { timestamps: true });

artistSchema.index({ name: 'text', genres: 'text' });

artistSchema.statics.searchByTerm = async function(term) {
    try {
        const results = await this.find({
            $text: { $search: term }
        })
        .select('name image genres popularity followers spotifyUrl') 
        .limit(20);

        return results;
    } catch (error) {
        console.error(`Erro ao buscar artistas com o termo "${term}":`, error);
        throw new Error('Falha no banco de dados ao buscar artistas.');
    }
};

export default mongoose.model('Artist', artistSchema);