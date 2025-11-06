import mongoose, { Schema } from 'mongoose';

const groupSchema = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  cover: { type: String, default: '' },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  currentListeners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  currentSong: { type: Schema.Types.ObjectId, ref: 'Song', default: null },
  status: { type: String, enum: ['online', 'offline', 'paused'], default: 'offline' }

}, { timestamps: true });

export default mongoose.model('Group', groupSchema);