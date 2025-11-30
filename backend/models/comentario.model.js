import mongoose from 'mongoose';

const ComentarioSchema = new mongoose.Schema({
    musicaId: {
        type: String,
        required: true,
    },
    texto: {
        type: String,
        required: true,
    },
    autor: {
        type: String,
        default: 'Anônimo',
    },
    autorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, 
    },
    autorImage: { 
        type: String,
        required: false,
    },
    data: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model('Comentario', ComentarioSchema);