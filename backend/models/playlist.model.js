// src/models/playlist.model.js
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
        default: '/assets/img/vibe_cover_2.png'
    },
    user: { // Usa 'user' para consistência com o seu 'User' Schema (userPlaylists)
        type: Schema.Types.ObjectId, 
        ref: 'User', 
        required: true,
        index: true
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
}, { timestamps: true });

export default mongoose.model('Playlist', playlistSchema);