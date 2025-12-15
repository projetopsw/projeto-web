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

export default mongoose.model('Playlist', playlistSchema);