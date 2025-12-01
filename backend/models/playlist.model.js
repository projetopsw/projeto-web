import mongoose, { Schema } from 'mongoose';

const playlistSchema = new Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    img: { type: String, default: '' },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    songs: [{
        song: { type: Schema.Types.ObjectId, ref: 'Song' },
        addedAt: { type: Date, default: Date.now }
    }],
    durationSeconds: { type: Number, default: 0 },
    songCount: { type: Number, default: 0 }
}, {timestamps: true});

playlistSchema.statics.searchByTerm = async function(term) {
    try {
        const results = await this.find({
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { description: { $regex: term, $options: 'i' } }
            ]
        })
        .select('name description img user songCount')
        .populate('user', 'username') 
        .limit(20);

        return results;
    } catch (error) {
        console.error(`Erro ao buscar playlists com o termo "${term}":`, error);
        throw new Error('Falha no banco de dados ao buscar playlists.');
    }
};

export default mongoose.model('Playlist', playlistSchema);