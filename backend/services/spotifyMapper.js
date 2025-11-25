export function mapArtist(spArtist) {
  return {
    spotifyId: spArtist.id,
    name: spArtist.name,
    image: spArtist.images?.[0]?.url || '',
    genre: spArtist.genres?.[0] || '',
    about: '',
  };
}

export function mapAlbum(spAlbum, artistIdMongo) {
  return {
    spotifyId: spAlbum.id,
    title: spAlbum.name,
    cover: spAlbum.images?.[0]?.url || '',
    releaseDate: spAlbum.release_date ? new Date(spAlbum.release_date) : undefined,
    genre: spAlbum.genres?.[0] || '',
    artist: artistIdMongo,
  };
}

export function mapTrack(spTrack, artistIdMongo, albumIdMongo) {
  return {
    spotifyId: spTrack.id,
    title: spTrack.name,
    cover: spTrack.album?.images?.[0]?.url || '',
    artist: artistIdMongo,
    album: albumIdMongo || null,
    duration: spTrack.duration_ms,
    caminho: spTrack.preview_url || '',
    releaseDate: spTrack.album?.release_date ? new Date(spTrack.album.release_date) : undefined,
    recordLabel: '',
    lyrics: '',
  };
}
