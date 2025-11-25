import mongoose, { Schema } from 'mongoose';

const songSchema = new Schema({
  spotifyId: { type: String, index: true, unique: true, sparse: true },
  title: { type: String, required: true, trim: true },
  cover: { type: String, default: ''}, 
  artists: [{ type: Schema.Types.ObjectId, ref: 'Artist', required: true }],
  album: { type: Schema.Types.ObjectId, ref: 'Album', default: null },
  duration: { type: Number, required: true }, 
  caminho: { type: String, default: '' }, 
  previewUrl: { type: String, default: '' }, 
  releaseDate: { type: Date },
  // O campo 'recordLabel' geralmente vem no objeto ALBUM, não na track.
  // Você terá que preencher isso copiando do album se quiser aqui.
  recordLabel: { type: String, trim: true, default: '' },
  explicit: { type: Boolean, default: false },
  popularity: { type: Number, default: 0 } 
}, { timestamps: true });

songSchema.index({ album: 1, title: 1 }, { unique: false }); 

export default mongoose.model('Song', songSchema);