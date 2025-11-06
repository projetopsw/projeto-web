import mongoose, { Schema } from 'mongoose';

const artistSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
  image: { type: String, default: '' },
  genre: { type: String, trim: true, default: '' },
  about: { type: String, trim: true, default: '' },
  albums: [{ type: Schema.Types.ObjectId, ref: 'Album' }],
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
}, { timestamps: true });

artistSchema.index({ name: 'text', genre: 'text' });

export default mongoose.model('Artist', artistSchema);