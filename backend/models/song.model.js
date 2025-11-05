import mongoose, { Schema } from 'mongoose';

const songSchema = new Schema({
  id: { type: String, required: true, unique: true },
  cover: { type: String, default: '' },
  title: { type: String, required: true },
  artist: { type: String, required: true },
  artistId: { type: String, default: '' },
  duration: { type: String, default: '0:00' },
  releaseDate: { type: Date },
  recordLabel: { type: String, default: '' },
  caminho: { type: String, required: true },
  lyrics: { type: String, default: '' },
  albumId: { type: String },
  playCount: { type: Number, default: 0 },
  added: { type: String, default: '' }
}, { timestamps: true });


export default mongoose.model('Song', songSchema);