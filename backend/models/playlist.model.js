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

playlistSchema.statics.searchByTerm = async function(searchRegexStart, searchRegexContains) {
    try {
        const selectFields = 'name description img user songCount';

        const priorityQuery = {
            $or: [
                { name: { $regex: searchRegexStart } },
                { description: { $regex: searchRegexStart } }
            ]
        };

        const priorityResults = await this.find(priorityQuery)
            .select(selectFields)
            .populate('user', 'username')
            .limit(10)
            .lean();

        const priorityIds = priorityResults.map(r => r._id);

        const relatedQuery = {
            _id: { $nin: priorityIds },
            $or: [
                { name: { $regex: searchRegexContains } },
                { description: { $regex: searchRegexContains } }
            ]
        };

        const relatedResults = await this.find(relatedQuery)
            .select(selectFields)
            .populate('user', 'username')
            .limit(10);
            
        return {
            priority: priorityResults,
            related: relatedResults
        };

    } catch (error) {
        throw new Error('Falha no banco de dados ao buscar playlists.');
    }
};

export default mongoose.model('Playlist', playlistSchema);