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
import './Pesquisa.css'; 
import api from '../../services/api.js'; 


const navItemsData = ["Tudo", "Playlists", "Músicas", "Álbuns", "Artistas"];

/**
 * 💡 FUNÇÃO AUXILIAR DE FILTRAGEM (AGORA COM SELETOR DE MODO)
 * @param {Array} data - Array de dados brutos (e.g., topArtists.data)
 * @param {string} query - O termo de busca
 * @param {string} field - O campo a ser buscado ('name' ou 'title')
 * @param {string} mode - 'starts_with' ou 'includes'
 * @returns {Array} - Array de resultados filtrados
 */

const filterDataByQuery = (data, query, field, mode = 'starts_with') => {
    if (!query || !data || data.length === 0) return [];
    
    const lowerQuery = query.toLowerCase();

    const filtered = data.filter(item => {
        const fieldValue = item[field];
        if (!fieldValue) {
            return false;
        }

        const lowerFieldValue = String(fieldValue).toLowerCase();
        
        if (mode === 'includes') {
            // Lógica para RELACIONADOS (Contém)
            return lowerFieldValue.includes(lowerQuery);
        } else {
            // Lógica para PRINCIPAIS RESULTADOS (Começa com)
            return lowerFieldValue.startsWith(lowerQuery);
        }
    });
    
    // Log para debug
    console.log(`Filtro [${field} - ${mode.toUpperCase()}] para "${query}": Encontrados ${filtered.length} resultados.`);

    return filtered;
};


