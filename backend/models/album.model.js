import mongoose, { Schema } from 'mongoose';

const albumSchema = new Schema({
    spotifyId: { type: String, index: true, unique: true, sparse: true },
    title: { type: String, required: true, trim: true }, 
    cover: { type: String, default: '' }, 
    releaseDate: { type: Date }, 
    releaseDatePrecision: { type: String }, 
    recordLabel: { type: String, trim: true, default: '' },
    popularity: { type: Number, default: 0 }, 
    totalTracks: { type: Number, default: 0 }, 
    genres: [{ type: String, trim: true }], 
    spotifyUrl: { type: String, default: '' },
    artists: [{ type: Schema.Types.ObjectId, ref: 'Artist', required: true }], 
    songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }]

}, { timestamps: true });

albumSchema.statics.searchByTerm = async function(searchRegexStart, searchRegexContains) { 
    try {
        const selectFields = 'title cover releaseDate totalTracks artists genres';

        const priorityQuery = {
            $or: [
                { title: { $regex: searchRegexStart } },
                { recordLabel: { $regex: searchRegexStart } }
            ]
        };

        const priorityResults = await this.find(priorityQuery)
            .select(selectFields)
            .populate('artists', 'name')
            .limit(10)
            .lean();

        const priorityIds = priorityResults.map(r => r._id);

        const relatedQuery = {
            _id: { $nin: priorityIds },
            $or: [
                { title: { $regex: searchRegexContains } },
                { recordLabel: { $regex: searchRegexContains } }
            ]
        };

        const relatedResults = await this.find(relatedQuery)
            .select(selectFields)
            .populate('artists', 'name')
            .limit(10)
            .lean();
            
        return {
            priority: priorityResults,
            related: relatedResults
        };

    } catch (error) {
        throw new Error('Falha no banco de dados ao buscar álbuns.');
    }
};

export default mongoose.model('Album', albumSchema);