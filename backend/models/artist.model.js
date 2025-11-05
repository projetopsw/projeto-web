import mongoose, { Schema } from 'mongoose';

const artistSchema = new Schema({
  id: { type: String, required: true, unique: true },
  image: { type: String, default: '' },
  name: { type: String, required: true },
  genre: { type: String, default: '' },
  about: { type: String, default: '' },
  albums: [{ type: Schema.Types.ObjectId, ref: 'Album' }],
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
}, { timestamps: true });


export default mongoose.model('Artist', artistSchema);