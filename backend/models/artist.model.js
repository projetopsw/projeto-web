import mongoose, { Schema } from 'mongoose';

const artistSchema = new Schema({
    spotifyId: { type: String, unique: true, index: true, sparse: true },
    name: { type: String, required: true, index: true, trim: true },
    image: { type: String, default: '' },
    genres: [{ type: String, trim: true }],
    popularity: { type: Number, default: 0 },
    followers: { type: Number, default: 0 }, 
    spotifyUrl: { type: String, default: '' }, 
}, { timestamps: true });

artistSchema.statics.searchByTerm = async function(searchRegexStart, searchRegexContains) {
    try {
        const selectFields = 'name image genres popularity followers spotifyUrl';

        const priorityQuery = {
            $or: [
                { name: { $regex: searchRegexStart } },
                { genres: { $regex: searchRegexStart } }
            ]
        };

        const priorityResults = await this.find(priorityQuery)
            .select(selectFields)
            .limit(10)
            .lean();

        const priorityIds = priorityResults.map(r => r._id);

        const relatedQuery = {
            _id: { $nin: priorityIds },
            $or: [
                { name: { $regex: searchRegexContains } },
                { genres: { $regex: searchRegexContains } }
            ]
        };

        const relatedResults = await this.find(relatedQuery)
            .select(selectFields)
            .limit(10);
            
        return {
            priority: priorityResults,
            related: relatedResults
        };

    } catch (error) {
        throw new Error('Falha no banco de dados ao buscar artistas.');
    }
};

export default mongoose.model('Artist', artistSchema);