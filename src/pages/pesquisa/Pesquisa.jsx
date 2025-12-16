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

const DEFAULT_COVER = '/assets/img/default_song_cover.png';
const DEFAULT_ALBUM_COVER = '/assets/img/default_album_cover.png';
const DEFAULT_USER_AVATAR = '/assets/img/default_user_avatar.png';
const DEFAULT_ARTIST_IMAGE = '/assets/img/default_artist_image.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/default_playlist_cover.png';

const isGarbage = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    const blockedKeywords = [
        "karaoke", "tribute to", "ringtone", "instrumental version", 
        "originally performed by", "made famous by", "cover band", 
        "backing track", "silent track"
    ];
    return blockedKeywords.some(term => lower.includes(term));
};

const getRandomItems = (data, count = 5) => {
    if (!data || data.length === 0) return [];
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

const getCombinedResults = (data) => {
    if (!data) return [];
    return [...(data.priority || []), ...(data.related || [])];
};

const mapUser = (user) => ({
    ...user,
    id: user._id || user.id,
    name: user.name || user.username || 'Usuário',
    image: user.image || user.avatar || DEFAULT_USER_AVATAR
});

const mapPlaylist = (playlist) => ({
    ...playlist,
    id: playlist._id || playlist.id,
    image: playlist.cover || playlist.image || (playlist.images && playlist.images[0]?.url) || DEFAULT_PLAYLIST_COVER
});

const mapArtist = (artist) => {
    if (!artist) return null;
    
    if (isGarbage(artist.name)) return null;

    const image = artist.image || artist.cover || (artist.images && artist.images[0]?.url) || DEFAULT_ARTIST_IMAGE;
    
    return {
        id: artist._id || artist.id, 
        name: artist.name,
        image: image
    };
};

const mapAlbum = (album) => {
    if (!album) return null;

    if (isGarbage(album.name || album.title)) return null;

    const cover = album.cover || (album.images && album.images[0]?.url) || album.image || DEFAULT_ALBUM_COVER;
    
    let artistNames = 'Vários Artistas';

    if (Array.isArray(album.artists) && album.artists.length > 0) {
        artistNames = album.artists.map(a => a.name).join(', ');
    } 
    else if (album.artist && typeof album.artist === 'object' && album.artist.name) {
        artistNames = album.artist.name;
    }
    else if (typeof album.artist === 'string' && album.artist.trim() !== '') {
        artistNames = album.artist;
    }

    return {
        ...album,
        id: album._id || album.id, 
        name: album.name || album.title, 
        artist: artistNames, 
        cover: cover
    };
};

const mapTrack = (track) => {
    if (!track) return null; 

    if (isGarbage(track.name || track.title)) return null;

    let artistNames = 'Desconhecido';

    if (Array.isArray(track.artists) && track.artists.length > 0) {
        if (typeof track.artists[0] === 'string') {
            artistNames = track.artists.join(', ');
        } else if (track.artists[0].name) {
            artistNames = track.artists.map(a => a.name).join(', ');
        }
    } 
    else if (track.artist && typeof track.artist === 'object' && track.artist.name) {
        artistNames = track.artist.name;
    }
    else if (typeof track.artist === 'string' && track.artist.trim() !== '') {
        artistNames = track.artist;
    }
    else if (track.owner && (track.owner.name || track.owner.username)) {
        artistNames = track.owner.name || track.owner.username;
    }
    else if (track.album && Array.isArray(track.album.artists) && track.album.artists.length > 0) {
          if (track.album.artists[0].name) {
            artistNames = track.album.artists.map(a => a.name).join(', ');
          }
    }

    if (isGarbage(artistNames)) return null;

    const imageCover = track.cover || 
                       track.image ||
                       (track.album && track.album.cover) || 
                       (track.album && track.album.images && track.album.images[0]?.url) ||
                       DEFAULT_COVER; 

    return {
        ...track,
        id: track._id || track.id, 
        title: track.title || track.name,
        artist: artistNames, 
        subtitle: artistNames, 
        image: imageCover,
        cover: imageCover 
    };
};


const normalizeSectionData = (rawData) => {
    if (!rawData) return { priority: [], related: [] };
    
    if (rawData.priority || rawData.related) {
        return {
            priority: rawData.priority || [],
            related: rawData.related || []
        };
    }
    
    if (Array.isArray(rawData)) {
        return { priority: rawData, related: [] };
    }

    return { priority: [], related: [] };
};

const adaptResults = (data, categoryFilter) => {
    const emptyState = {
        artists: { priority: [], related: [] },
        albums: { priority: [], related: [] },
        tracks: { priority: [], related: [] },
        playlists: { priority: [], related: [] },
        users: { priority: [], related: [] }
    };

    if (!data) return emptyState;

    if (categoryFilter === 'tudo') {
        return {
            artists: normalizeSectionData(data.artistas),
            albums: normalizeSectionData(data.albuns),
            tracks: normalizeSectionData(data.musicas),
            playlists: normalizeSectionData(data.playlists),
            users: normalizeSectionData(data.usuarios),
        };
    } 
    
    let rawDataToNormalize = null;
    
    switch (categoryFilter) {
        case 'musica': rawDataToNormalize = data.musicas; break;
        case 'album': rawDataToNormalize = data.albuns; break;
        case 'artista': rawDataToNormalize = data.artistas; break;
        case 'playlist': rawDataToNormalize = data.playlists; break;
        case 'usuario': rawDataToNormalize = data.usuarios; break;
        default: break;
    }
    
    const normalized = normalizeSectionData(rawDataToNormalize);
    
    switch (categoryFilter) {
        case 'musica': return { ...emptyState, tracks: normalized };
        case 'album': return { ...emptyState, albums: normalized };
        case 'artista': return { ...emptyState, artists: normalized };
        case 'playlist': return { ...emptyState, playlists: normalized };
        case 'usuario': return { ...emptyState, users: normalized };
        default: return emptyState;
    }
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

    const fetchResults = async (currentQuery, currentFilterLabel) => {
        setIsLoading(true);
        setError(null);
        
        const backendCategory = CATEGORY_MAP[currentFilterLabel] || 'tudo'; 

        try {
            const response = await api.get(`/api/search`, {
                params: { 
                    query: currentQuery, 
                    category: backendCategory 
                }
            });

            const rawData = response.data.results || {}; 
            const finalResults = adaptResults(rawData, backendCategory);
            setResults(finalResults);

        } catch (err) {
            console.error("Erro na busca:", err);
            setError("Não foi possível realizar a busca. Tente novamente.");
            setResults(adaptResults(null));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!query || query.trim() === "") {
            setResults(adaptResults(null));
            return;
        }
        fetchResults(query, selectedFilter);
    }, [query, selectedFilter]);

    useEffect(() => {
        const totalCount = 
            getCombinedResults(results.tracks).length + 
            getCombinedResults(results.artists).length + 
            getCombinedResults(results.albums).length + 
            getCombinedResults(results.playlists).length + 
            getCombinedResults(results.users).length;
        
        if (query && totalCount === 0 && !isLoading) {
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
        { title: "Músicas", type: "musica", data: results.tracks, mapFn: mapTrack, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Álbuns", type: "album", data: results.albums, mapFn: mapAlbum, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artista", data: results.artists, mapFn: mapArtist, renderCard: (item) => <ArtistCircle key={item.id} id={item.id} image={item.image} name={item.name} />},
        { title: "Playlists", type: "playlist", data: results.playlists, mapFn: mapPlaylist, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Usuários", type: "usuario", data: results.users, mapFn: mapUser, renderCard: (item) => <UserCard key={item.id} {...item} /> }, 
    ];

    const randomSections = [
        { title: "Músicas", type: "song", data: randomSuggestions.tracks, mapFn: mapTrack, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Álbuns", type: "album", data: randomSuggestions.albums, mapFn: mapAlbum, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: randomSuggestions.artists, mapFn: mapArtist, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    const renderResultsSection = (section, isPriority) => {
        const dataKey = isPriority ? 'priority' : 'related';
        const rawDataArray = (section.data && section.data[dataKey]) || [];

        const shouldShow = selectedFilter === 'Tudo' || selectedFilter === section.title;

        if (rawDataArray.length > 0 && shouldShow) {
            const finalData = rawDataArray.map(section.mapFn).filter(item => item !== null);

            if (finalData.length === 0) return null;

            const sectionTitle = isPriority ? section.title : `Relacionados em ${section.title}`;
            const containerClass = isPriority ? "section-scroll-container" : "section-scroll-container related-section";
            
            return (
                <Section key={`${section.title}-${dataKey}`} title={sectionTitle} showTitle={isPriority || selectedFilter !== 'Tudo'}>
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
                
                {error && <p style={{ color: 'var(--text-error, red)', textAlign: 'center', marginTop: '20px' }}>{error}</p>}
                
                {!isLoading && !error && totalMainResults > 0 && (
                    <>
                        {query && <h1 className='search-subtitle'>Resultados para "{query}"</h1>}
                        
                        <div className="search-priority-section">
                            {sectionsData.map((section) => renderResultsSection(section, true))}
                        </div>
                        
                        {sectionsData.some(s => s.data.related && s.data.related.length > 0 && (selectedFilter === 'Tudo' || selectedFilter === s.title)) && (
                            <h2 className='search-related-title'>Relacionados</h2>
                        )}
                        
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
                                const mappedData = section.data.map(section.mapFn).filter(Boolean);
                                return (
                                    <Section key={section.title + '-random'} title={section.title}>
                                        <div className="section-scroll-container">
                                            {mappedData.map(section.renderCard)}
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