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

    static async executeSearch(query, category) {
        const regex = new RegExp(query, 'i');
        let response = this.getEmptyResult();

        // 1. BUSCA LOCAL
        // Tenta buscar no banco de dados primeiro
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

        // 2. BUSCA SPOTIFY (Se tiver poucos resultados locais)
        const totalLocalResults = localSongs.length + localArtists.length + localAlbums.length;

        if (totalLocalResults < 3 && category !== 'usuario' && category !== 'playlist') {
            console.log(`Buscando "${query}" no Spotify...`);
            
            let spotifyTypes = 'track,artist,album';
            if (category === 'musica') spotifyTypes = 'track';
            if (category === 'artista') spotifyTypes = 'artist';
            if (category === 'album') spotifyTypes = 'album';

            const spotifyData = await searchSpotify(query, spotifyTypes, 15);

            if (spotifyData) {
                
                // --- Processar Artistas ---
                if (spotifyData.artists) {
                    const savedArtists = await Promise.all(spotifyData.artists.items.map(async (item) => {
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

                    // Relacionados
                    if (savedArtists.length > 0) {
                        try {
                            const mainArtist = savedArtists[0];
                            const relatedData = await getRelatedArtists(mainArtist.spotifyId);
                            if (relatedData && relatedData.length > 0) {
                                const savedRelated = await Promise.all(relatedData.slice(0, 5).map(async (item) => {
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
                        } catch (error) {
                            console.log("Erro ao buscar relacionados (ignorado):", error.message);
                        }
                    }
                }

                // --- Processar Álbuns ---
                if (spotifyData.albums) {
                    const savedAlbums = await Promise.all(spotifyData.albums.items.map(async (item) => {
                        // 1. Salva/Atualiza artistas do álbum primeiro para garantir que temos os IDs
                        const artistPromises = item.artists.map(a => Artist.findOneAndUpdate(
                            { spotifyId: a.id },
                            { name: a.name, spotifyId: a.id },
                            { upsert: true, new: true }
                        ));
                        const albumArtists = await Promise.all(artistPromises);
                        const artistIds = albumArtists.map(a => a._id);

                        const artistName = item.artists[0]?.name || "Vários Artistas";

                        // 2. Salva o álbum com os IDs
                        return await Album.findOneAndUpdate(
                            { spotifyId: item.id },
                            {
                                title: item.name,
                                cover: item.images?.[0]?.url || '',
                                releaseDate: item.release_date,
                                spotifyId: item.id,
                                artists: artistIds, // Salva os IDs (Link para a tabela Artistas)
                                artist: artistName, // Salva o nome como texto (Backup)
                                type: item.album_type
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        )
                        .populate('artists'); // <--- AQUI ESTÁ A MÁGICA QUE FALTAVA!
                    }));
                    response.albuns.priority = savedAlbums;
                }

                // --- Processar Músicas (CORRIGIDO) ---
                if (spotifyData.tracks) {
                    const savedSongs = await Promise.all(spotifyData.tracks.items.map(async (item) => {
                        
                        // 1. Resolver Artistas (Salvar no banco -> Pegar ID)
                        const artistPromises = item.artists.map(async (artistItem) => {
                            return await Artist.findOneAndUpdate(
                                { spotifyId: artistItem.id },
                                {
                                    name: artistItem.name,
                                    spotifyId: artistItem.id
                                },
                                { upsert: true, new: true, setDefaultsOnInsert: true }
                            );
                        });
                        const resolvedArtists = await Promise.all(artistPromises);
                        const mongoArtistIds = resolvedArtists.map(a => a._id);

                        // 2. Resolver Álbum (Salvar no banco -> Pegar ID)
                        let mongoAlbumId = null;
                        if (item.album) {
                            // Salva o álbum simples
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

                        // 3. Salvar Música com os IDs corretos
                        return await Song.findOneAndUpdate(
                            { spotifyId: item.id },
                            {
                                title: item.name,
                                duration: item.duration_ms / 1000,
                                cover: item.album?.images?.[0]?.url || '', // Fallback de imagem
                                spotifyId: item.id,
                                
                                // AQUI O SEGREDO: Usamos os IDs gerados acima
                                artists: mongoArtistIds, 
                                albumId: mongoAlbumId,
                                
                                // Campos de texto simples para backup
                                artist: item.artists.map(a => a.name).join(', '), 
                            },
                            { upsert: true, new: true, setDefaultsOnInsert: true }
                        )
                        // Populamos para garantir que o front receba o objeto completo na resposta imediata
                        .populate('artists')
                        .populate('album');
                    }));
                    
                    response.musicas.priority = savedSongs;
                }
            }
        }

        // Filtragem final para retornar apenas a categoria pedida se necessário
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