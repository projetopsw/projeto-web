import mongoose, { Schema } from 'mongoose';

const artistSchema = new Schema({
  spotifyId: { type: String, required: true, unique: true, index: true, sparse: true },
  name: { type: String, required: true, index: true, trim: true },
  image: { type: String, default: '' },
  genres: [{ type: String, trim: true }],
  popularity: { type: Number, default: 0 },
  followers: { type: Number, default: 0 }, 
  spotifyUrl: { type: String, default: '' }, 
}, { timestamps: true });
artistSchema.index({ name: 'text', genres: 'text' });

export default mongoose.model('Artist', artistSchema);