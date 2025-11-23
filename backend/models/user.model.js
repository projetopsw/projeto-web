
import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, select: false }, // Nunca retornar a senha por padrão
    img: { type: String},

    // Campos para Login Social (Spotify)
    spotifyId: { type: String, unique: true, sparse: true }, 
    refresh_token_spotify: { type: String, select: false }, 
    access_token_spotify: { type: String, select: false },   

    // Outros campos
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);