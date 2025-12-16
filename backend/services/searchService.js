import SongModel from '../models/song.model.js';
import ArtistModel from '../models/artist.model.js'; 
import AlbumModel from '../models/album.model.js';   
import UserModel from '../models/user.model.js';  
import PlaylistModel from '../models/playlist.model.js'; 
import { searchSpotify, getRelatedArtists } from './spotifyService.js'; 

class SearchService {
    
    static getEmptyResult() {
        return {
            musicas: { priority: [], related: [] },
            artistas: { priority: [], related: [] },
            albuns: { priority: [], related: [] },
            playlists: { priority: [], related: [] },
            usuarios: { priority: [], related: [] }
        };
    }

    static isGarbage(text) {
        if (!text) return false;
        const lower = text.toLowerCase();
        return lower.includes('karaoke') || 
            lower.includes('tribute') || 
            lower.includes('made famous by') ||
            lower.includes('instrumental version') ||
            lower.includes('cover band');
    }

    static async executeSearch(query, category) {
        const searchRegexStart = new RegExp(`^${query}`, 'i'); 
        const searchRegexContains = new RegExp(query, 'i');
        
        let response = this.getEmptyResult();

        const [songs, artists, albums, users, playlists] = await Promise.all([
            SongModel.searchByTerm(searchRegexStart, searchRegexContains),
            ArtistModel.searchByTerm(searchRegexStart, searchRegexContains),
            AlbumModel.searchByTerm(searchRegexStart, searchRegexContains),
            UserModel.searchByTerm(searchRegexStart, searchRegexContains),
            PlaylistModel.searchByTerm(searchRegexStart, searchRegexContains) 
        ]);

        response.musicas = songs;
        response.artistas = artists;
        response.albuns = albums;
        response.usuarios = users;
        response.playlists = playlists;

        const totalLocalResults = songs.priority.length + artists.priority.length + albums.priority.length;

        if (totalLocalResults < 5 && category !== 'usuario' && category !== 'playlist') { 
            console.log(`Buscando "${query}" no Spotify...`);
            
            let spotifyTypes = 'track,artist,album';
            if (category === 'musica') spotifyTypes = 'track';
            if (category === 'artista') spotifyTypes = 'artist';
            if (category === 'album') spotifyTypes = 'album';

            const spotifyData = await searchSpotify(query, spotifyTypes, 20); 

            if (spotifyData) {
               
                if (spotifyData.artists) {
                    const validArtists = spotifyData.artists.items.filter(item => 
                        item.images && item.images.length > 0 && item.popularity > 5 
                    );
                    
                    const savedArtists = await Promise.all(validArtists.map(async (item) => {
                        return await ArtistModel.findOneAndUpdate(
                            { spotifyId: item.id },
                            { name: item.name, image: item.images?.[0]?.url || '', spotifyId: item.id, genres: item.genres, popularity: item.popularity },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                    }));
                    
                    const existingIds = new Set(response.artistas.priority.map(a => a._id.toString()));
                    const newRelatedArtists = savedArtists.filter(a => !existingIds.has(a._id.toString()));
                    response.artistas.related.push(...newRelatedArtists.slice(0, 6));

                    if (newRelatedArtists.length > 0) {
                        try {
                            const mainArtist = newRelatedArtists[0];
                            const relatedData = await getRelatedArtists(mainArtist.spotifyId);
                            if (relatedData && relatedData.length > 0) {
                                const validRelated = relatedData.filter(item => item.images && item.images.length > 0);
                                
                                const savedRelated = await Promise.all(validRelated.map(async (item) => {
                                    return await ArtistModel.findOneAndUpdate(
                                        { spotifyId: item.id },
                                        { name: item.name, image: item.images?.[0]?.url || '', spotifyId: item.id, genres: item.genres },
                                        { upsert: true, new: true, setDefaultsOnInsert: true }
                                    );
                                }));
                                response.artistas.related.push(...savedRelated.slice(0, 5));
                            }
                        } catch (e) { }
                    }
                }

                if (spotifyData.albums) {
                    const validAlbums = spotifyData.albums.items.filter(item => 
                        item.images && item.images.length > 0 && !this.isGarbage(item.name)
                    );
                    
                    const savedAlbums = await Promise.all(validAlbums.map(async (item) => {
                        const artistPromises = item.artists.map(a => ArtistModel.findOneAndUpdate(
                            { spotifyId: a.id }, { name: a.name, spotifyId: a.id }, { upsert: true, new: true }
                        ));
                        const albumArtists = await Promise.all(artistPromises);
                        const artistIds = albumArtists.map(a => a._id);
                        
                        const savedAlbum = await AlbumModel.findOneAndUpdate(
                            { spotifyId: item.id },
                            { title: item.name, cover: item.images?.[0]?.url || '', releaseDate: item.release_date, spotifyId: item.id, artists: artistIds, type: item.album_type },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        ).populate('artists');
                        return savedAlbum;
                    }));
                    
                    const existingIds = new Set(response.albuns.priority.map(a => a._id.toString()));
                    const newRelatedAlbums = savedAlbums.filter(a => !existingIds.has(a._id.toString()));
                    response.albuns.related.push(...newRelatedAlbums.slice(0, 6));
                }

                if (spotifyData.tracks) {
                    const validTracks = spotifyData.tracks.items.filter(item => {
                        if (!item.album || !item.album.images || item.album.images.length === 0) return false;
                        if (this.isGarbage(item.name)) return false;
                        if (item.artists[0] && this.isGarbage(item.artists[0].name)) return false;
                        return true;
                    });
                    
                    const savedSongs = await Promise.all(validTracks.map(async (item) => {
                        
                        const artistPromises = item.artists.map(async (artistItem) => {
                            return await ArtistModel.findOneAndUpdate(
                                { spotifyId: artistItem.id },
                                { name: artistItem.name, spotifyId: artistItem.id },
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            );
                        });
                        const resolvedArtists = await Promise.all(artistPromises);
                        const mongoArtistIds = resolvedArtists.map(a => a._id);

                        let mongoAlbumId = null;
                        if (item.album) {
                            const savedAlbum = await AlbumModel.findOneAndUpdate(
                                { spotifyId: item.album.id },
                                { title: item.album.name, cover: item.album.images?.[0]?.url || '', spotifyId: item.album.id, releaseDate: item.album.release_date },
                                { upsert: true, new: true }
                            );
                            mongoAlbumId = savedAlbum._id;
                        }

                        return await SongModel.findOneAndUpdate(
                            { spotifyId: item.id },
                            { title: item.name, duration: item.duration_ms / 1000, cover: item.album?.images?.[0]?.url || '', spotifyId: item.id, artists: mongoArtistIds, album: mongoAlbumId, artist: item.artists.map(a => a.name).join(', ') },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        )
                        .populate('artists')
                        .populate('album');
                    }));
                    
                    const existingIds = new Set(response.musicas.priority.map(s => s._id.toString()));
                    const newRelatedSongs = savedSongs.filter(s => !existingIds.has(s._id.toString()));
                    response.musicas.related.push(...newRelatedSongs.slice(0, 8));
                }
            }
        }

        if (category !== 'tudo') {
            const mapCategory = {
                'musica': 'musicas',
                'artista': 'artistas',
                'album': 'albuns',
                'usuario': 'usuarios',
                'playlist': 'playlists'
            };
            const key = mapCategory[category];
            if (key) return { [key]: response[key] };
            return this.getEmptyResult();
        }

        return response;
    }
}

export default SearchService;