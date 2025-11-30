import Artist from '../models/artist.model.js';
import Album from '../models/album.model.js';
import Song from '../models/song.model.js';
import { spotifyGet } from '../services/spotifyService.js';
import { mapArtist, mapAlbum, mapTrack } from '../services/spotifyMapper.js';

async function upsertArtistBySpotify(spArtist) {
  const data = mapArtist(spArtist);
  
  const updateData = { ...data };
  
  if (!data.image) {
      delete updateData.image;
  }

  const artist = await Artist.findOneAndUpdate(
    { spotifyId: data.spotifyId },
    { $set: updateData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return artist;
}

async function upsertAlbumBySpotify(spAlbum, artistMongoId) {
  const data = mapAlbum(spAlbum, artistMongoId);
  const album = await Album.findOneAndUpdate(
    { spotifyId: data.spotifyId },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return album;
}

async function upsertTrackBySpotify(spTrack, artistMongoIds, albumMongoId) {
  // Nota: artistMongoIds agora deve ser um Array
  const data = mapTrack(spTrack, artistMongoIds, albumMongoId);
  
  const song = await Song.findOneAndUpdate(
    { spotifyId: data.spotifyId },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // CRÍTICO: Adicionar essa música ao array de músicas do álbum
  if (albumMongoId) {
    await Album.findByIdAndUpdate(albumMongoId, {
      $addToSet: { songs: song._id } // $addToSet evita duplicatas
    });
  }

  return song;
}

export const getArtistById = async (req, res) => {
  const { id } = req.params; // Spotify ID
  try {
    let artist = await Artist.findOne({ spotifyId: id });
    if (artist) return res.json(artist);

    const spArtist = await spotifyGet(`/artists/${id}`);
    artist = await upsertArtistBySpotify(spArtist);
    res.json(artist);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter artista', error: err.message });
  }
};

export const getArtistAlbums = async (req, res) => {
  const { id } = req.params; // Spotify Artist ID
  try {
    let artist = await Artist.findOne({ spotifyId: id });
    if (!artist) {
      const spArtist = await spotifyGet(`/artists/${id}`);
      artist = await upsertArtistBySpotify(spArtist);
    }

    const spAlbums = await spotifyGet(`/artists/${id}/albums`, { include_groups: 'album,single,appears_on,compilation', limit: 20 });

    const albums = [];
    for (const spAlbum of spAlbums.items) {
      const album = await upsertAlbumBySpotify(spAlbum, artist._id);
      albums.push(album);
    }
    res.json(albums);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter álbuns do artista', error: err.message });
  }
};

export const getAlbumById = async (req, res) => {
  const { id } = req.params; 
  try {
    // 1. Tenta buscar local populado
    let album = await Album.findOne({ spotifyId: id })
      .populate('artists') // Mudado para plural (ajuste seu schema se necessário)
      .populate('songs');
      
    // Se achou e tem músicas, retorna (Cache Hit completo)
    if (album && album.songs.length > 0) return res.json(album);

    // 2. Busca no Spotify
    console.log(`Buscando álbum ${id} no Spotify...`);
    const spAlbum = await spotifyGet(`/albums/${id}`);

    // 3. Resolver Artistas do Álbum (Pode ser mais de um)
    // Usamos Promise.all para buscar/salvar todos os artistas do álbum em paralelo
    const artistPromises = spAlbum.artists.map(async (spArtistSimple) => {
      // O objeto artist dentro do album é simplificado, as vezes precisamos buscar o full
      // Mas para economizar API, podemos salvar o simplificado ou buscar o full se precisar de imagem
      const fullSpArtist = await spotifyGet(`/artists/${spArtistSimple.id}`); 
      return upsertArtistBySpotify(fullSpArtist);
    });
    
    const artistsDocs = await Promise.all(artistPromises);
    const artistIds = artistsDocs.map(a => a._id);

    // 4. Salvar Álbum
    album = await upsertAlbumBySpotify(spAlbum, artistIds); // Passando array de IDs

    // 5. Salvar Músicas (PARALELO) - A maior otimização
    // Mapeamos o array de tracks para um array de Promises
    const trackPromises = spAlbum.tracks.items.map(async (spTrack) => {
      // Tracks do álbum herdam os artistas da música + artistas do álbum? 
      // Geralmente a track tem seu próprio array 'artists'.
      
      // Resolve artistas da música (Track Artists)
      const trackArtistPromises = spTrack.artists.map(async (tArtist) => {
         // Otimização: Se o artista for o mesmo do álbum, não busque de novo
         const existing = artistsDocs.find(a => a.spotifyId === tArtist.id);
         if (existing) return existing;
         
         // Se é um feat novo, busca e salva
         const featSpArtist = await spotifyGet(`/artists/${tArtist.id}`);
         return upsertArtistBySpotify(featSpArtist);
      });
      
      const trackArtistsDocs = await Promise.all(trackArtistPromises);
      const trackArtistIds = trackArtistsDocs.map(a => a._id);

      return upsertTrackBySpotify(spTrack, trackArtistIds, album._id);
    });

    await Promise.all(trackPromises);

    // 6. Retorna o dado populado final
    const fullAlbum = await Album.findById(album._id)
      .populate('artists')
      .populate('songs');
      
    res.json(fullAlbum);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao processar álbum', error: err.message });
  }
};

export const getTrackById = async (req, res) => {
  const { id } = req.params; // Spotify Track ID
  try {
    let track = await Song.findOne({ spotifyId: id }).populate('artist').populate('album');
    if (track) return res.json(track);

    const spTrack = await spotifyGet(`/tracks/${id}`);

    // Garante artista principal
    const mainArtistSpotify = spTrack.artists?.[0];
    let artist = null;
    if (mainArtistSpotify) {
      const spArtist = await spotifyGet(`/artists/${mainArtistSpotify.id}`);
      artist = await upsertArtistBySpotify(spArtist);
    }

    // Garante álbum
    let album = null;
    if (spTrack.album?.id) {
      const spAlbum = await spotifyGet(`/albums/${spTrack.album.id}`);
      const albumArtistSpotify = spAlbum.artists?.[0];
      let albumArtist = artist;
      if (albumArtistSpotify && (!artist || albumArtistSpotify.id !== artist.spotifyId)) {
        const spArtist = await spotifyGet(`/artists/${albumArtistSpotify.id}`);
        albumArtist = await upsertArtistBySpotify(spArtist);
      }
      album = await upsertAlbumBySpotify(spAlbum, albumArtist?._id);
    }

    track = await upsertTrackBySpotify(spTrack, artist?._id, album?._id || null);
    const fullTrack = await Song.findById(track._id).populate('artist').populate('album');
    res.json(fullTrack);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter música', error: err.message });
  }
};

export const search = async (req, res) => {
  const { q, type = 'artist,album,track', limit = 10 } = req.query;
  
  if (!q) return res.status(400).json({ message: 'Parâmetro q é obrigatório' });

  try {
    // 1. Busca no Spotify
    const data = await spotifyGet('/search', { q, type, limit });

    const results = { artists: [], albums: [], tracks: [] };

    // --- PROCESSAMENTO DE ARTISTAS ---
    if (data.artists?.items) {
      results.artists = await Promise.all(
        data.artists.items.map(async (item) => {
          try {
            // Artistas não precisam de populate, pois o nome já está no objeto
            return await upsertArtistBySpotify(item);
          } catch (e) { return null; }
        })
      );
    }

    // --- PROCESSAMENTO DE ÁLBUMS ---
    if (data.albums?.items) {
      results.albums = await Promise.all(
        data.albums.items.map(async (item) => {
          try {
            const artistPromises = (item.artists || []).map(a => upsertArtistBySpotify(a));
            const artistsDocs = await Promise.all(artistPromises);
            const artistIds = artistsDocs.map(doc => doc._id);

            const savedAlbum = await upsertAlbumBySpotify(item, artistIds);
            
            // CORREÇÃO AQUI: Popular os artistas antes de retornar
            return await savedAlbum.populate('artists', 'name');
          } catch (e) { return null; }
        })
      );
    }

    // --- PROCESSAMENTO DE MÚSICAS ---
    if (data.tracks?.items) {
      results.tracks = await Promise.all(
        data.tracks.items.map(async (item) => {
          try {
            // 1. Artistas
            const artistPromises = (item.artists || []).map(a => upsertArtistBySpotify(a));
            const artistsDocs = await Promise.all(artistPromises);
            const artistIds = artistsDocs.map(doc => doc._id);

            // 2. Álbum
            let albumId = null;
            if (item.album) {
              const albumArtistPromises = (item.album.artists || []).map(a => upsertArtistBySpotify(a));
              const albumArtistsDocs = await Promise.all(albumArtistPromises);
              const albumArtistIds = albumArtistsDocs.map(doc => doc._id);
              const albumDoc = await upsertAlbumBySpotify(item.album, albumArtistIds);
              albumId = albumDoc._id;
            }

            // 3. Salva Música
            const savedTrack = await upsertTrackBySpotify(item, artistIds, albumId);

            // CORREÇÃO AQUI: Popular artistas e álbum antes de retornar
            // Isso troca os IDs pelos objetos reais com 'name' e 'title'
            return await savedTrack
                .populate('artists', 'name')
                .populate('album', 'title cover');

          } catch (e) { return null; }
        })
      );
    }

    // Limpeza de nulos
    results.artists = results.artists.filter(i => i !== null);
    results.albums = results.albums.filter(i => i !== null);
    results.tracks = results.tracks.filter(i => i !== null);

    res.json(results);

  } catch (err) {
    console.error('Erro crítico na busca:', err);
    res.status(500).json({ message: 'Erro na busca Spotify', error: err.message });
  }
};
