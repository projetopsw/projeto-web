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

    const visibleAlbums = albumsData.filter(album => {
        const hasCover = album.cover || album.image; 
        return hasCover && hasCover !== '';
    });

    useEffect(() => {
        let isMounted = true;
        async function loadAll() {
            try {
                setLoading(true);
                setError(null);

                const results = await Promise.allSettled([
                    mongoApi.get('/songs'),
                    mongoApi.get('/artists'),
                    mongoApi.get('/playlists')
                ]);

                if (!isMounted) return;

                const [songsResult, artistsResult, playlistsResult] = results;

                if (songsResult.status === 'fulfilled') {
                    const rawSongs = songsResult.value.data;
                    
                    const validSongs = rawSongs.filter(s => {
                         const capa = s.cover || s.album?.cover;
                         if (!capa || capa === '') return false;
                         
                         if (s.popularity !== undefined && s.popularity < 5) return false;
                         
                         return true;
                    });

                    const normSongs = validSongs.map(s => {
                        let artistName = 'Desconhecido';
                        if (Array.isArray(s.artists) && s.artists.length > 0) {
                            artistName = s.artists.map(a => a.name).join(', ');
                        } else if (s.artist) {
                            artistName = typeof s.artist === 'string' ? s.artist : s.artist.name;
                        }

                        return {
                            id: s._id,
                            cover: s.cover || s.album?.cover, 
                            title: s.title,
                            artist: artistName, 
                        };
                    });
                    setSongsData(normSongs);
                }

                if (artistsResult.status === 'fulfilled') {
                    const rawArtists = artistsResult.value.data;

                    const validArtists = rawArtists.filter(a => {
                        const img = a.cover || a.image;
                        return img && img !== '';
                    });

                    const normArtists = validArtists.map(a => ({
                        id: a._id || a.spotifyId,
                        image: a.cover || a.image,
                        name: a.name,
                    }));
                    
                    setArtistsData(normArtists);
                }

                if (playlistsResult.status === 'fulfilled') {
                    const normPlaylists = playlistsResult.value.data.map(p => ({
                        id: p._id,
                        cover: p.img || '/assets/img/vacateste.jpg',
                        title: p.name,
                    }));
                    setPlaylistsData(normPlaylists);
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

    useEffect(() => {
        if (albumsStatus === 'idle') {
            dispatch(fetchAlbums());
        }
    }, [albumsStatus, dispatch]);

    if (loading) return <main><h1 className='pagina-inicial'>Carregando catálogo...</h1></main>;
    if (error) return <main><h1 className='pagina-inicial'>{error}</h1></main>;

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

                    {section.type === 'album' && visibleAlbums.map((album) => {
                        let artistName = 'Desconhecido';
                        if (album.artists && Array.isArray(album.artists) && album.artists.length > 0) {
                            artistName = album.artists.map(a => a.name).join(', ');
                        } else if (album.artist) {
                            artistName = typeof album.artist === 'string' 
                                ? album.artist 
                                : album.artist.name || 'Desconhecido';
                        }

                        return (
                            <AlbumCard
                                key={album._id || album.id}
                                id={album._id || album.id}
                                cover={album.cover || album.image} 
                                title={album.title}
                                artist={artistName} 
                            />
                        );
                    })}     
                </Section>
            ))}
        </main>
    );
}

export default Home;