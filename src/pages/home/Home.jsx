import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTopTracks, fetchArtists, fetchAlbums, fetchPlaylists } from '../../redux/catalogoSlice';
import Section from '../../components/Section';
import SongCard from '../../components/SongCard';
import AlbumCard from '../../components/AlbumCard';
import PlaylistCard from '../../components/PlaylistCard';
import ArtistCircle from '../../components/ArtistCircle';
import Navigation from '../../components/Navigation';
import './Home.css';
import api from '../../services/api.js';

const sectionsData = [
    { "title": "Top Hits do Rebanho (Spotify)", "type": "song", "path":"/songDetail" },
    { "title": "Artistas mais ouvidos (Spotify)", "type": "artist", "path":"/artistDetail" },
    { "title": "Playlists em Destaque (Spotify)", "type": "playlist", "path":"/playlistDetail" },
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
    
    // CORRIGIDO: Seleção de dados e status do Redux
    const songsData = useSelector(state => state.catalog.songs.items);
    const songsStatus = useSelector(state => state.catalog.songs.status);
    
    const artistsData = useSelector(state => state.catalog.artists.items);
    const artistsStatus = useSelector(state => state.catalog.artists.status);

    const albumsData = useSelector(state => state.catalog.albums.items);
    const albumsStatus = useSelector(state => state.catalog.albums.status);
    
    const playlistsData = useSelector(state => state.catalog.playlists.items);
    const playlistsStatus = useSelector(state => state.catalog.playlists.status);


    const filterMap = {
        'Tudo': null,
        'Músicas': 'song',
        'Artistas': 'artist',
        'Playlists': 'playlist',
        'Álbuns': 'album',
    };

    const filteredSections = sectionsData.filter(section => {
        if (selectedFilter === 'Tudo') {
            return true;
        }
        return section.type === filterMap[selectedFilter];
    });

    // 1. Busca Músicas (Spotify Top Tracks)
    useEffect(() => {
        if (songsStatus === 'idle') {
            dispatch(fetchTopTracks());
        }
    }, [songsStatus, dispatch]);
    
    // 2. Busca Artistas (Spotify Top Artists)
    useEffect(() => {
        if (artistsStatus === 'idle') {
            dispatch(fetchArtists());
        }
    }, [artistsStatus, dispatch]);

    // 3. Busca Playlists (Spotify Featured Playlists)
    useEffect(() => {
        if (playlistsStatus === 'idle') {
            dispatch(fetchPlaylists());
        }
    }, [playlistsStatus, dispatch]);

    // 4. Busca Álbuns (MANTENDO A CHAMADA ANTIGA POR ENQUANTO)
    useEffect(() => {
        if (albumsStatus === 'idle') {
            dispatch(fetchAlbums());
        }
    }, [albumsStatus, dispatch]);


    // Checagem de Carregamento (Mais robusta)
    if (songsStatus === 'loading' || artistsStatus === 'loading' || albumsStatus === 'loading' || playlistsStatus === 'loading') {
        return <main><h1 className='pagina-inicial'>Carregando Catálogo Spotify...</h1></main>;
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
                    
                    {/* Renderiza músicas (Spotify) */}
                    {section.type === 'song' && songsData.map((song, index) => (
                        <SongCard
                            key={song.id || index}
                            id={song.id}
                            cover={song.cover}
                            title={song.title}
                            artist={song.artist}
                        />
                    ))}

                    {/* Renderiza Artistas (Spotify) */}
                    {section.type === 'artist' && artistsData.map((artist, index) => (
                        <ArtistCircle
                            key={artist.id || index}
                            id={artist.id}
                            image={artist.image}
                            name={artist.name}
                        />
                    ))}  
                    
                    {/* Renderiza Playlists (Spotify) */}
                    {section.type === 'playlist' && playlistsData.map((playlist, index) => (
                        <PlaylistCard
                            key={playlist.id || index}
                            id={playlist.id}
                            cover={playlist.cover}
                            title={playlist.title}
                        />
                    ))}

                    {/* Renderiza Álbuns (API Antiga / Mongo) */}
                    {section.type === 'album' && albumsData.map((album, index) => (
                        <AlbumCard
                            key={album.id || index}
                            id={album.id}
                            cover={album.cover}
                            title={album.title}
                            artist={album.artist}
                        />
                    ))}

                </Section>
            ))}
        </main>
    );
}

export default Home;