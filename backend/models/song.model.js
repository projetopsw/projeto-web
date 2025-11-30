import mongoose, { Schema } from 'mongoose';

const songSchema = new Schema({
  spotifyId: { type: String, index: true, unique: true, sparse: true },
  isrc: { type: String, trim: true, index: true }, 
  title: { type: String, required: true, trim: true }, 
  cover: { type: String, default: ''}, 
  artists: [{ type: Schema.Types.ObjectId, ref: 'Artist', required: true }],
  album: { type: Schema.Types.ObjectId, ref: 'Album', default: null },
  duration: { type: Number, required: true }, // segundos
  caminho: { type: String, default: '' }, 
  previewUrl: { type: String, default: '' }, 
  trackNumber: { type: Number, default: 1 }, 
  discNumber: { type: Number, default: 1 },
  explicit: { type: Boolean, default: false },
  popularity: { type: Number, default: 0 },
  releaseDate: { type: Date }, 
  spotifyUrl: { type: String, default: '' },

}, { timestamps: true });

songSchema.index({ album: 1, trackNumber: 1 }); 
songSchema.index({ title: 'text' }); 
export default mongoose.model('Song', songSchema);