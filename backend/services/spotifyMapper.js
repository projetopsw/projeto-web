
export const mapArtist = (spArtist) => {
    const image = spArtist.images && spArtist.images.length > 0 
        ? spArtist.images[0].url 
        : ''; 

    return {
        spotifyId: spArtist.id,
        name: spArtist.name,
        image: image,
        
        genres: spArtist.genres || [],
        popularity: spArtist.popularity || 0,
        
        followers: spArtist.followers ? spArtist.followers.total : 0,
        
        spotifyUrl: spArtist.external_urls ? spArtist.external_urls.spotify : ''
    };
};

export const mapAlbum = (spAlbum, artistIds) => {
    const cover = spAlbum.images && spAlbum.images.length > 0 
        ? spAlbum.images[0].url 
        : '';

    return {
        spotifyId: spAlbum.id,
        title: spAlbum.name,
        cover: cover,
        
        releaseDate: spAlbum.release_date,
        releaseDatePrecision: spAlbum.release_date_precision,
        
        totalTracks: spAlbum.total_tracks,
        
        recordLabel: spAlbum.label || '',
        popularity: spAlbum.popularity || 0,
        genres: spAlbum.genres || [],
        spotifyUrl: spAlbum.external_urls ? spAlbum.external_urls.spotify : '',
        artists: Array.isArray(artistIds) ? artistIds : [artistIds]
    };
};

export const mapTrack = (spTrack, artistIds, albumId) => {
    const duration = spTrack.duration_ms ? spTrack.duration_ms / 1000 : 0;

    const cover = spTrack.album && spTrack.album.images && spTrack.album.images.length > 0
        ? spTrack.album.images[0].url
        : '';

    const releaseDate = spTrack.album && spTrack.album.release_date
        ? spTrack.album.release_date
        : null;

    return {
        spotifyId: spTrack.id,
        isrc: spTrack.external_ids ? spTrack.external_ids.isrc : '',
        
        title: spTrack.name,
        cover: cover,
        
        artists: Array.isArray(artistIds) ? artistIds : [artistIds],
        album: albumId,
        
        duration: duration,
        previewUrl: spTrack.preview_url || '',
        
        trackNumber: spTrack.track_number || 1,
        discNumber: spTrack.disc_number || 1,
        explicit: spTrack.explicit || false,
        popularity: spTrack.popularity || 0,
        
        releaseDate: releaseDate,
        spotifyUrl: spTrack.external_urls ? spTrack.external_urls.spotify : '',
        
        caminho: '' 
    };
};