import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, select: false }, 
    img: { type: String },

    spotifyId: { type: String, unique: true, sparse: true }, 
    refresh_token_spotify: { type: String, select: false }, 
    access_token_spotify: { type: String, select: false }, 

    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
    
    permissions: [{ 
        type: String, 
        default: [] 
    }],
    
    myMusics: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Musica' 
    }],
    
    likedSongs: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Musica' 
    }],
    
    userPlaylists: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Playlist' 
    }],
    
    following: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'Artist' 
    }],
    
    friends: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }],
    
    friendshipRequests: [{ 
        type: Schema.Types.ObjectId, 
        ref: 'User' 
    }],

}, { timestamps: true });

userSchema.statics.searchByTerm = async function(searchRegexStart, searchRegexContains) {
    
    const fieldsToSelect = '_id username email img friends following'; 
    const limit = 10;
    
    try {
        const priorityResults = await this.find({
            $or: [
                { username: { $regex: searchRegexStart } },
                { email: { $regex: searchRegexStart } }
            ]
        }).select(fieldsToSelect).limit(limit).exec();

        const relatedResults = await this.find({
            $and: [
                { 
                    $or: [
                        { username: { $regex: searchRegexContains } },
                        { email: { $regex: searchRegexContains } }
                    ]
                },
                { 
                    _id: { $nin: priorityResults.map(u => u._id) } 
                }
            ]
        }).select(fieldsToSelect).limit(limit).exec();

        return {
            priority: priorityResults,
            related: relatedResults
        };
    } catch (error) {
        throw new Error('Falha no banco de dados ao buscar usuários.');
    }
};

export default mongoose.model('User', userSchema);