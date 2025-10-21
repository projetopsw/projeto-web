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

const normalizeName = (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const filterDataByQuery = (data, query, field, mode = 'starts_with') => {
    if (!query || !data || data.length === 0) return [];
    const lowerQuery = normalizeName(query);

    const filtered = data.filter(item => {
        const fieldValue = item[field];
        if (!fieldValue) {
            return false;
        }

        const lowerFieldValue = normalizeName(String(fieldValue));
        
        if (mode === 'exact') {
            return lowerFieldValue === lowerQuery;
        } else if (mode === 'includes') {
            return lowerFieldValue.includes(lowerQuery);
        } else { 
            return lowerFieldValue.startsWith(lowerQuery);
        }
    });
    return filtered;
};

/**
 * FUNÇÃO AUXILIAR PARA PEGAR ITENS ALEATÓRIOS
 * @param {Array} data - Array de dados brutos
 * @param {number} count - Quantidade de itens a retornar
 * @returns {Array} - Array de itens aleatórios
 */
const getRandomItems = (data, count = 5) => {
    if (!data || data.length === 0) return [];
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    
    return shuffled.slice(0, count);
};

function Pesquisa() {
    const [selectedFilter, setSelectedFilter] = useState('Tudo');
    
    // Estados principais e relacionados (idênticos em A e B)
    const [mainSongs, setMainSongs] = useState([]); 
    const [mainArtists, setMainArtists] = useState([]);
    const [mainAlbums, setMainAlbums] = useState([]); 
    const [mainPlaylists, setMainPlaylists] = useState([]); 
    const [mainUsers, setMainUsers] = useState([]); 
    
    const [relatedSongs, setRelatedSongs] = useState([]);
    const [relatedArtists, setRelatedArtists] = useState([]); 
    const [relatedAlbums, setRelatedAlbums] = useState([]); 
    const [relatedPlaylists, setRelatedPlaylists] = useState([]); 
    const [relatedUsers, setRelatedUsers] = useState([]);

    const [randomSongs, setRandomSongs] = useState([]);
    const [randomArtists, setRandomArtists] = useState([]);
    const [randomAlbums, setRandomAlbums] = useState([]);
    const [randomPlaylists, setRandomPlaylists] = useState([]);
    const [randomUsers, setRandomUsers] = useState([]); 
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();
    const query = searchParams.get('q'); 

    // Efeito para buscar resultados quando a 'query' mudar
    useEffect(() => {
        if (!query || query.trim() === "") {
            // Limpa todos os resultados se a busca for vazia
            setMainSongs([]); setMainArtists([]); setMainAlbums([]); setMainPlaylists([]); setMainUsers([]); 
            setRelatedSongs([]); setRelatedArtists([]); setRelatedAlbums([]); setRelatedPlaylists([]); setRelatedUsers([]); 
            setRandomSongs([]); setRandomArtists([]); setRandomAlbums([]); setRandomPlaylists([]); setRandomUsers([]); 
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Em uma aplicação real, você usaria uma rota única de busca.
                const artistsPromise = api.get(`/topArtists`); 
                const songsPromise = api.get(`/topSongs`); 
                const albumsPromise = api.get(`/topAlbums`); 
                const playlistsPromise = api.get(`/topPlaylists`);
                const usersPromise = api.get(`/users`); 

                
                const [songsRes, artistsRes, albumsRes, playlistsRes, usersRes] = await Promise.all([ 
                    songsPromise,
                    artistsPromise,
                    albumsPromise,
                    playlistsPromise,
                    usersPromise, 
                ]);

                const allArtists = artistsRes.data;
                const allSongs = songsRes.data;
                const allAlbums = albumsRes.data;
                const allPlaylists = playlistsRes.data;
                const allUsers = usersRes.data;

                // 1. Filtragem principal (startsWith)
                let mainSongsFiltered = filterDataByQuery(allSongs, query, 'title', 'starts_with');
                const mainArtistsFiltered = filterDataByQuery(allArtists, query, 'name', 'starts_with');
                const mainAlbumsFiltered = filterDataByQuery(allAlbums, query, 'title', 'starts_with');
                const mainPlaylistsFiltered = filterDataByQuery(allPlaylists, query, 'title', 'starts_with');
                const mainUsersFiltered = filterDataByQuery(allUsers, query, 'name', 'starts_with'); 

                // 2. Lógica para incluir músicas do artista com nome exato
                const exactArtistMatch = filterDataByQuery(allArtists, query, 'name', 'exact');
                if (exactArtistMatch.length > 0) {
                    const artistId = exactArtistMatch[0].id;
                    const songsByExactArtist = allSongs.filter(song => song.artistId === artistId);
                    const songIds = new Set(mainSongsFiltered.map(song => song.id));
                    const newSongs = songsByExactArtist.filter(song => !songIds.has(song.id));
                    mainSongsFiltered = [...newSongs, ...mainSongsFiltered];
                    console.log(`Correspondência exata encontrada para Artista: ${exactArtistMatch[0].name}. Adicionadas ${newSongs.length} músicas.`);
                }
            
                // Função auxiliar para remover duplicatas
                const removeDuplicates = (mainList, relatedList) => {
                    const mainIds = new Set(mainList.map(item => item.id));
                    return relatedList.filter(item => !mainIds.has(item.id));
                };

                // 3. Filtragem relacionada (includes)
                const relatedArtistsRaw = filterDataByQuery(allArtists, query, 'name', 'includes');
                const relatedSongsRaw = filterDataByQuery(allSongs, query, 'title', 'includes');
                const relatedAlbumsRaw = filterDataByQuery(allAlbums, query, 'title', 'includes');
                const relatedPlaylistsRaw = filterDataByQuery(allPlaylists, query, 'title', 'includes');
                const relatedUsersRaw = filterDataByQuery(allUsers, query, 'name', 'includes'); 

                // 4. Limpeza de duplicatas
                const relatedArtistsClean = removeDuplicates(mainArtistsFiltered, relatedArtistsRaw);
                const relatedSongsClean = removeDuplicates(mainSongsFiltered, relatedSongsRaw);
                const relatedAlbumsClean = removeDuplicates(mainAlbumsFiltered, relatedAlbumsRaw);
                const relatedPlaylistsClean = removeDuplicates(mainPlaylistsFiltered, relatedPlaylistsRaw);
                const relatedUsersClean = removeDuplicates(mainUsersFiltered, relatedUsersRaw);

                // 5. Itens aleatórios (sugestões)
                setRandomSongs(getRandomItems(allSongs));
                setRandomArtists(getRandomItems(allArtists));
                setRandomAlbums(getRandomItems(allAlbums));
                setRandomPlaylists(getRandomItems(allPlaylists));
                setRandomUsers(getRandomItems(allUsers));

                // 6. Atualização de estados
                setMainSongs(mainSongsFiltered); 
                setMainArtists(mainArtistsFiltered);
                setMainAlbums(mainAlbumsFiltered);
                setMainPlaylists(mainPlaylistsFiltered);
                setMainUsers(mainUsersFiltered); 
                
                setRelatedSongs(relatedSongsClean);
                setRelatedArtists(relatedArtistsClean);
                setRelatedAlbums(relatedAlbumsClean);
                setRelatedPlaylists(relatedPlaylistsClean);
                setRelatedUsers(relatedUsersClean);
            } catch (err) {
                // Incorporado o console.error do Código A para melhor debug
                console.error("Erro fatal na chamada da API:", err);
                setError(`Erro crítico na comunicação. Verifique se o JSON Server está ligado e acessível.`); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();

    }, [query]);

    // Função para atualizar o filtro de navegação
    const handleSetFilter = (item) => {
        setSelectedFilter(item);
    };

    // Cálculos de contagem de resultados
    const totalMainResults = mainSongs.length + mainArtists.length + mainAlbums.length + mainPlaylists.length + mainUsers.length;
    const totalRelatedResults = relatedSongs.length + relatedArtists.length + relatedAlbums.length + relatedPlaylists.length + relatedUsers.length; 
    const totalResults = totalMainResults + totalRelatedResults;

    // Definição dos dados para renderização (Incluindo a correção UserCard do Código B)
    const mainResults = [
        // CORRIGIDO: Usando item.img
        { title: "Usuários", type: "user", data: mainUsers, renderCard: (item) => <UserCard key={item.id} image={item.img} {...item} /> }, 
        { title: "Músicas", type: "song", data: mainSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: mainPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: mainAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: mainArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    const relatedResults = [
        // CORRIGIDO: Usando item.img
        { title: "Usuários", type: "user", data: relatedUsers, renderCard: (item) => <UserCard key={item.id} image={item.img} {...item} /> }, 
        { title: "Músicas", type: "song", data: relatedSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: relatedPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: relatedAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: relatedArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    const randomSuggestions = [
        // CORRIGIDO: Usando item.img
        { title: "Usuários", type: "user", data: randomUsers, renderCard: (item) => <UserCard key={item.id} image={item.img} {...item} /> }, 
        { title: "Músicas", type: "song", data: randomSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: randomPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: randomAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: randomArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];
    
    // Renderização do componente (estrutura completa do Código B)
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

                {isLoading && <p>Carregando resultados...</p>}
                {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
                
                {/* 1. Resultados Principais */}
                {!isLoading && !error && totalMainResults > 0 && (
                    <>
                        <h1 className='search-subtitle'>Principais resultados envolvendo "{query}"</h1>
                        {mainResults.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;
                            const isUserSection = section.type === 'user';
                            // Lógica: Se não for Usuário E tiver 9 ou mais itens, mostra os controles (rolagem lateral)
                            const shouldShowControls = !isUserSection && section.data.length >= 9;

                            if (section.data.length > 0 && isFiltered) {
                                return (
                                    <Section 
                                        key={section.title + '-main'} 
                                        title={section.title}
                                        showControls={shouldShowControls}
                                    >
                                        {/* Renderização condicional para resultados de Usuário (vertical) vs. outros (horizontal/scroll) */}
                                        {isUserSection ? (
                                            <div className="vertical-results-container">
                                                {section.data.map(section.renderCard)}
                                            </div>
                                        ) : (
                                            section.data.map(section.renderCard)
                                        )}
                                    </Section>
                                );
                            }
                            return null;
                        })}
                    </>
                )}

                {/* 2. Resultados Relacionados */}
                {!isLoading && !error && totalRelatedResults > 0 && (
                    <>
                        <h1 className='search-subtitle' style={{ marginTop: totalMainResults > 0 ? '40px' : '0px' }}>Relacionados</h1>
                        {relatedResults.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;
                            const isUserSection = section.type === 'user'; 
                            // Lógica: Se não for Usuário E tiver 9 ou mais itens, mostra os controles (rolagem lateral)
                            const shouldShowControls = !isUserSection && section.data.length >= 9;

                            if (section.data.length > 0 && isFiltered) {
                                return (
                                    <Section 
                                        key={section.title + '-related'} 
                                        title={section.title}
                                        showControls={shouldShowControls}
                                    >
                                        {/* Renderização condicional para resultados de Usuário (vertical) vs. outros (horizontal/scroll) */}
                                        {isUserSection ? (
                                            <div className="vertical-results-container">
                                                {section.data.map(section.renderCard)}
                                            </div>
                                        ) : (
                                            section.data.map(section.renderCard)
                                        )}
                                    </Section>
                                );
                            }
                            return null;
                        })}
                    </>
                )}
                
                {/* 3. Bloco de "Nenhum Resultado Encontrado" e Sugestões Aleatórias (do Código B) */}
                {!isLoading && !error && query && totalResults === 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <p style={{ marginBottom: '40px', fontSize: '1.2rem', color: 'var(--text-color)' }}>
                            Eita ferro! Nenhum resultado foi encontrado para "{query}"!
                        </p>

                        <h1 className='search-subtitle' style={{ marginTop: '0px' }}>... Mas talvez você goste:</h1>

                        {randomSuggestions.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;

                            if (section.data.length > 0 && isFiltered) {
                                return (
                                    <Section key={section.title + '-random'} title={section.title}>
                                        {/* Container ajustado para rolagem horizontal (default) ou vertical (users) */}
                                        <div className={section.type === 'user' ? "vertical-results-container" : "section-scroll-container"}>
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