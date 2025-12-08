import DEFAULT_PLAYLIST_COVER from '/assets/img/vibe_cover_2.png'; 

export const mapSongSafe = (s) => {
    if (!s) return null;

    let artistName = 'Desconhecido';

    if (Array.isArray(s.artists) && s.artists.length > 0) {
        const validNames = s.artists
            .filter(a => a && (a.name || typeof a === 'string'))
            .map(a => typeof a === 'string' ? a : a.name);
        
        if (validNames.length > 0) artistName = validNames.join(', ');
    } 
    else if (s.artist && typeof s.artist === 'object' && s.artist.name) {
        artistName = s.artist.name;
    } 
    else if (typeof s.artist === 'string' && s.artist.length < 30) {
        artistName = s.artist; 
    }

    let albumName = 'Single'; 
    let albumId = null;

    if (s.album && typeof s.album === 'object') {
        albumName = s.album.title || s.album.name || 'Single';
        albumId = s.album._id || s.album.id;
    } 
    else if (typeof s.album === 'string') {
        if (s.album.length > 20 && !s.album.includes(' ')) {
            albumName = ''; 
        } else {
            albumName = s.album;
        }
    }

    let durationDisplay = "0:00";
    if (typeof s.duration === 'number') {
        const min = Math.floor(s.duration / 60);
        const sec = Math.floor(s.duration % 60);
        durationDisplay = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    return {
        ...s,
        id: s._id || s.id,
        title: s.title || s.name || 'Sem título',
        artist: artistName,
        album: albumName,
        albumId: albumId || s.albumId,
        artistId: (s.artists && s.artists[0]?._id) || (s.artist?._id) || s.artistId,
        cover: s.cover || (s.album && s.album.cover) || s.image || DEFAULT_PLAYLIST_COVER,
        duration: durationDisplay
    };
};

export const calculateTotalDuration = (songs) => `${songs ? songs.length : 0} músicas`;