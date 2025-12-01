import Album from "../models/album.model.js";
import Song from "../models/song.model.js";
import Artist from "../models/artist.model.js";
import { spotifyGet } from "../services/spotifyService.js"; // Sua função de fetch no Spotify
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
    let spotifyIdToFetch = id; // Por padrão, assumimos que o ID da URL é do Spotify

    // 1. VERIFICAR SE O ID É DO MONGODB
    if (mongoose.Types.ObjectId.isValid(id)) {
        // Tenta achar pelo _id do Mongo
        album = await Album.findById(id)
            .populate("artists", "name image")
            .populate("songs");
            
        if (album) {
            // Se achou no banco, pegamos o ID do Spotify dele para caso precisemos atualizar
            spotifyIdToFetch = album.spotifyId;
        }
    } else {
        // Se não é ID do Mongo, tenta achar pelo campo spotifyId
        album = await Album.findOne({ spotifyId: id })
            .populate("artists", "name image")
            .populate("songs");
    }

    // 2. VERIFICAR SE O ÁLBUM ESTÁ COMPLETO (Cache Hit)
    // Se o álbum existe E tem músicas, retornamos ele direto.
    // (Ajuste: se totalTracks não existir, assumimos que precisa atualizar)
    const isComplete = album && album.songs && album.songs.length > 0 && 
                       (album.totalTracks ? album.songs.length >= album.totalTracks : false);

    if (isComplete) {
      // console.log(`[CACHE] Álbum carregado do Mongo.`);
      return res.status(200).json(album);
    }

    // 3. SE NÃO ACHOU OU ESTÁ INCOMPLETO -> BUSCAR NO SPOTIFY
    // console.log(`[API] Buscando/Atualizando álbum no Spotify: ${spotifyIdToFetch}`);
    
    if (!spotifyIdToFetch) {
        return res.status(404).json({ message: "Álbum não encontrado e sem ID Spotify para busca." });
    }

    const spAlbum = await spotifyGet(`/albums/${spotifyIdToFetch}`);

    if (!spAlbum) {
      return res.status(404).json({ message: "Álbum não encontrado no Spotify." });
    }

    // --- DAQUI PARA BAIXO É IGUAL AO ANTERIOR ---
    
    // 4. Salvar Artistas
    const albumArtistPromises = spAlbum.artists.map(spArtist => upsertArtist(spArtist));
    const savedAlbumArtists = await Promise.all(albumArtistPromises);
    const albumArtistIds = savedAlbumArtists.map(a => a._id);

    // 5. Salvar Álbum (Metadados)
    const albumData = mapAlbum(spAlbum, albumArtistIds);
    let savedAlbum = await Album.findOneAndUpdate(
      { spotifyId: albumData.spotifyId },
      { $set: albumData },
      { new: true, upsert: true }
    );

    // 6. Salvar Músicas
    const tracksItems = spAlbum.tracks.items || [];
    const trackPromises = tracksItems.map(async (spTrack) => {
        const trackArtistPromises = spTrack.artists.map(a => upsertArtist(a));
        const savedTrackArtists = await Promise.all(trackArtistPromises);
        const trackArtistIds = savedTrackArtists.map(a => a._id);

        const savedSong = await upsertTrack(spTrack, savedAlbum._id, trackArtistIds);
        return savedSong._id;
    });

    const savedSongIds = await Promise.all(trackPromises);

    // 7. Atualizar Álbum com as músicas
    savedAlbum.songs = savedSongIds;
    await savedAlbum.save();

    // 8. Retorno final populado
    const finalAlbum = await Album.findById(savedAlbum._id)
      .populate("artists", "name image")
      .populate("songs");

    res.status(200).json(finalAlbum);

  } catch (err) {
    console.error("Erro no getAlbumById:", err);
    res.status(500).json({ message: "Erro ao processar álbum.", error: err.message });
  }
};