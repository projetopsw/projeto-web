import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  img: { type: String, default: '' },
  likedSongs: [{ type: String }],          
  following: [{ type: String }],           
  friends: [{ type: String }],        
  userPlaylists: [{ type: String }],    
  friendshipRequests: [{ type: String }],   
}, { timestamps: true });


export default mongoose.model('User', userSchema);