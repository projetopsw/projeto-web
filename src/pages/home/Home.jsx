import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAlbums } from '../../redux/catalogoSlice';
import Section from '../../components/Section';
import SongCard from '../../components/SongCard';
import AlbumCard from '../../components/AlbumCard';
import PlaylistCard from '../../components/PlaylistCard';
import ArtistCircle from '../../components/ArtistCircle';
import Navigation from '../../components/Navigation';
import './Home.css';
import mongoApi from '../../services/mongoApi.js';

const sectionsData = [
    { id: "top_hits", title: "Top Hits do Rebanho", type: "song", criteria: "popularity", path: "/songDetail" },
    { id: "top_artists", title: "Artistas mais ouvidos", type: "artist", criteria: "random", path: "/artistDetail" },
    { id: "featured_playlists", title: "Playlists em Destaque", type: "playlist", criteria: "random", path: "/playlistDetail" },
    { id: "acoustic", title: "Acús-ticos do Campo", type: "song", criteria: "acoustic", path: "/songDetail" },
    { id: "dance_albums", title: "Pista de Dança Malhada", type: "album", criteria: "random", path: "/albumDetail" },
];

const navItemsData = ["Tudo", "Playlists", "Músicas", "Álbuns", "Artistas"];

const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

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
                        const isLocalUpload = s.uploadedBy || s.isArtistUpload || !s.spotifyId; 
                        if (isLocalUpload) return true;

                        const capa = s.cover || s.album?.cover;
                        if (!capa || capa === '') return false;

                        if (s.popularity !== undefined && s.popularity < 20) return false;

                        if (isGarbage(s.title)) return false;

                        let artistNameCheck = "";
                        if (Array.isArray(s.artists) && s.artists.length > 0) artistNameCheck = s.artists[0].name;
                        else if (s.artist && typeof s.artist === 'object') artistNameCheck = s.artist.name;
                        else if (typeof s.artist === 'string') artistNameCheck = s.artist;
                        
                        if (isGarbage(artistNameCheck)) return false;

                        return true;
                    });

                    const normSongs = validSongs.map(s => {
                        let artistName = 'Desconhecido';
                        let artistId = null; 
                        let isArtistUpload = false; 
                        let isUserUpload = false; 
                        let genre = s.genre || '';

                        if (Array.isArray(s.artists) && s.artists.length > 0) {
                            const mainArtist = s.artists[0];
                            artistName = s.artists.map(a => a.name || a.username).join(', ');
                            artistId = mainArtist._id;
                            isArtistUpload = !!mainArtist.isArtistUpload;
                            isUserUpload = !!s.uploadedBy && !isArtistUpload;
                        } else if (s.artist) {
                            artistName = typeof s.artist === 'string' ? s.artist : s.artist.name || s.artist.username;
                            artistId = typeof s.artist === 'object' ? s.artist._id : null;
                            isArtistUpload = !!s.isArtistUpload;
                            isUserUpload = !!s.uploadedBy && !isArtistUpload;
                        }

                        if (artistId && !isArtistUpload && !isUserUpload) {
                            isArtistUpload = true;
                        }
                        
                        return {
                            id: s._id,
                            cover: s.cover || s.album?.cover, 
                            title: s.title,
                            artist: artistName, 
                            artistId: artistId, 
                            isArtistUpload: isArtistUpload, 
                            isUserUpload: isUserUpload,     
                            popularity: s.popularity || 0,
                            genre: genre.toLowerCase(),
                            fullSongData: s,
                        };
                    });
                    setSongsData(normSongs);
                }

                if (artistsResult.status === 'fulfilled') {
                    const rawArtists = artistsResult.value.data;
                    const validArtists = rawArtists.filter(a => {
                        if (a.isArtistUpload) return true; 
                        
                        const img = a.cover || a.image;
                        if (!img || img === '') return false;
                        
                        if (a.popularity !== undefined && a.popularity < 20 ) return false;
                     
                        if (isGarbage(a.name)) return false;

                        return true;
                    });
                    const normArtists = validArtists.map(a => ({
                        id: a._id || a.spotifyId,
                        image: a.cover || a.image,
                        name: a.name,
                        popularity: a.popularity || 0
                    }));
                    setArtistsData(normArtists);
                }

                if (playlistsResult.status === 'fulfilled') {
                    const normPlaylists = playlistsResult.value.data.map(p => ({
                        id: p._id,
                        cover: p.img || '/assets/img/vacateste.jpg',
                        title: p.name,
                        description: p.description || ''
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

    const getSectionContent = (section) => {
        let content = [];
        
        switch(section.type) {
            case 'song':
                content = [...songsData];
                break;
            case 'artist':
                content = [...artistsData];
                break;
            case 'playlist':
                content = [...playlistsData];
                break;
            case 'album':
                content = albumsData.filter(a => {
                    if (!a.cover && !a.image) return false;
                    if (isGarbage(a.title)) return false;
                    return true;
                }).map(a => ({...a, id: a._id || a.id}));
                break;
            default:
                content = [];
        }


        if (section.type === 'playlist') {
            return shuffleArray(content);
        }
     
        if (section.criteria === 'popularity') {
            return content.sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 15);
        }

        if (section.criteria === 'acoustic') {
            const acoustic = content.filter(item => 
                (item.title && item.title.toLowerCase().includes('acústico')) ||
                (item.title && item.title.toLowerCase().includes('ao vivo'))
            );
            return acoustic.length > 0 ? acoustic.slice(0, 15) : shuffleArray(content).slice(0, 15);
        }

        return shuffleArray(content).slice(0, 15);
    };

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

            {filteredSections.map((section) => {
                const sectionItems = getSectionContent(section);

                if (sectionItems.length === 0) return null;

                return (
                    <Section key={section.title} title={section.title} className="card-container">
                        
                        {section.type === 'song' && sectionItems.map((song) => (
                            <SongCard
                                key={song.id}
                                id={song.id}
                                cover={song.cover}
                                title={song.title}
                                artist={song.artist}
                                artistId={song.artistId}
                                isArtistUpload={song.isArtistUpload}
                                isUserUpload={song.isUserUpload}
                            />
                        ))}

                        {section.type === 'artist' && sectionItems.map((artist) => (
                            <ArtistCircle
                                key={artist.id}
                                id={artist.id}
                                image={artist.image}
                                name={artist.name}
                            />
                        ))}

                        {section.type === 'playlist' && sectionItems.map((playlist) => (
                            <PlaylistCard
                                key={playlist.id}
                                id={playlist.id}
                                cover={playlist.cover}
                                title={playlist.title}
                            />
                        ))}

                        {section.type === 'album' && sectionItems.map((album) => {
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
                                    key={album.id}
                                    id={album.id}
                                    cover={album.cover || album.image} 
                                    title={album.title}
                                    artist={artistName} 
                                />
                            );
                        })}     
                    </Section>
                );
            })}
        </main>
    );
}

export default Home;