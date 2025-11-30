import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; 
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Navigation from '../../components/Navigation'; 
import Section from '../../components/Section'; 
import SongCard from '../../components/SongCard';
import AlbumCard from '../../components/AlbumCard';
import PlaylistCard from '../../components/PlaylistCard';
import ArtistCircle from '../../components/ArtistCircle';
import UserCard from '../../components/UserCard'; 
import './Pesquisa.css'; 
import api from '../../services/api.js'; 

const navItemsData = ["Tudo", "Usuários", "Playlists", "Músicas", "Álbuns", "Artistas"];

// Função para pegar itens aleatórios (para o caso de busca vazia)
// Sugestão: No futuro, crie uma rota backend /api/recommendations para isso não pesar
const getRandomItems = (data, count = 5) => {
    if (!data || data.length === 0) return [];
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

function Pesquisa() {
    const [selectedFilter, setSelectedFilter] = useState('Tudo');
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q'); 

    const [results, setResults] = useState({
        artists: [],
        albums: [],
        tracks: [],
        playlists: [], 
        users: []      
    });

    const [randomSuggestions, setRandomSuggestions] = useState({
        artists: [], albums: [], tracks: [], playlists: [], users: []
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const adaptResults = (data) => {
    return {
        artists: (data.artists || []).map(artist => ({
            id: artist._id, // Garante que o ID venha do Mongo
            name: artist.name,
            image: artist.image
        })),

        albums: (data.albums || []).map(album => {
            // Lógica de segurança para montar nome dos artistas
            const artistNames = Array.isArray(album.artists) 
                ? album.artists.map(a => a.name).join(', ') // Backend novo (populado)
                : (typeof album.artist === 'string' ? album.artist : 'Vários Artistas'); // Backend velho ou fallback

            return {
                ...album,
                id: album._id, 
                artist: artistNames, 
                cover: album.cover || (album.images && album.images[0]?.url)
            };
        }),

        tracks: (data.tracks || []).map(track => {
            // Lógica de segurança para músicas
            const artistNames = Array.isArray(track.artists)
                ? track.artists.map(a => a.name).join(', ')
                : 'Desconhecido';

            return {
                ...track,
                id: track._id,
                artist: artistNames,
                image: track.cover 
            };
        }),
        
        playlists: [],
        users: []      
    };
};

    useEffect(() => {
        if (!query || query.trim() === "") {
            setResults({ artists: [], albums: [], tracks: [], playlists: [], users: [] });
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await api.get(`/api/search`, {
                    params: { q: query, type: 'artist,album,track' }
                });

                const adaptedData = adaptResults(response.data);

                const totalFound = adaptedData.artists.length + adaptedData.albums.length + adaptedData.tracks.length;
                
                if (totalFound === 0) {
                    try {
                        const [songsRes, artistsRes, albumsRes] = await Promise.all([
                            api.get('/songs?limit=10'), 
                            api.get('/artists?limit=10'),
                            api.get('/albums?limit=10')
                        ]);
                        
                        setRandomSuggestions({
                            tracks: getRandomItems(songsRes.data),
                            artists: getRandomItems(artistsRes.data),
                            albums: getRandomItems(albumsRes.data),
                            playlists: [],
                            users: []
                        });
                    } catch (e) {
                        console.warn("Erro ao buscar sugestões aleatórias", e);
                    }
                }

                setResults(adaptedData);

            } catch (err) {
                console.error("Erro na busca:", err);
                setError("Não foi possível realizar a busca. Tente novamente.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();

    }, [query]);

    const handleSetFilter = (item) => {
        setSelectedFilter(item);
    };
    
    const totalMainResults = results.tracks.length + results.artists.length + results.albums.length + results.playlists.length + results.users.length;
    
    const mainSections = [
        { title: "Usuários", type: "user", data: results.users, renderCard: (item) => <UserCard key={item.id} {...item} /> }, 
        { title: "Músicas", type: "song", data: results.tracks, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Álbuns", type: "album", data: results.albums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: results.artists, renderCard: (item) => <ArtistCircle key={item.id} id={item.id} image={item.image} name={item.name} />},
        // { title: "Playlists", type: "playlist", data: results.playlists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
    ];

    const randomSections = [
        { title: "Músicas", type: "song", data: randomSuggestions.tracks, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Álbuns", type: "album", data: randomSuggestions.albums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: randomSuggestions.artists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    return (
        <>
            <Header initialQuery={query} />
            <main className="content-area">
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Navigation 
                        navItemsData={navItemsData}
                        selectedItem={selectedFilter}
                        setSelectedItem={handleSetFilter} 
                    />
                </div>

                {isLoading && <div className="loading-spinner">Carregando resultados do Spotify...</div>}
                
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                {!isLoading && !error && totalMainResults > 0 && (
                    <>
                        <h1 className='search-subtitle'>Resultados para "{query}"</h1>
                        {mainSections.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;

                            if (section.data && section.data.length > 0 && isFiltered) {
                                return (
                                    <Section key={section.title + '-main'} title={section.title}>
                                        <div className="section-scroll-container">
                                            {section.data.map(section.renderCard)}
                                        </div>
                                    </Section>
                                );
                            }
                            return null;
                        })}
                    </>
                )}

                {!isLoading && !error && query && totalMainResults === 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <p style={{ marginBottom: '40px', fontSize: '1.2rem', color: 'var(--text-color)', textAlign:'center' }}>
                            Nenhum resultado encontrado para "{query}" no nosso banco ou no Spotify.
                        </p>

                        <h1 className='search-subtitle'>Talvez você goste:</h1>

                        {randomSections.map((section) => {
                            if (section.data && section.data.length > 0) {
                                return (
                                    <Section key={section.title + '-random'} title={section.title}>
                                        <div className="section-scroll-container">
                                            {section.data.map(section.renderCard)}
                                        </div>
                                    </Section>
                                );
                            }
                            return null;
                        })}
                    </div>
                )}
                
            </main>
            <Footer />
        </>
    );
}

export default Pesquisa;