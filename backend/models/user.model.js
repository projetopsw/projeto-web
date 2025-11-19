import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  img: { type: String, default: '' },
  following: [{ type: Schema.Types.ObjectId, ref: 'Artist' }],
  friends: [{ 
      type: String, 
      ref: 'User',
      default: [] 
  }],

  friendshipRequests: [{ 
      type: String, 
      ref: 'User',
      default: [] 
  }],
  likedSongs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
  userPlaylists: [{ type: Schema.Types.ObjectId, ref: 'Playlist' }],
  admin: [{ type: Boolean, default: false}]
}, { timestamps: true });

export default mongoose.model('User', userSchema);