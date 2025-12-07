import Song from '../models/song.model.js';
import Artist from '../models/artist.model.js'; 
import Album from '../models/album.model.js';   
import User from '../models/user.model.js';  
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
        const regex = new RegExp(query, 'i');
        let response = this.getEmptyResult();

        const [localSongs, localArtists, localAlbums, localUsers] = await Promise.all([
            Song.find({ title: regex }).limit(5).populate('artists').populate('album'),
            Artist.find({ name: regex }).limit(5),
            Album.find({ title: regex }).limit(5).populate('artists'),
            User.find({ username: regex }).limit(5)
        ]);

        response.musicas.priority = localSongs;
        response.artistas.priority = localArtists;
        response.albuns.priority = localAlbums;
        response.usuarios.priority = localUsers;

        const totalLocalResults = localSongs.length + localArtists.length + localAlbums.length;

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
                        item.images && item.images.length > 0 && 
                        item.popularity > 5 
                    );

                    const savedArtists = await Promise.all(validArtists.slice(0, 6).map(async (item) => {
                        return await Artist.findOneAndUpdate(
                            { spotifyId: item.id },
                            {
                                name: item.name,
                                image: item.images?.[0]?.url || '',
                                spotifyId: item.id,
                                genres: item.genres,
                                popularity: item.popularity
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        );
                    }));
                    response.artistas.priority = savedArtists;

                    if (savedArtists.length > 0) {
                        try {
                            const mainArtist = savedArtists[0];
                            const relatedData = await getRelatedArtists(mainArtist.spotifyId);
                            if (relatedData && relatedData.length > 0) {
                                const validRelated = relatedData.filter(item => item.images && item.images.length > 0);
                                
                                const savedRelated = await Promise.all(validRelated.slice(0, 5).map(async (item) => {
                                    return await Artist.findOneAndUpdate(
                                        { spotifyId: item.id },
                                        {
                                            name: item.name,
                                            image: item.images?.[0]?.url || '',
                                            spotifyId: item.id,
                                            genres: item.genres
                                        },
                                        { upsert: true, new: true, setDefaultsOnInsert: true }
                                    );
                                }));
                                response.artistas.related = savedRelated;
                            }
                        } catch (e) { /* ignore */ }
                    }
                }

                if (spotifyData.albums) {
                    const validAlbums = spotifyData.albums.items.filter(item => 
                        item.images && item.images.length > 0 &&
                        !this.isGarbage(item.name)
                    );

                    const savedAlbums = await Promise.all(validAlbums.slice(0, 6).map(async (item) => {
                        const artistPromises = item.artists.map(a => Artist.findOneAndUpdate(
                            { spotifyId: a.id },
                            { name: a.name, spotifyId: a.id },
                            { upsert: true, new: true }
                        ));
                        const albumArtists = await Promise.all(artistPromises);
                        const artistIds = albumArtists.map(a => a._id);

                        const artistName = item.artists[0]?.name || "Vários Artistas";

                        return await Album.findOneAndUpdate(
                            { spotifyId: item.id },
                            {
                                title: item.name,
                                cover: item.images?.[0]?.url || '',
                                releaseDate: item.release_date,
                                spotifyId: item.id,
                                artists: artistIds,
                                artist: artistName,
                                type: item.album_type
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        ).populate('artists');
                    }));
                    response.albuns.priority = savedAlbums;
                }

                if (spotifyData.tracks) {
                    const validTracks = spotifyData.tracks.items.filter(item => {
                        if (!item.album || !item.album.images || item.album.images.length === 0) return false;
                        if (this.isGarbage(item.name)) return false;
                        if (item.artists[0] && this.isGarbage(item.artists[0].name)) return false;
                        return true;
                    });

                    const savedSongs = await Promise.all(validTracks.slice(0, 8).map(async (item) => {
                        
                        const artistPromises = item.artists.map(async (artistItem) => {
                            return await Artist.findOneAndUpdate(
                                { spotifyId: artistItem.id },
                                { name: artistItem.name, spotifyId: artistItem.id },
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            );
                        });
                        const resolvedArtists = await Promise.all(artistPromises);
                        const mongoArtistIds = resolvedArtists.map(a => a._id);

                        let mongoAlbumId = null;
                        if (item.album) {
                            const savedAlbum = await Album.findOneAndUpdate(
                                { spotifyId: item.album.id },
                                {
                                    title: item.album.name,
                                    cover: item.album.images?.[0]?.url || '',
                                    spotifyId: item.album.id,
                                    releaseDate: item.album.release_date
                                },
                                { upsert: true, new: true }
                            );
                            mongoAlbumId = savedAlbum._id;
                        }

                        return await Song.findOneAndUpdate(
                            { spotifyId: item.id },
                            {
                                title: item.name,
                                duration: item.duration_ms / 1000,
                                cover: item.album?.images?.[0]?.url || '',
                                spotifyId: item.id,
                                artists: mongoArtistIds, 
                                albumId: mongoAlbumId,
                                artist: item.artists.map(a => a.name).join(', '), 
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        )
                        .populate('artists')
                        .populate('album');
                    }));
                    
                    response.musicas.priority = savedSongs;
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
        }

        return response;
    }
}

export default SearchService;