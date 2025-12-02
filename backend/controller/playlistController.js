import Playlist from "../models/Playlist.js"; 

export const getPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({}); 
    res.status(200).json(playlists);
  } catch (err) {
    res.status(500).json(err);
  }
};