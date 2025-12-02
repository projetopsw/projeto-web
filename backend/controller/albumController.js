import Album from "../models/album.model.js";
import Song from "../models/song.model.js";
import Artist from "../models/artist.model.js";
import { spotifyGet } from "../services/spotifyService.js"; 
import { mapAlbum, mapTrack, mapArtist } from "../services/spotifyMapper.js";
import mongoose from 'mongoose';

async function upsertArtist(spArtist) {
  if (!spArtist) return null;
  const data = mapArtist(spArtist);
  
  const updateData = { ...data };
  if (!data.image) delete updateData.image;

  return await Artist.findOneAndUpdate(
    { spotifyId: data.spotifyId },
    { $set: updateData },
    { new: true, upsert: true }
  );
}

async function upsertTrack(spTrack, albumId, artistIds) {
  const data = mapTrack(spTrack, artistIds, albumId);
  
  return await Song.findOneAndUpdate(
    { spotifyId: data.spotifyId },
    { $set: data },
    { new: true, upsert: true }
  );
}


export const getAlbumById = async (req, res) => {
  const { id } = req.params; 

  try {
    let album = null;
    let spotifyIdToFetch = id; 

    if (mongoose.Types.ObjectId.isValid(id)) {
        album = await Album.findById(id)
            .populate("artists", "name image")
            .populate("songs");
            
        if (album) {
            spotifyIdToFetch = album.spotifyId;
        }
    } else {
        album = await Album.findOne({ spotifyId: id })
            .populate("artists", "name image")
            .populate("songs");
    }

    const isComplete = album && album.songs && album.songs.length > 0 && 
                       (album.totalTracks ? album.songs.length >= album.totalTracks : false);

    if (isComplete) {
      return res.status(200).json(album);
    }

   
    
    if (!spotifyIdToFetch) {
        return res.status(404).json({ message: "Álbum não encontrado e sem ID Spotify para busca." });
    }

    const spAlbum = await spotifyGet(`/albums/${spotifyIdToFetch}`);

    if (!spAlbum) {
      return res.status(404).json({ message: "Álbum não encontrado no Spotify." });
    }

    const albumArtistPromises = spAlbum.artists.map(spArtist => upsertArtist(spArtist));
    const savedAlbumArtists = await Promise.all(albumArtistPromises);
    const albumArtistIds = savedAlbumArtists.map(a => a._id);

    const albumData = mapAlbum(spAlbum, albumArtistIds);
    let savedAlbum = await Album.findOneAndUpdate(
      { spotifyId: albumData.spotifyId },
      { $set: albumData },
      { new: true, upsert: true }
    );

    const tracksItems = spAlbum.tracks.items || [];
    const trackPromises = tracksItems.map(async (spTrack) => {
        const trackArtistPromises = spTrack.artists.map(a => upsertArtist(a));
        const savedTrackArtists = await Promise.all(trackArtistPromises);
        const trackArtistIds = savedTrackArtists.map(a => a._id);

        const savedSong = await upsertTrack(spTrack, savedAlbum._id, trackArtistIds);
        return savedSong._id;
    });

    const savedSongIds = await Promise.all(trackPromises);

    savedAlbum.songs = savedSongIds;
    await savedAlbum.save();

    const finalAlbum = await Album.findById(savedAlbum._id)
      .populate("artists", "name image")
      .populate("songs");

    res.status(200).json(finalAlbum);

  } catch (err) {
    console.error("Erro no getAlbumById:", err);
    res.status(500).json({ message: "Erro ao processar álbum.", error: err.message });
  }
};