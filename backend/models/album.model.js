import mongoose, { Schema } from 'mongoose';

const albumSchema = new Schema({
  title: { type: String,required: true,trim: true },
  cover: { type: String, default: '' },
  releaseDate: { type: Date },
  genre: { type: String, trim: true },
  artist: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }]
}, { timestamps: true });

export default mongoose.model('Album', albumSchema);