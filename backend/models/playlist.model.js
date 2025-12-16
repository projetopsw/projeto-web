import mongoose, { Schema } from 'mongoose';

const playlistSchema = new Schema({
    title: { 
        type: String, 
        required: true, 
        trim: true,
        maxlength: 100 
    },
    description: { 
        type: String, 
        default: '',
        maxlength: 500 
    },
    cover: { 
        type: String, 
        default: '/assets/img/default_playlist_cover.png'
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
    },
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false 
    },
    songs: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Song'
    }],
    songCount: { 
        type: Number,
        default: 0
    },
    isPublic: { 
        type: Boolean,
        default: true
    },
    isLikedSongs: { 
        type: Boolean, 
        default: false 
    },
}, { timestamps: true });

playlistSchema.index({ owner: 1, isLikedSongs: 1 }, { unique: true, partialFilterExpression: { isLikedSongs: true } });

playlistSchema.statics.searchByTerm = async function(searchRegexStart, searchRegexContains) {
    
    const fieldsToSelect = 'title description cover user songCount isPublic'; 
    const limit = 10;
    
    const baseCondition = {
        isPublic: true,
        isLikedSongs: false 
    };
    
    try {
        const priorityQuery = {
            ...baseCondition,
            $or: [
                { title: { $regex: searchRegexStart } },
                { description: { $regex: searchRegexStart } }
            ]
        };

        const priorityResults = await this.find(priorityQuery)
            .select(fieldsToSelect)
            .populate('user', 'username')
            .limit(limit)
            .lean()
            .exec();

        const priorityIds = priorityResults.map(r => r._id);

        const relatedQuery = {
            ...baseCondition,
            _id: { $nin: priorityIds },
            $or: [
                { title: { $regex: searchRegexContains } },
                { description: { $regex: searchRegexContains } }
            ]
        };

        const relatedResults = await this.find(relatedQuery)
            .select(fieldsToSelect)
            .populate('user', 'username')
            .limit(limit)
            .lean()
            .exec();

        return {
            priority: priorityResults,
            related: relatedResults
        };

    } catch (error) {
        throw new Error('Falha no banco de dados ao buscar playlists.');
    }
};

export default mongoose.model('Playlist', playlistSchema);