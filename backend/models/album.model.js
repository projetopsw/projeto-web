import mongoose, { Schema } from 'mongoose';

const albumSchema = new Schema({
  spotifyId: { type: String, index: true, unique: true, sparse: true },
  title: { type: String, required: true, trim: true }, 
  cover: { type: String, default: '' }, 
  releaseDate: { type: Date }, 
  releaseDatePrecision: { type: String }, 
  recordLabel: { type: String, trim: true, default: '' },
  popularity: { type: Number, default: 0 }, 
  totalTracks: { type: Number, default: 0 }, 
  genres: [{ type: String, trim: true }], 
  spotifyUrl: { type: String, default: '' },
  artists: [{ type: Schema.Types.ObjectId, ref: 'Artist', required: true }], 
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }]

}, { timestamps: true });

export default mongoose.model('Album', albumSchema);