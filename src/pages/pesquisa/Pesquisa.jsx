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

const CATEGORY_MAP = {
    "Tudo": "tudo",
    "Músicas": "musica",
    "Álbuns": "album",
    "Artistas": "artista",
    "Playlists": "playlist",
    "Usuários": "usuario"
};

const getRandomItems = (data, count = 5) => {
    if (!data || data.length === 0) return [];
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const getCombinedResults = (data) => {
    if (!data || (!data.priority && !data.related)) {
        return [];
    }
    return [...(data.priority || []), ...(data.related || [])];
};

const mapUser = (user) => ({
    ...user,
    id: user._id || user.id,
});

const mapPlaylist = (playlist) => ({
    ...playlist,
    id: playlist._id || playlist.id,
});

const mapArtist = (artist) => ({
    id: artist._id || artist.id, 
    name: artist.name,
    image: artist.image
});

const mapAlbum = (album) => {
    const artistNames = Array.isArray(album.artists) 
        ? album.artists.map(a => a.name).join(', ') 
        : (typeof album.artist === 'string' ? album.artist : 'Vários Artistas');

    return {
        ...album,
        id: album._id || album.id, 
        artist: artistNames, 
        cover: album.cover || (album.images && album.images[0]?.url)
    };
};

const mapTrack = (track) => {
    const artistNames = Array.isArray(track.artists)
        ? track.artists.map(a => a.name).join(', ')
        : 'Desconhecido';

    return {
        ...track,
        id: track._id || track.id,
        artist: artistNames,
        image: track.cover || (track.album && track.album.cover)
    };
};

const adaptResults = (data) => {
    const getSplitResults = (backendKey) => {
        const raw = data[backendKey];
        if (raw && (raw.priority || raw.related)) {
            return {
                priority: raw.priority || [],
                related: raw.related || []
            };
        }
        if (Array.isArray(raw)) {
             return { priority: raw, related: [] };
        }
        return { priority: [], related: [] };
    };


    return {
        artists: getSplitResults('artistas'),
        albums: getSplitResults('albuns'),
        tracks: getSplitResults('musicas'),
        playlists: getSplitResults('playlists'),
        users: getSplitResults('usuarios'),
    };
};

function Pesquisa() {
    const [selectedFilter, setSelectedFilter] = useState('Tudo');
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q'); 

    const [results, setResults] = useState({
        artists: { priority: [], related: [] }, 
        albums: { priority: [], related: [] }, 
        tracks: { priority: [], related: [] }, 
        playlists: { priority: [], related: [] }, 
        users: { priority: [], related: [] }
    });

    const [randomSuggestions, setRandomSuggestions] = useState({
        artists: [], albums: [], tracks: [], playlists: [], users: []
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchResults = async (currentQuery, currentFilter) => {
        setIsLoading(true);
        setError(null);
        
        const backendCategory = CATEGORY_MAP[currentFilter] || 'tudo'; 

        try {
            const response = await api.get(`/api/search`, {
                params: { 
                    query: currentQuery, 
                    category: backendCategory 
                }
            });

            const rawData = response.data.results; 
            let finalResults = {}; 

            if (backendCategory === 'tudo') {
                const adaptedData = adaptResults(rawData);
                finalResults = {
                    artists: adaptedData.artists,
                    albums: adaptedData.albums,
                    tracks: adaptedData.tracks,
                    playlists: adaptedData.playlists,
                    users: adaptedData.users,
                };
            } else {
                let stateKey;
                switch (backendCategory) {
                    case 'musica': stateKey = 'tracks'; break;
                    case 'album': stateKey = 'albums'; break;
                    case 'artista': stateKey = 'artists'; break;
                    case 'playlist': stateKey = 'playlists'; break;
                    case 'usuario': stateKey = 'users'; break;
                    default: stateKey = null;
                }
                
                if (stateKey) {
                    const normalizedData = Array.isArray(rawData) 
                        ? { priority: rawData, related: [] } 
                        : rawData; 

                    finalResults = { 
                        ...results, 
                        [stateKey]: normalizedData
                    };
                }
            }
            
            if (Object.keys(finalResults).length > 0) {
                setResults(finalResults);
            }


        } catch (err) {
            console.error("Erro na busca:", err);
            setError("Não foi possível realizar a busca. Verifique o servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!query || query.trim() === "") {
            setResults({ 
                artists: { priority: [], related: [] }, 
                albums: { priority: [], related: [] }, 
                tracks: { priority: [], related: [] }, 
                playlists: { priority: [], related: [] }, 
                users: { priority: [], related: [] }
            });
            return;
        }

        fetchResults(query, selectedFilter);

    }, [query, selectedFilter]);

    useEffect(() => {
        const totalMainResults = 
            getCombinedResults(results.tracks).length + 
            getCombinedResults(results.artists).length + 
            getCombinedResults(results.albums).length + 
            getCombinedResults(results.playlists).length + 
            getCombinedResults(results.users).length;
        
        if (query && totalMainResults === 0 && !isLoading) {
            const loadSuggestions = async () => {
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
            };
            loadSuggestions();
        }
    }, [query, results, isLoading]);

    const handleSetFilter = (item) => {
        setSelectedFilter(item);
    };
    
    const totalMainResults = 
        getCombinedResults(results.tracks).length + 
        getCombinedResults(results.artists).length + 
        getCombinedResults(results.albums).length + 
        getCombinedResults(results.playlists).length + 
        getCombinedResults(results.users).length;
    
    const sectionsData = [
        { title: "Músicas", type: "musica", data: results.tracks, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Álbuns", type: "album", data: results.albums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artista", data: results.artists, renderCard: (item) => <ArtistCircle key={item.id} id={item.id} image={item.image} name={item.name} />},
        { title: "Playlists", type: "playlist", data: results.playlists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Usuários", type: "usuario", data: results.users, renderCard: (item) => <UserCard key={item.id} {...item} /> }, 
    ];

    const randomSections = [
        { title: "Músicas", type: "song", data: randomSuggestions.tracks, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Álbuns", type: "album", data: randomSuggestions.albums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: randomSuggestions.artists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    const renderResultsSection = (section, isPriority) => {
        const dataKey = isPriority ? 'priority' : 'related';
        
        const dataArray = (section.data && section.data[dataKey]) || [];

        const sectionTitle = isPriority ? section.title : `Relacionados em ${section.title}`;
        const containerClass = isPriority ? "section-scroll-container" : "section-scroll-container related-section";
        
        const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;

        if (dataArray.length > 0 && isFiltered) {
            
            const mapFunction = (item) => {
                if (section.title === 'Músicas') return mapTrack(item);
                if (section.title === 'Álbuns') return mapAlbum(item);
                if (section.title === 'Artistas') return mapArtist(item);
                if (section.title === 'Playlists') return mapPlaylist(item);
                if (section.title === 'Usuários') return mapUser(item);
                return item;
            };

            const finalData = dataArray.map(mapFunction);
            
            return (
                <Section key={section.title + '-' + dataKey} title={sectionTitle} showTitle={isPriority || selectedFilter !== 'Tudo'}>
                    <div className={containerClass}>
                        {finalData.map(section.renderCard)}
                    </div>
                </Section>
            );
        }
        return null;
    };
    
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

                {isLoading && <div className="loading-spinner">Carregando resultados...</div>}
                
                {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
                
                {!isLoading && !error && totalMainResults > 0 && (
                    <>
                        <h1 className='search-subtitle'>Resultados para "{query}"</h1>
                        
                        <div className="search-priority-section">
                            {sectionsData.map((section) => renderResultsSection(section, true))}
                        </div>
                        
                        <h2 className='search-related-title' style={{ display: sectionsData.some(s => s.data.related && s.data.related.length > 0) ? 'block' : 'none' }}>
                            Relacionados
                        </h2>
                        <div className="search-related-section">
                            {sectionsData.map((section) => renderResultsSection(section, false))}
                        </div>
                    </>
                )}

                {!isLoading && !error && query && totalMainResults === 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <p style={{ marginBottom: '40px', fontSize: '1.2rem', color: 'var(--text-color)', textAlign:'center' }}>
                            Nenhum resultado encontrado para "{query}".
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