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
// 💡 Importar o novo componente UserCard
import UserCard from '../../components/UserCard'; 
import './Pesquisa.css'; 
import api from '../../services/api.js'; 


// 💡 ADICIONADO "USUÁRIOS"
const navItemsData = ["Tudo", "Usuários", "Playlists", "Músicas", "Álbuns", "Artistas"];

/**
 * 💡 FUNÇÃO AUXILIAR: Normaliza texto removendo acentos, espaços extras e convertendo para minúsculas.
 */
const normalizeName = (str) => {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

/**
 * 💡 FUNÇÃO AUXILIAR DE FILTRAGEM
 */
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
        } else { // starts_with
            return lowerFieldValue.startsWith(lowerQuery);
        }
    });
    
    // console.log(`Filtro [${field} - ${mode.toUpperCase()}] para "${query}": Encontrados ${filtered.length} resultados.`);

    return filtered;
};

/**
 * 💡 FUNÇÃO AUXILIAR PARA PEGAR ITENS ALEATÓRIOS
 * @param {Array} data - Array de dados brutos
 * @param {number} count - Quantidade de itens a retornar (AGORA PADRÃO É 5)
 * @returns {Array} - Array de itens aleatórios
 */
const getRandomItems = (data, count = 5) => {
    if (!data || data.length === 0) return [];
    
    // Cria uma cópia e embaralha
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    
    // Retorna os primeiros 'count' itens
    return shuffled.slice(0, count);
};


