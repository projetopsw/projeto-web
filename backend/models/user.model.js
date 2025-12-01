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

userSchema.statics.searchByTerm = async function(term) {
    try {
        const results = await this.find({
            $or: [
                { username: { $regex: term, $options: 'i' } },
                { email: { $regex: term, $options: 'i' } }
            ]
        }).select('username email img role').limit(20); 

        return results;
    } catch (error) {
        console.error(`Erro ao buscar usuários com o termo "${term}":`, error);
        throw new Error('Falha no banco de dados ao buscar usuários.');
    }
};

export default mongoose.model('User', userSchema);