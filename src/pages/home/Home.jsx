import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAlbums,
} from '../../redux/catalogoSlice';
import Section from '../../components/Section';
import SongCard from '../../components/SongCard';
import AlbumCard from '../../components/AlbumCard';
import PlaylistCard from '../../components/PlaylistCard';
import ArtistCircle from '../../components/ArtistCircle';
import Navigation from '../../components/Navigation';
import './Home.css';
import mongoApi from '../../services/mongoApi.js';

const sectionsData = [
    { "title": "Top Hits do Rebanho", "type": "song", "path":"/songDetail" },
    { "title": "Artistas mais ouvidos", "type": "artist", "path":"/artistDetail" },
    { "title": "Playlists em Destaque", "type": "playlist", "path":"/playlistDetail" },
    { "title": "Acús-ticos do Campo", "type": "song", "path":"/songDetail" },
    { "title": "Pista de Dança Malhada", "type": "album", "path":"/albumDetail" },
    { "title": "Sofrência Bovina", "type": "playlist", "path":"/playlistDetail" },
    { "title": "Pop Leite", "type": "playlist", "path":"/playlistDetail" },
    { "title": "Rock Berrante", "type": "album", "path":"/albumDetail" },
]

const navItemsData = ["Tudo", "Playlists", "Músicas", "Álbuns", "Artistas"];


function Home() {
    const [selectedFilter, setSelectedFilter] = useState('Tudo');
    const dispatch = useDispatch();

    // Estados locais para dados do Mongo
    const [songsData, setSongsData] = useState([]);
    const [artistsData, setArtistsData] = useState([]);
    const [playlistsData, setPlaylistsData] = useState([]);
    const albumsData = useSelector(state => state.catalog.albums.items);
    const albumsStatus = useSelector(state => state.catalog.albums.status);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const filterMap = {
        'Tudo': null,
        'Músicas': 'song',
        'Artistas': 'artist',
        'Playlists': 'playlist',
        'Álbuns': 'album',
    };

    const filteredSections = sectionsData.filter(section => {
        if (selectedFilter === 'Tudo') return true;
        return section.type === filterMap[selectedFilter];
    });

    // Busca dados do MongoDB
    useEffect(() => {
        let isMounted = true;
        async function loadAll() {
            try {
                setLoading(true);
                setError(null);

                // Usamos allSettled para que se um falhar, os outros ainda carreguem
                const results = await Promise.allSettled([
                    mongoApi.get('/songs'),
                    mongoApi.get('/artists'),
                    mongoApi.get('/playlists')
                ]);

                if (!isMounted) return;

                const [songsResult, artistsResult, playlistsResult] = results;

                // Tratamento de Músicas
                if (songsResult.status === 'fulfilled') {
                    const normSongs = songsResult.value.data.map(s => {
                        // Lógica para pegar o nome do artista
                        let artistName = 'Desconhecido';

                        // Caso 1: O backend mandou populated (Array de objetos)
                        if (Array.isArray(s.artists) && s.artists.length > 0) {
                            // Pega o nome do primeiro artista ou junta todos com vírgula
                            artistName = s.artists.map(a => a.name).join(', ');
                        } 
                        // Caso 2: O backend mandou antigo (Objeto único ou String) - fallback
                        else if (s.artist) {
                            artistName = typeof s.artist === 'string' ? s.artist : s.artist.name;
                        }

                        return {
                            id: s._id,
                            cover: s.cover || s.album?.cover || '/assets/img/vacateste.jpg',
                            title: s.title,
                            artist: artistName, 
                        };
                    });
                    setSongsData(normSongs);
                }

                // Tratamento de Artistas
                if (artistsResult.status === 'fulfilled') {
                    const normArtists = artistsResult.value.data.map(a => ({
                        id: a._id || a.spotifyId,
                        image: a.cover || a.image || '/assets/img/vacateste.jpg',
                        name: a.name,
                    }));
                    setArtistsData(normArtists);
                } else {
                    console.error("Erro ao carregar artistas:", artistsResult.reason);
                }

                // Tratamento de Playlists
                if (playlistsResult.status === 'fulfilled') {
                    const normPlaylists = playlistsResult.value.data.map(p => ({
                        id: p._id,
                        cover: p.img || '/assets/img/vacateste.jpg',
                        title: p.name,
                    }));
                    setPlaylistsData(normPlaylists);
                } else {
                    // AQUI está o seu erro 404 atual. Com esse código, ele vai apenas logar no console
                    // e não vai travar a tela inteira.
                    console.warn("Erro ao carregar playlists (provável 404):", playlistsResult.reason);
                }

            } catch (e) {
                console.error("Erro crítico:", e);
                if (isMounted) setError('Falha ao carregar dados do MongoDB.');
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        loadAll();
        return () => { isMounted = false; };
    }, []);

    // Busca álbuns via Redux (já usando Mongo)
    useEffect(() => {
        if (albumsStatus === 'idle') {
            dispatch(fetchAlbums());
        }
    }, [albumsStatus, dispatch]);

    if (loading) {
        return <main><h1 className='pagina-inicial'>Carregando catálogo...</h1></main>;
    }
    if (error) {
        return <main><h1 className='pagina-inicial'>{error}</h1></main>;
    }

    return (
        <main>
            <h1 className='pagina-inicial'>Página Inicial</h1>

            <Navigation
                navItemsData={navItemsData}
                selectedItem={selectedFilter}
                setSelectedItem={setSelectedFilter}
            />

            {filteredSections.map((section) => (
                <Section key={section.title} title={section.title} className="card-container">
                    {section.type === 'song' && songsData.map((song) => (
                        <SongCard
                            key={song.id}
                            id={song.id}
                            cover={song.cover}
                            title={song.title}
                            artist={song.artist}
                        />
                    ))}

                    {section.type === 'artist' && artistsData.map((artist) => (
                        <ArtistCircle
                            key={artist.id}
                            id={artist.id}
                            image={artist.image}
                            name={artist.name}
                        />
                    ))}

                    {section.type === 'playlist' && playlistsData.map((playlist) => (
                        <PlaylistCard
                            key={playlist.id}
                            id={playlist.id}
                            cover={playlist.cover}
                            title={playlist.title}
                        />
                    ))}

                    {section.type === 'album' && albumsData.map((album) => (
                        <AlbumCard
                            key={album._id || album.id}
                            id={album._id || album.id}
                            cover={album.cover || album.image || '/assets/img/vacateste.jpg'}
                            title={album.title}
                            artist={typeof album.artist === 'string' ? album.artist : (album.artist?.name || 'Desconhecido')}
                        />
                    ))}
                </Section>
            ))}
        </main>
    );
}

export default Home;