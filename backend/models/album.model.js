import mongoose, { Schema } from 'mongoose';

const albumSchema = new Schema({
  spotifyId: { type: String, index: true, unique: true, sparse: true },
  title: { type: String, required: true, trim: true },
  cover: { type: String, default: '' }, 
  releaseDate: { type: Date }, 
  releaseDatePrecision: { type: String },
  genres: [{ type: String, trim: true }], 
  artists: [{ type: Schema.Types.ObjectId, ref: 'Artist', required: true }],
  totalTracks: { type: Number, default: 0 },
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
}, { timestamps: true });

export default mongoose.model('Album', albumSchema);