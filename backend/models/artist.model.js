import mongoose, { Schema } from 'mongoose';

const artistSchema = new Schema({
 name: { 
    type: String, 
    required: true,
    index: true
  },
  spotifyId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  genres: [String],
  image: String,
  popularity: Number,
  externalUrl: String,
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

artistSchema.index({ name: 'text', genre: 'text' });

export default mongoose.model('Artist', artistSchema);