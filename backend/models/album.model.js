import mongoose, { Schema } from 'mongoose';

const albumSchema = new Schema({
  id: { type: String, required: true, unique: true },
  cover: { type: String, default: '' },
  title: { type: String, required: true },
  artist: { type: String, default: '' },
  artistId: { type: String, default: '' },
  releaseDate: { type: Date },
  genre: { type: String },
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
}, { timestamps: true });


export default mongoose.model('Album', albumSchema);