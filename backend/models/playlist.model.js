import mongoose, { Schema } from 'mongoose';

const playlistSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  img: { type: String, default: '' },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  songs: [{
      song: { type: Schema.Types.ObjectId, ref: 'Song' },
      addedAt: { type: Date, default: Date.now }
  }],
  durationSeconds: { type: Number, default: 0 },
  songCount: { type: Number, default: 0 }
}, {timestamps: true});

export default mongoose.model('Playlist', playlistSchema);