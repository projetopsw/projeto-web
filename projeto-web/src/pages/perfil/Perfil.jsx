import React, { useEffect, useState } from 'react';
import { Box, Divider, Typography, CircularProgress } from '@mui/material'; 
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

// Importações do Redux
import { setUserData } from '../../redux/userSlice';
import { fetchPlaylistsByUserId } from '../../redux/playlistsSlice';
import { fetchArtistsByIds, fetchSongsByIds } from '../../redux/catalogoSlice';
import { fetchUsersByIds } from '../../redux/loginSlice';

// Componentes
import Section from '../../components/Section.jsx';
import PlaylistCard from '../../components/PlaylistCard.jsx';
import ArtistCircle from '../../components/ArtistCircle.jsx';
import ProfileHeader from '../../components/ProfileHeader'; 
import SongList from '../../components/SongList';

const API_URL = 'http://localhost:3001';
const DEFAULT_USER_IMAGE = 'https://placehold.co/400x400?text=User'; 

// --- Função Auxiliar de Fetch para o Usuário Alvo ---
const fetchTargetUser = async (targetId) => {
    try {
        const response = await fetch(`${API_URL}/users/${targetId}`);
        if (!response.ok) throw new Error('Falha ao carregar dados do usuário alvo.');
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar usuário na Perfil Page:", error);
        return null;
    }
};

