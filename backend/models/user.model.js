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


}, { timestamps: true });

// 💡 Dica: Para fácil consulta de permissões no lado do servidor (backend), 
// você pode querer criar um índice nas chaves 'role' e 'email'.

export default mongoose.model('User', userSchema);