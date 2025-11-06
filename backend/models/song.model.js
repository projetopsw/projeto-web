import mongoose, { Schema } from 'mongoose';

const songSchema = new Schema({
  title: { type: String, required: true, trim: true },
  cover: { type: String, default: ''},
  artist: { type: Schema.Types.ObjectId, ref: 'Artist', required: true },
  album: { type: Schema.Types.ObjectId, ref: 'Album', default: null },
  duration: { type: Number, required: true },
  caminho: { type: String, required: true },
  releaseDate: { type: Date },
  recordLabel: { type: String, trim: true, default: '' },
  lyrics: { type: String, default: '' },
  playCount: { type: Number, default: 0 }
}, { timestamps: true });

songSchema.index({ album: 1, title: 1 }, { unique: false }); 

export default mongoose.model('Song', songSchema);