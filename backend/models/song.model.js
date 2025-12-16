import mongoose, { Schema } from 'mongoose';

const VALID_GENRES = [
    "Pop", "Rock", "Hip Hop", "Eletrônica", "Jazz", 
    "Blues", "Clássica", "Metal", "R&B", "Sertanejo", 
    "Funk", "Reggae", "Gospel", "Indie", "Folk", 
    "Country", "MPB", "Axé", "Forró", "Outro"
];

const songSchema = new Schema({
    spotifyId: { type: String, index: true, unique: true, sparse: true },
    isrc: { type: String, trim: true, index: true }, 
    title: { type: String, required: true, trim: true }, 
    cover: { type: String, default: ''}, 
    
    owner: { 
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    artists: [{ type: Schema.Types.ObjectId, ref: 'Artist', required: true }],
    album: { type: Schema.Types.ObjectId, ref: 'Album', default: null },
    duration: { type: Number, required: true }, 
    caminho: { type: String, default: '' }, 
    previewUrl: { type: String, default: '' }, 
    trackNumber: { type: Number, default: 1 }, 
    discNumber: { type: Number, default: 1 },
    explicit: { type: Boolean, default: false },
    popularity: { type: Number, default: 0 },
    releaseDate: { type: Date }, 
    spotifyUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    recordLabel: { type: String, default: 'Independente' },

    genres: [{ 
        type: String, 
        enum: VALID_GENRES, 
        required: false,
        default: ['Outro']
    }],

    isArtistUpload: { 
        type: Boolean,
        default: false,
    },

    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'User' 
    }],
    dislikes: [{
        type: Schema.Types.ObjectId,
        ref: 'User' 
    }],
    lyrics: { type: String, default: '' },

}, { timestamps: true });

songSchema.index({ album: 1, trackNumber: 1 }); 

songSchema.statics.searchByTerm = async function(searchRegexStart, searchRegexContains) {
    try {
        const selectFields = 'title artists album cover duration explicit previewUrl genres';

        const priorityQuery = {
            title: { $regex: searchRegexStart } 
        };

        const priorityResults = await this.find(priorityQuery)
            .select(selectFields)
            .populate('artists', 'name')
            .populate('album', 'title')
            .limit(10)
            .lean(); 

        const priorityIds = priorityResults.map(r => r._id);

        const relatedQuery = {
            _id: { $nin: priorityIds }, 
            title: { $regex: searchRegexContains }
        };

        const relatedResults = await this.find(relatedQuery)
            .select(selectFields)
            .populate('artists', 'name')
            .populate('album', 'title')
            .limit(10)
            .lean();
            
        return {
            priority: priorityResults,
            related: relatedResults
        };

    } catch (error) {
        throw new Error('Falha no banco de dados ao buscar músicas.');
    }
};

songSchema.statics.getDetailsForPreference = async function(songId) {
    const song = await this.findById(songId)
        .select('artists genres') 
        .populate('artists', 'name')
        .lean(); 

    if (!song) return null;

    return {
        id: song._id,
        genres: song.genres || [],
        artistNames: song.artists ? song.artists.map(a => a.name) : [],
    };
};

export default mongoose.model('Song', songSchema);