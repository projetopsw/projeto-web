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
  const data = mapTrack(spTrack, artistMongoIds, albumMongoId);
  
  const song = await Song.findOneAndUpdate(
    { spotifyId: data.spotifyId },
    { $set: data },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (albumMongoId) {
    await Album.findByIdAndUpdate(albumMongoId, {
      $addToSet: { songs: song._id } 
    });
  }

  return song;
}

export const getArtistById = async (req, res) => {
  const { id } = req.params;
  try {
    let artist = await Artist.findOne({ spotifyId: id, image: { $ne: '' }, popularity: { $gt: 15 }});
    if (artist) return res.json(artist);

    const spArtist = await spotifyGet(`/artists/${id}`);
    artist = await upsertArtistBySpotify(spArtist);
    res.json(artist);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao obter artista', error: err.message });
  }
};

export const getArtistAlbums = async (req, res) => {
  const { id } = req.params; 
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
    let album = await Album.findOne({ spotifyId: id })
      .populate('artists') 
      .populate('songs');
      
    if (album && album.songs.length > 0) return res.json(album);

    console.log(`Buscando álbum ${id} no Spotify...`);
    const spAlbum = await spotifyGet(`/albums/${id}`);
    const artistPromises = spAlbum.artists.map(async (spArtistSimple) => { 
      const fullSpArtist = await spotifyGet(`/artists/${spArtistSimple.id}`); 
      return upsertArtistBySpotify(fullSpArtist);
    });
    
    const artistsDocs = await Promise.all(artistPromises);
    const artistIds = artistsDocs.map(a => a._id);

    album = await upsertAlbumBySpotify(spAlbum, artistIds); 
    const trackPromises = spAlbum.tracks.items.map(async (spTrack) => {
      const trackArtistPromises = spTrack.artists.map(async (tArtist) => {
         const existing = artistsDocs.find(a => a.spotifyId === tArtist.id);
         if (existing) return existing;
         
         const featSpArtist = await spotifyGet(`/artists/${tArtist.id}`);
         return upsertArtistBySpotify(featSpArtist);
      });
      
      const trackArtistsDocs = await Promise.all(trackArtistPromises);
      const trackArtistIds = trackArtistsDocs.map(a => a._id);

      return upsertTrackBySpotify(spTrack, trackArtistIds, album._id);
    });

    await Promise.all(trackPromises);

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
  const { id } = req.params; 
  try {
    let track = await Song.findOne({ spotifyId: id, cover: { $ne: '' }, popularity: { $gt: 20 } }).populate('artist').populate('album');
    if (track) return res.json(track);

    const spTrack = await spotifyGet(`/tracks/${id}`);

    const mainArtistSpotify = spTrack.artists?.[0];
    let artist = null;
    if (mainArtistSpotify) {
      const spArtist = await spotifyGet(`/artists/${mainArtistSpotify.id}`);
      artist = await upsertArtistBySpotify(spArtist);
    }

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
    const data = await spotifyGet('/search', { q, type, limit });

    const results = { artists: [], albums: [], tracks: [] };

    if (data.artists?.items) {
      results.artists = await Promise.all(
        data.artists.items.map(async (item) => {
          try {
            return await upsertArtistBySpotify(item);
          } catch (e) { return null; }
        })
      );
    }

    if (data.albums?.items) {
      results.albums = await Promise.all(
        data.albums.items.map(async (item) => {
          try {
            const artistPromises = (item.artists || []).map(a => upsertArtistBySpotify(a));
            const artistsDocs = await Promise.all(artistPromises);
            const artistIds = artistsDocs.map(doc => doc._id);

            const savedAlbum = await upsertAlbumBySpotify(item, artistIds);
            
            return await savedAlbum.populate('artists', 'name');
          } catch (e) { return null; }
        })
      );
    }

    if (data.tracks?.items) {
      results.tracks = await Promise.all(
        data.tracks.items.map(async (item) => {
          try {
            const artistPromises = (item.artists || []).map(a => upsertArtistBySpotify(a));
            const artistsDocs = await Promise.all(artistPromises);
            const artistIds = artistsDocs.map(doc => doc._id);

            let albumId = null;
            if (item.album) {
              const albumArtistPromises = (item.album.artists || []).map(a => upsertArtistBySpotify(a));
              const albumArtistsDocs = await Promise.all(albumArtistPromises);
              const albumArtistIds = albumArtistsDocs.map(doc => doc._id);
              const albumDoc = await upsertAlbumBySpotify(item.album, albumArtistIds);
              albumId = albumDoc._id;
            }

            const savedTrack = await upsertTrackBySpotify(item, artistIds, albumId);

            return await savedTrack
                .populate('artists', 'name')
                .populate('album', 'title cover');

          } catch (e) { return null; }
        })
      );
    }

    results.artists = results.artists.filter(item => {
        if (!item) return false;
        if (!item.image || item.image === '') return false;
        if (item.popularity < 10) return false;
        
        return true;
    });

    results.albums = results.albums.filter(item => {
        if (!item) return false;
        if (!item.cover || item.cover === '') return false;
        return true;
    });

    results.tracks = results.tracks.filter(item => {
        if (!item) return false;
        if (!item.cover || item.cover === '') return false;
        if (item.popularity < 10) return false;
        return true;
    });

    res.json(results);

  } catch (err) {
    console.error('Erro crítico na busca:', err);
    res.status(500).json({ message: 'Erro na busca Spotify', error: err.message });
  }
};
