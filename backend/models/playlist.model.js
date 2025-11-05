import mongoose, { Schema } from 'mongoose';

const playlistSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  creatorId: { type: String, required: true },
  description: { type: String, default: '' },
  img: { type: String, default: '' },
  songs: [{ type: String }],
  duration: { type: String, default: '0:00' },
  songCount: { type: Number, default: 0 },
}, { timestamps: true });


export default mongoose.model('Playlist', playlistSchema);