// --- FUNÇÃO DE PERSISTÊNCIA GENÉRICA (PUT) ---
const updateUserOnServer = async (userToUpdate) => {
    const userId = userToUpdate.id;
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userToUpdate),
        });

        if (!response.ok) {
            throw new Error(`Falha ao atualizar o usuário ${userId} no servidor. Status: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error("Erro na persistência do usuário:", error);
        return null;
    }
};

export default function Perfil() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); 

    const userLogado = useSelector(state => state.user.user); 
    
    // ESTADO LOCAL para o perfil que está sendo exibido (alvo)
    const [targetUser, setTargetUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [targetPlaylists, setTargetPlaylists] = useState([]);
    const [targetFriendsDetails, setTargetFriendsDetails] = useState([]);
    const [targetLikedSongsDetails, setTargetLikedSongsDetails] = useState([]);
    const [targetFollowedArtistsDetails, setTargetFollowedArtistsDetails] = useState([]);

    const targetId = id || (userLogado ? String(userLogado.id) : null);
    const isOwner = userLogado && targetId && String(userLogado.id) === targetId;

    // Seletores do Redux (Usados apenas se isOwner for TRUE)
    const { items: friendDetailsRedux } = useSelector(state => state.auth?.friends || { items: [] });
    const { items: userPlaylistsRedux } = useSelector(state => state.playlists?.userPlaylists || { items: [] });
    const { items: followedArtistsRedux } = useSelector(state => state.catalog?.followedArtists || { items: [] });
    const { items: likedSongsDetailsRedux } = useSelector(state => state.catalog?.likedSongsDetails || { items: [] });

    const currentIsFriend = userLogado?.friends?.includes(String(targetUser?.id));
    const currentHasRequested = userLogado?.requestsSent?.includes(String(targetUser?.id));
    const currentHasReceivedRequest = targetUser?.requestsSent?.includes(String(userLogado?.id)); // Checa se o TARGET enviou solicitação para o LOGADO
    
    useEffect(() => {
        if (!targetId) {
            setIsLoading(false);
            return;
        }

        const loadProfileData = async () => {
            setIsLoading(true);
         
            let userToDisplay = userLogado && isOwner ? userLogado : await fetchTargetUser(targetId);
            
            if (userToDisplay) {
                setTargetUser(userToDisplay);

                if (isOwner) {
                    // SE O DONO: Dispara fetches do Redux
                    dispatch(fetchPlaylistsByUserId(userToDisplay.id));
                    dispatch(fetchUsersByIds(userToDisplay.friends || []));
                    dispatch(fetchArtistsByIds(userToDisplay.following || []));
                    dispatch(fetchSongsByIds(userToDisplay.likedSongs || []));
                    // Garante que o Redux está atualizado com o usuário mais recente
                    dispatch(setUserData(userToDisplay)); 

                } else {
                    // SE UM AMIGO: Busca todos os dados auxiliares na API
                    const fetchDetailsForFriend = async (user) => {
                        const [playlists, friendsDetails, songsDetails, artistsDetails] = await Promise.all([
                            fetch(`${API_URL}/userPlaylists?creatorId=${user.id}`).then(res => res.ok ? res.json() : []), 
                            user.friends?.length ? fetch(`${API_URL}/users?${user.friends.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : [],
                            user.likedSongs?.length ? fetch(`${API_URL}/allSongs?${user.likedSongs.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : [], 
                            user.following?.length ? fetch(`${API_URL}/topArtists?${user.following.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : []
                        ]);
                        setTargetPlaylists(playlists.filter(p => p)); 
                        setTargetFriendsDetails(friendsDetails.filter(f => f));
                        setTargetLikedSongsDetails(songsDetails.filter(s => s));
                        setTargetFollowedArtistsDetails(artistsDetails.filter(a => a));
                    }
                    fetchDetailsForFriend(userToDisplay);
                }
            }
            setIsLoading(false);
        };

        loadProfileData();
    // A lista de dependências deve ser reativa para que mudanças no userLogado (como adicionar amigo)
    // disparem a re-renderização e re-busca se necessário.
    }, [targetId, isOwner, userLogado?.friends, userLogado?.requestsSent, dispatch]); 


    // --- Implementação do Handler de Ação de Amizade (COM PERSISTÊNCIA DUPLA) ---
    const handleFriendAction = async () => {
        if (!userLogado || !targetUser) return;
        
        const targetUserIdStr = String(targetUser.id);
        const userLogadoIdStr = String(userLogado.id);
        
        let updatedUserLogado = { ...userLogado };
        // Criamos uma cópia do targetUser para não modificar o estado local diretamente
        let updatedTargetUser = { ...targetUser }; 
        let action = '';

        // --- 1. LÓGICA DE ATUALIZAÇÃO MÚTUA ---

        if (currentIsFriend) {
            // AÇÃO: Remover Amigo
            action = 'Remover Amigo';

            // 1a. Remove o amigo do array de friends do usuário logado
            updatedUserLogado.friends = (userLogado.friends || []).filter(id => id !== targetUserIdStr);
            
            // 1b. Remove o usuário logado do array de friends do amigo
            updatedTargetUser.friends = (targetUser.friends || []).filter(id => id !== userLogadoIdStr);

        } else if (currentHasRequested) {
            // AÇÃO: Cancelar Solicitação
            action = 'Cancelar Solicitação';

            // 2a. Remove a solicitação enviada do array do usuário logado
            updatedUserLogado.requestsSent = (userLogado.requestsSent || []).filter(id => id !== targetUserIdStr);
            
            // 2b. Remove a solicitação recebida do array do amigo
            updatedTargetUser.requestsReceived = (targetUser.requestsReceived || []).filter(id => id !== userLogadoIdStr);

        } else {
            // AÇÃO: Enviar Solicitação
            action = 'Enviar Solicitação';

            // 3a. Adiciona o ID do amigo no array de requestsSent do usuário logado
            updatedUserLogado.requestsSent = [...(userLogado.requestsSent || []), targetUserIdStr];
            
            // 3b. Adiciona o ID do usuário logado no array de requestsReceived do amigo
            updatedTargetUser.requestsReceived = [...(targetUser.requestsReceived || []), userLogadoIdStr];
        }
        
        console.log(`[AÇÃO] Tentando ${action} para: ${targetUser.name || targetUser.username}`);

        // --- 2. PERSISTÊNCIA DAS MUDANÇAS (DOIS PUTS EM SÉRIE) ---
        
        // Persiste a mudança no perfil do usuário logado
        const resultLogado = await updateUserOnServer(updatedUserLogado);
        
        // Persiste a mudança no perfil do amigo (targetUser)
        const resultTarget = await updateUserOnServer(updatedTargetUser);

        if (resultLogado && resultTarget) {
            // Se ambos deram certo, atualiza os estados no front-end:
            dispatch(setUserData(resultLogado)); // Atualiza o Redux com o perfil do usuário logado
            setTargetUser(resultTarget);         // Atualiza o estado local com o perfil do amigo (mantém o botão reativo)
            console.log("Ambos os perfis atualizados no DBJSON e Redux/Local.");
        } else {
            // Se houver falha em um dos PUTs, avisa o usuário
            console.error("Falha ao atualizar um ou ambos os perfis. As alterações podem estar inconsistentes.");
            alert("Erro ao salvar a alteração de amizade. Tente novamente.");
            // Poderia re-buscar o perfil do usuário logado aqui para tentar corrigir a inconsistência.
        }
    };

    // --- Handlers de Navegação ---
    const handleFriendClick = (id) => navigate(`/perfil/${id}`);
    const handleViewFriends = () => navigate('/conexoes'); 
    const handleEditProfile = () => navigate('/perfil/editar');
    
    // --- Renderização de Estado ---
    if (isLoading) {
        return <main><Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box></main>;
    }

    if (!targetUser) {
        return <main><Box sx={{ p: 4 }}><Typography color="error">Perfil do usuário **{targetId}** não encontrado. 😢</Typography></Box></main>;
    }

    // --- DETERMINAÇÃO E LIMITAÇÃO DAS LISTAS EXIBIDAS (UNIFICAÇÃO) ---
    const displayedPlaylists = isOwner ? userPlaylistsRedux : targetPlaylists;
    
    // LIMITAÇÃO DE AMIGOS: Exibe apenas os 6 primeiros para manter o layout limpo
    const allFriends = isOwner ? friendDetailsRedux : targetFriendsDetails;
    const limitedDisplayedFriends = allFriends.slice(0, 6); 

    const displayedLikedSongs = isOwner ? likedSongsDetailsRedux : targetLikedSongsDetails;
    const displayedFollowedArtists = isOwner ? followedArtistsRedux : targetFollowedArtistsDetails;


    // Formatação dos dados para o ProfileHeader
    const totalFriendCount = targetUser.friends?.length || 0;
    const profileUserData = {
        ...targetUser,
        username: targetUser.name || targetUser.username,
        playlists: displayedPlaylists.length,
        friends: totalFriendCount, 
        following: targetUser.following || [],
    };
    
    // --- Lógica do Texto e Habilitação do Botão de Amizade ---
    let friendButtonText = "Adicionar aos Amigos";
    let isFriendButtonDisabled = false;

    if (currentIsFriend) {
        friendButtonText = "Remover Amigo";
    } else if (currentHasRequested) {
        friendButtonText = "Solicitação Pendente";
        // Permite o clique para Cancelar a solicitação
    } 
    // OBS: Se você quisesse a lógica de "Aceitar Solicitação", ela estaria aqui.
    // Exemplo: else if (targetUser?.requestsReceived?.includes(userLogadoIdStr)) { ... }


    return (
        <main>
            <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, pb: 15 }}>
                
                {/* 1. HEADER */}
                <ProfileHeader 
                    user={profileUserData} 
                    onEditClick={isOwner ? handleEditProfile : null} 
                    onFriendsClick={isOwner ? handleViewFriends : null} // Clique para /conexoes no Header (Contagem)
                    isOwner={isOwner}
                    currentIsFriend={currentIsFriend}
                    // Ação, texto e desabilitado passados para o ProfileHeader
                    onFriendAction={!isOwner ? handleFriendAction : null} 
                    friendActionText={friendButtonText}
                    isFriendActionDisabled={isFriendButtonDisabled}
                />
                
                <Divider sx={{ my: 4 }} />
                
                {/* 2. MÚSICAS FAVORITAS */}
                {displayedLikedSongs.length > 0 && (
                    <>
                        <SongList 
                            tituloDaSecao={isOwner ? "Suas Músicas Mais Mugidas" : `Músicas Mugidas de ${targetUser.name || targetUser.username}`} 
                            tracksArr={displayedLikedSongs}
                        />
                        <Divider sx={{ my: 4 }} />
                    </>
                )}
                
                {/* 3. PLAYLISTS */}
                <Section key={"Playlists"} title={`Playlists de ${targetUser.name || targetUser.username}`}>
                    {displayedPlaylists.length > 0 ? (
                        displayedPlaylists.map((playlist) => (
                            <PlaylistCard
                                key={playlist.id}
                                id={playlist.id}
                                cover={playlist.cover}
                                title={playlist.title}
                                artist={targetUser.name || targetUser.username}
                            />
                        ))
                    ) : (
                        <Typography sx={{ color: 'var(--secondary-text-color)' }}>
                            {targetUser.name || targetUser.username} não criou nenhuma playlist.
                        </Typography>
                    )}
                </Section>
                
                <Divider sx={{ my: 4 }} />
                
                {/* 4. AMIGOS (Contagem total e clique no título para /conexoes se for o dono) */}
                <Box sx={{ mb: 4 }}>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-start',
                            alignItems: 'center', 
                            mb: 2 
                        }}
                    >
                        {/* TÍTULO: CLICÁVEL se for o dono do perfil. Contagem usa TOTAL de amigos. */}
                        <Box
                            onClick={isOwner ? handleViewFriends : null} // CLIQUE PARA /CONEXOES AQUI
                            sx={{ 
                                cursor: isOwner ? 'pointer' : 'default',
                                '&:hover': { opacity: isOwner ? 0.8 : 1 }
                            }}
                        >
                            <Typography variant="h5" sx={{ color: 'var(--text-primary)' }}>
                                Peões Amigos ({totalFriendCount})
                            </Typography>
                        </Box>
                        
                    </Box>
                    
                    <Box sx={{ display: 'flex', overflowX: 'auto', gap: 2 }}>
                        {/* CORREÇÃO APLICADA: Usa a lista limitada de amigos */}
                        {limitedDisplayedFriends.length > 0 ? (
                            limitedDisplayedFriends.map((friend) => (
                                <ArtistCircle
                                    key={friend.id}
                                    id={friend.id}
                                    image={friend.image || DEFAULT_USER_IMAGE}
                                    name={friend.name || friend.username || `Amigo ${friend.id}`} 
                                    onClick={() => handleFriendClick(friend.id)}
                                    sx={{ cursor: 'pointer' }}
                                />
                            ))
                        ) : (
                            <Typography sx={{ color: 'var(--secondary-text-color)' }}>
                                Este usuário ainda não tem amigos exibíveis.
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                {/* 5. ARTISTAS SEGUIDOS */}
                {displayedFollowedArtists.length > 0 && (
                    <Section key={"Artistas Seguidos"} title={`Artistas Seguidos por ${targetUser.name || targetUser.username}`}>
                        {displayedFollowedArtists.map((artist) => (
                            <ArtistCircle
                                key={artist.id}
                                id={artist.id}
                                image={artist.image || DEFAULT_USER_IMAGE} 
                                name={artist.name || `Artista ${artist.id}`}
                            />
                        ))}
                    </Section>
                )}
                
                <div className="margin-bottom"></div>
            </Box>
        </main>
    );
}