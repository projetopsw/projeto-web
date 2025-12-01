import Playlist from "../models/Playlist.js"; // Certifique-se de ter o model

export const getPlaylists = async (req, res) => {
  try {
    // Retorna lista vazia se não tiver nada, mas com sucesso (200)
    const playlists = await Playlist.find({}); 
    res.status(200).json(playlists);
  } catch (err) {
    res.status(500).json(err);
  }
};