function Pesquisa() {
    const [selectedFilter, setSelectedFilter] = useState('Tudo');
    
    // ESTADOS PARA RESULTADOS DE BUSCA
    const [mainSongs, setMainSongs] = useState([]); 
    const [mainArtists, setMainArtists] = useState([]); 
    const [mainAlbums, setMainAlbums] = useState([]); 
    const [mainPlaylists, setMainPlaylists] = useState([]); 
    const [mainUsers, setMainUsers] = useState([]); // 💡 NOVO ESTADO PARA USUÁRIOS
    
    const [relatedSongs, setRelatedSongs] = useState([]); 
    const [relatedArtists, setRelatedArtists] = useState([]); 
    const [relatedAlbums, setRelatedAlbums] = useState([]); 
    const [relatedPlaylists, setRelatedPlaylists] = useState([]); 
    const [relatedUsers, setRelatedUsers] = useState([]); // 💡 NOVO ESTADO PARA USUÁRIOS RELACIONADOS

    // NOVO ESTADO PARA ITENS ALEATÓRIOS (SUGESTÕES)
    const [randomSongs, setRandomSongs] = useState([]);
    const [randomArtists, setRandomArtists] = useState([]);
    const [randomAlbums, setRandomAlbums] = useState([]);
    const [randomPlaylists, setRandomPlaylists] = useState([]);
    const [randomUsers, setRandomUsers] = useState([]); // 💡 NOVO ESTADO PARA USUÁRIOS ALEATÓRIOS
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchParams] = useSearchParams();
    const query = searchParams.get('q'); 

    // ----------------------------------------------------
    // LÓGICA CENTRAL DE BUSCA DE DADOS E ALEATÓRIOS
    // ----------------------------------------------------
    useEffect(() => {
        if (!query || query.trim() === "") {
            // Limpa todos os estados
            setMainSongs([]); setMainArtists([]); setMainAlbums([]); setMainPlaylists([]); setMainUsers([]); // 💡 USUÁRIOS
            setRelatedSongs([]); setRelatedArtists([]); setRelatedAlbums([]); setRelatedPlaylists([]); setRelatedUsers([]); // 💡 USUÁRIOS
             setRandomSongs([]); setRandomArtists([]); setRandomAlbums([]); setRandomPlaylists([]); setRandomUsers([]); // 💡 USUÁRIOS
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // PASSO 1: BUSCAR TODOS OS DADOS BRUTOS (ADICIONANDO USERS)
                const artistsPromise = api.get(`/topArtists`); 
                const songsPromise = api.get(`/topSongs`);     
                const albumsPromise = api.get(`/topAlbums`);   
                const playlistsPromise = api.get(`/topPlaylists`); 
                const usersPromise = api.get(`/users`); // 💡 NOVA CHAMADA API
                
                
                const [songsRes, artistsRes, albumsRes, playlistsRes, usersRes] = await Promise.all([ // 💡 ADICIONADO usersRes
                    songsPromise,
                    artistsPromise,
                    albumsPromise,
                    playlistsPromise,
                    usersPromise, // 💡 PROMISE
                ]);
                
                // Dados brutos
                const allArtists = artistsRes.data;
                const allSongs = songsRes.data;
                const allAlbums = albumsRes.data;
                const allPlaylists = playlistsRes.data;
                const allUsers = usersRes.data; // 💡 DADOS BRUTOS DE USUÁRIOS

                // PASSO 2: BUSCA PRINCIPAL (Starts With)
                let mainSongsFiltered = filterDataByQuery(allSongs, query, 'title', 'starts_with');
                const mainArtistsFiltered = filterDataByQuery(allArtists, query, 'name', 'starts_with');
                const mainAlbumsFiltered = filterDataByQuery(allAlbums, query, 'title', 'starts_with');
                const mainPlaylistsFiltered = filterDataByQuery(allPlaylists, query, 'title', 'starts_with');
                // 💡 BUSCA PRINCIPAL DE USUÁRIOS POR NOME
                const mainUsersFiltered = filterDataByQuery(allUsers, query, 'name', 'starts_with'); 


                // 🚨 PASSO 3: LÓGICA DE BUSCA EXATA POR ARTISTA E INJEÇÃO DE MÚSICAS (Mantida a existente)
                const exactArtistMatch = filterDataByQuery(allArtists, query, 'name', 'exact');

                if (exactArtistMatch.length > 0) {
                    const artistId = exactArtistMatch[0].id;
                    const songsByExactArtist = allSongs.filter(song => song.artistId === artistId);
                    const songIds = new Set(mainSongsFiltered.map(song => song.id));
                    const newSongs = songsByExactArtist.filter(song => !songIds.has(song.id));
                    mainSongsFiltered = [...newSongs, ...mainSongsFiltered];
                    console.log(`Correspondência exata encontrada para Artista: ${exactArtistMatch[0].name}. Adicionadas ${newSongs.length} músicas.`);
                }
                // --------------------------------------------------------------------------------


                // PASSO 4: BUSCA RELACIONADA (Includes - Removendo Duplicatas)
                const removeDuplicates = (mainList, relatedList) => {
                    const mainIds = new Set(mainList.map(item => item.id));
                    return relatedList.filter(item => !mainIds.has(item.id));
                };

                const relatedArtistsRaw = filterDataByQuery(allArtists, query, 'name', 'includes');
                const relatedSongsRaw = filterDataByQuery(allSongs, query, 'title', 'includes');
                const relatedAlbumsRaw = filterDataByQuery(allAlbums, query, 'title', 'includes');
                const relatedPlaylistsRaw = filterDataByQuery(allPlaylists, query, 'title', 'includes');
                // 💡 BUSCA RELACIONADA DE USUÁRIOS POR NOME
                const relatedUsersRaw = filterDataByQuery(allUsers, query, 'name', 'includes'); 

                const relatedArtistsClean = removeDuplicates(mainArtistsFiltered, relatedArtistsRaw);
                const relatedSongsClean = removeDuplicates(mainSongsFiltered, relatedSongsRaw);
                const relatedAlbumsClean = removeDuplicates(mainAlbumsFiltered, relatedAlbumsRaw);
                const relatedPlaylistsClean = removeDuplicates(mainPlaylistsFiltered, relatedPlaylistsRaw);
                // 💡 REMOVE DUPLICATAS DE USUÁRIOS
                const relatedUsersClean = removeDuplicates(mainUsersFiltered, relatedUsersRaw);


                // PASSO 5: BUSCA POR ALEATÓRIOS (USADA APENAS SE A BUSCA FALHAR)
                setRandomSongs(getRandomItems(allSongs));
                setRandomArtists(getRandomItems(allArtists));
                setRandomAlbums(getRandomItems(allAlbums));
                setRandomPlaylists(getRandomItems(allPlaylists));
                setRandomUsers(getRandomItems(allUsers)); // 💡 ALEATÓRIOS DE USUÁRIOS

                // PASSO 6: ATUALIZA OS ESTADOS DA BUSCA (ADICIONANDO USERS)
                setMainSongs(mainSongsFiltered); 
                setMainArtists(mainArtistsFiltered);
                setMainAlbums(mainAlbumsFiltered);
                setMainPlaylists(mainPlaylistsFiltered);
                setMainUsers(mainUsersFiltered); // 💡 SET PRINCIPAL USERS
                
                setRelatedSongs(relatedSongsClean);
                setRelatedArtists(relatedArtistsClean);
                setRelatedAlbums(relatedAlbumsClean);
                setRelatedPlaylists(relatedPlaylistsClean);
                setRelatedUsers(relatedUsersClean); // 💡 SET RELACIONADO USERS

            } catch (err) {
                console.error("Erro fatal na chamada da API:", err);
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
    
    // Total de resultados StartsWith (ADICIONANDO USERS)
    const totalMainResults = mainSongs.length + mainArtists.length + mainAlbums.length + mainPlaylists.length + mainUsers.length;
    
    // ESTRUTURA PARA PRINCIPAIS RESULTADOS (ADICIONANDO USERS)
    const mainResults = [
        { title: "Usuários", type: "user", data: mainUsers, renderCard: (item) => <UserCard key={item.id} {...item} /> }, // 💡 NOVO
        { title: "Músicas", type: "song", data: mainSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: mainPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: mainAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: mainArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    // ESTRUTURA PARA RELACIONADOS (ADICIONANDO USERS)
    const relatedResults = [
        { title: "Usuários", type: "user", data: relatedUsers, renderCard: (item) => <UserCard key={item.id} {...item} /> }, // 💡 NOVO
        { title: "Músicas", type: "song", data: relatedSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: relatedPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: relatedAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: relatedArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];
    
    // ESTRUTURA PARA ALEATÓRIOS (SUGESTÕES) (ADICIONANDO USERS)
    const randomSuggestions = [
        { title: "Usuários", type: "user", data: randomUsers, renderCard: (item) => <UserCard key={item.id} {...item} /> }, // 💡 NOVO
        { title: "Músicas", type: "song", data: randomSongs, renderCard: (item) => <SongCard key={item.id} {...item} /> },
        { title: "Playlists", type: "playlist", data: randomPlaylists, renderCard: (item) => <PlaylistCard key={item.id} {...item} />},
        { title: "Álbuns", type: "album", data: randomAlbums, renderCard: (item) => <AlbumCard key={item.id} {...item} />},
        { title: "Artistas", type: "artist", data: randomArtists, renderCard: (item) => <ArtistCircle key={item.id} image={item.image} name={item.name} />},
    ];

    const totalRelatedResults = relatedSongs.length + relatedArtists.length + relatedAlbums.length + relatedPlaylists.length + relatedUsers.length; // 💡 ADICIONADO USERS
    const totalResults = totalMainResults + totalRelatedResults;


    return (
        <>
            <Header initialQuery={query} />
            <main className="content-area">
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Navigation 
                        navItemsData={navItemsData}
                        selectedItem={selectedFilter}
                        setSelecteditem={handleSetFilter} 
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
                                        {/* 💡 RENDERIZAÇÃO VERTICAL PARA USUÁRIOS */}
                                        <div className={section.type === 'user' ? "vertical-results-container" : "section-scroll-container"}>
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
                        <h1 className='search-subtitle' style={{ marginTop: totalMainResults > 0 ? '40px' : '0px' }}>Relacionados</h1>
                        {relatedResults.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;

                            if (section.data.length > 0 && isFiltered) {
                                return (
                                    <Section key={section.title + '-related'} title={section.title}>
                                        {/* 💡 RENDERIZAÇÃO VERTICAL PARA USUÁRIOS */}
                                        <div className={section.type === 'user' ? "vertical-results-container" : "section-scroll-container"}>
                                            {section.data.map(section.renderCard)}
                                        </div>
                                    </Section>
                                );
                            }
                            return null;
                        })}
                    </>
                )}


                {/* 3. MENSAGEM DE ERRO E SUGESTÕES (totalResults == 0) */}
                {!isLoading && !error && query && totalResults === 0 && (
                    <div style={{ marginTop: '20px' }}>
                        {/* Mensagem de erro */}
                        <p style={{ marginBottom: '40px', fontSize: '1.2rem', color: 'var(--text-color)' }}>
                            Eita ferro! Nenhum resultado foi encontrado para "{query}"!
                        </p>

                        {/* Título da sugestão */}
                        <h1 className='search-subtitle' style={{ marginTop: '0px' }}>... Mas talvez você goste:</h1>

                        {/* Renderiza as sugestões aleatórias */}
                        {randomSuggestions.map((section) => {
                            const isFiltered = selectedFilter === 'Tudo' || selectedFilter === section.title;

                            if (section.data.length > 0 && isFiltered) {
                                return (
                                    <Section key={section.title + '-random'} title={section.title}>
                                        {/* 💡 RENDERIZAÇÃO VERTICAL PARA USUÁRIOS */}
                                        <div className={section.type === 'user' ? "vertical-results-container" : "section-scroll-container"}>
                                            {/* ✅ Agora exibirá no máximo 5 itens por categoria */}
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