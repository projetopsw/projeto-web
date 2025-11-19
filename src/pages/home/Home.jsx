import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTopTracks } from '../../redux/catalogoSlice'; // Importa a nova thunk
import Section from '../../components/Section';
import SongCard from '../../components/SongCard';
import AlbumCard from '../../components/AlbumCard';
import PlaylistCard from '../../components/PlaylistCard';
import ArtistCircle from '../../components/ArtistCircle';
import Navigation from '../../components/Navigation';
import './Home.css';
import api from '../../services/api.js'; // Mantido para outros fetches temporariamente

const sectionsData = [
    { "title": "Top Hits do Rebanho", "type": "song", "path":"/songDetail" },
    { "title": "Artistas mais ouvidos", "type": "artist", "path":"/artistDetail" },
    { "title": "Para você", "type": "artist" },
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
    
    // Dados agora vêm do Redux
    const songs = useSelector(state => state.catalog.songs);
    const songsStatus = useSelector(state => state.catalog.status);
    const artists = useSelector(state => state.catalog.artists); // Presumindo que você ainda usa o estado local para outros
    const albums = useSelector(state => state.catalog.albums);
    const playlists = useSelector(state => state.catalog.playlists);

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

    // SUBSTITUIÇÃO: Busca músicas do Spotify via Redux
    useEffect(() => {
        if (songsStatus === 'idle') {
            dispatch(fetchTopTracks());
        }
    }, [songsStatus, dispatch]);

    // Mantenho os fetches antigos temporariamente, mas idealmente seriam substituídos por thunks
    useEffect(() => {
        api.get("/albums")
            .then((res) => setAlbums(res.data))
            .catch((err) => console.error("Erro ao buscar álbuns:", err));
    }, []);

    useEffect(() => {
        api.get("/artists")
            .then((res) => setArtists(res.data))
            .catch((err) => console.error("Erro ao buscar artistas:", err));
    }, []);

    useEffect(() => {
        api.get("/playlists")
            .then((res) => setPlaylists(res.data))
            .catch((err) => console.error("Erro ao buscar playlists:", err));
    }, []);

    // Se o catálogo estiver carregando, mostre uma mensagem (para músicas do Spotify)
    if (songsStatus === 'loading') {
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
                    
                    {section.type === 'song' && songs.map((song, index) => (
                        <SongCard
                            key={index}
                            id={song.id}
                            cover={song.cover}
                            title={song.title}
                            artist={song.artist}
                        />
                    ))}

                    {section.type === 'artist' && artists.map((artist, index) => (
                        <ArtistCircle
                            key={index}
                            id={artist.id}
                            image={artist.image}
                            name={artist.name}
                        />
                    ))}  
                    
                    {section.type === 'playlist' && playlists.map((playlist, index) => (
                        <PlaylistCard
                            key={index}
                            id={playlist.id}
                            cover={playlist.cover}
                            title={playlist.title}
                        />
                    ))}

                    {section.type === 'album' && albums.map((album, index) => (
                        <AlbumCard
                            key={index}
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