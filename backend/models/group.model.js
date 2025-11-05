import mongoose, { Schema } from 'mongoose';

const groupSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  creatorId: { type: String, required: true },
  description: { type: String, default: '' },
  cover: { type: String, default: '' },
  members: [{ type: String }],       
  currentListeners: [{ type: String }],     
  currentSong: { type: String, default: null }, 
  status: { type: String, default: 'offline' }, 
}, { timestamps: true });


export default mongoose.model('Group', groupSchema);