function Pesquisa() {
    const [selectedFilter, setSelectedFilter] = useState('Tudo');
    
    // ESTADOS PARA PRINCIPAIS RESULTADOS (.startsWith)
    const [mainSongs, setMainSongs] = useState([]); 
    const [mainArtists, setMainArtists] = useState([]); 
    const [mainAlbums, setMainAlbums] = useState([]); 
    const [mainPlaylists, setMainPlaylists] = useState([]); 

    // ESTADOS PARA RESULTADOS RELACIONADOS (.includes)
    const [relatedSongs, setRelatedSongs] = useState([]); 
    const [relatedArtists, setRelatedArtists] = useState([]); 
    const [relatedAlbums, setRelatedAlbums] = useState([]); 
    const [relatedPlaylists, setRelatedPlaylists] = useState([]); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();
    const query = searchParams.get('q'); 

    // ----------------------------------------------------
    // LÓGICA CENTRAL DE BUSCA DE DADOS NA API
    // ----------------------------------------------------
    useEffect(() => {
        if (!query || query.trim() === "") {
            // Limpa todos os estados
            setMainSongs([]); setMainArtists([]); setMainAlbums([]); setMainPlaylists([]);
            setRelatedSongs([]); setRelatedArtists([]); setRelatedAlbums([]); setRelatedPlaylists([]);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            
            console.log(`Iniciando busca para query: "${query}"`);

            try {
                // PASSO 1: BUSCAR TODOS OS DADOS BRUTOS
                const artistsPromise = api.get(`/topArtists`); 
                const songsPromise = api.get(`/topSongs`);     
                const albumsPromise = api.get(`/topAlbums`);   
                const playlistsPromise = api.get(`/topPlaylists`); 
                
                
                const [songsRes, artistsRes, albumsRes, playlistsRes] = await Promise.all([
                    songsPromise,
                    artistsPromise,
                    albumsPromise,
                    playlistsPromise,
                ]);
                
                // Dados brutos
                const allArtists = artistsRes.data;
                const allSongs = songsRes.data;
                const allAlbums = albumsRes.data;
                const allPlaylists = playlistsRes.data;

                // PASSO 2: FILTRAGEM PARA PRINCIPAIS RESULTADOS (.startsWith)
                const mainArtistsFiltered = filterDataByQuery(allArtists, query, 'name', 'starts_with');
                const mainSongsFiltered = filterDataByQuery(allSongs, query, 'title', 'starts_with');
                const mainAlbumsFiltered = filterDataByQuery(allAlbums, query, 'title', 'starts_with');
                const mainPlaylistsFiltered = filterDataByQuery(allPlaylists, query, 'title', 'starts_with');

                // PASSO 3: FILTRAGEM PARA RELACIONADOS (.includes)
                // É CRUCIAL remover os resultados principais dos relacionados para evitar duplicidade.
                
                // Função para remover duplicatas (usando Set de IDs)
                const removeDuplicates = (mainList, relatedList) => {
                    const mainIds = new Set(mainList.map(item => item.id));
                    return relatedList.filter(item => !mainIds.has(item.id));
                };

                const relatedArtistsRaw = filterDataByQuery(allArtists, query, 'name', 'includes');
                const relatedSongsRaw = filterDataByQuery(allSongs, query, 'title', 'includes');
                const relatedAlbumsRaw = filterDataByQuery(allAlbums, query, 'title', 'includes');
                const relatedPlaylistsRaw = filterDataByQuery(allPlaylists, query, 'title', 'includes');

                // Aplica a remoção de duplicatas
                const relatedArtistsClean = removeDuplicates(mainArtistsFiltered, relatedArtistsRaw);
                const relatedSongsClean = removeDuplicates(mainSongsFiltered, relatedSongsRaw);
                const relatedAlbumsClean = removeDuplicates(mainAlbumsFiltered, relatedAlbumsRaw);
                const relatedPlaylistsClean = removeDuplicates(mainPlaylistsFiltered, relatedPlaylistsRaw);


                // PASSO 4: ATUALIZA OS ESTADOS
                // Main
                setMainSongs(mainSongsFiltered); 
                setMainArtists(mainArtistsFiltered);
                setMainAlbums(mainAlbumsFiltered);
                setMainPlaylists(mainPlaylistsFiltered);
                // Related
                setRelatedSongs(relatedSongsClean);
                setRelatedArtists(relatedArtistsClean);
                setRelatedAlbums(relatedAlbumsClean);
                setRelatedPlaylists(relatedPlaylistsClean);

            } catch (err) {
                console.error("Erro fatal na chamada da API:", err);
                // ... (tratamento de erro)
                setError(`Erro crítico na comunicação. Verifique se o JSON Server está ligado e acessível.`);
                
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();

    }, [query]);


    const handleSetFilter = (item) => {
        setSelectedFilter(item);
    };
    
    // ESTRUTURA PARA PRINCIPAIS RESULTADOS
    const mainResults = [
        { title: "Músicas", type: "song", data: mainSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: mainPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: mainAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: mainArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    // ESTRUTURA PARA RELACIONADOS
    const relatedResults = [
        { title: "Músicas", type: "song", data: relatedSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: relatedPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: relatedAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: relatedArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    const totalMainResults = mainSongs.length + mainArtists.length + mainAlbums.length + mainPlaylists.length;
    const totalRelatedResults = relatedSongs.length + relatedArtists.length + relatedAlbums.length + relatedPlaylists.length;
    const totalResults = totalMainResults + totalRelatedResults;


    return (
        <>
            <Header />
            <main className="content-area">
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Navigation 
                        navItemsData={navItemsData}
                        selectedItem={selectedFilter}
                        setSelectedItem={handleSetFilter} 
                    />
                </div>

                {isLoading && <p>Carregando resultados...</p>}
                {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
                
                {/* 1. PRINCIPAIS RESULTADOS */}
                {!isLoading && !error && totalMainResults > 0 && (
                    <>
                        <h1 className='search-subtitle'>Principais resultados envolvendo "{query}"</h1>
                        {mainResults.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;

                            if (section.data.length > 0 && isFiltered) {
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

                {/* 2. RESULTADOS RELACIONADOS */}
                {!isLoading && !error && totalRelatedResults > 0 && (
                    <>
                        <h1 className='search-subtitle' style={{ marginTop: '40px' }}>Relacionados</h1>
                        {relatedResults.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;

                            if (section.data.length > 0 && isFiltered) {
                                return (
                                    <Section key={section.title + '-related'} title={section.title}>
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


                {/* Mensagem se nenhum resultado for encontrado */}
                {!isLoading && !error && query && totalResults === 0 && (
                    <p style={{ marginTop: '20px' }}>Nenhum resultado encontrado para **"{query}"** em todas as categorias.</p>
                )}
            </main>
            <Footer />
        </>
    );
}

export default Pesquisa;