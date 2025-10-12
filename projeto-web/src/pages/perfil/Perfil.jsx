import React, { useEffect, useState } from 'react';
import { Box, Divider, Typography, CircularProgress, Button } from '@mui/material'; 
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

// Importações do Redux
import { setUserData } from '../../redux/userSlice';
import { fetchPlaylistsByUserId } from '../../redux/playlistsSlice';
import { fetchArtistsByIds, fetchSongsByIds } from '../../redux/catalogoSlice';
import { fetchUsersByIds } from '../../redux/loginSlice';

// Ações centralizadas de Conexão
import { 
    toggleFriendRequest, 
    acceptFriendRequest, 
    removeFriend // <<-- NOVO: Importação para remover amigo
} from '../../redux/connectionsSlice';

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

export default function Perfil() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); 

    const userLogado = useSelector(state => state.user.user); 
    
    // Selecionar o estado de conexões para o usuário logado
    const { 
        friends: loggedInFriends, 
        sentRequests: loggedInSentRequests,
        pendingRequests: loggedInPendingRequests
    } = useSelector((state) => state.connections);

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
    const friendDetailsRedux = loggedInFriends; 
    const { items: userPlaylistsRedux } = useSelector(state => state.playlists?.userPlaylists || { items: [] });
    const { items: followedArtistsRedux } = useSelector(state => state.catalog?.followedArtists || { items: [] });
    const { items: likedSongsDetailsRedux } = useSelector(state => state.catalog?.likedSongsDetails || { items: [] });

    // --- LÓGICA DE RELACIONAMENTO USANDO O CONNECTIONS SLICE ---
    const targetUserIdStr = String(targetUser?.id);
    
    const currentIsFriend = loggedInFriends.some(f => String(f.id) === targetUserIdStr);
    const currentHasRequested = loggedInSentRequests.some(req => String(req.id) === targetUserIdStr);
    const currentHasReceivedRequest = loggedInPendingRequests.some(req => String(req.id) === targetUserIdStr);
    
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
                    dispatch(fetchPlaylistsByUserId(userToDisplay.id));
                    dispatch(fetchArtistsByIds(userToDisplay.following || []));
                    dispatch(fetchSongsByIds(userToDisplay.likedSongs || []));
                    dispatch(setUserData(userToDisplay)); 

                } else {
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
    }, [targetId, isOwner, dispatch, 
        userLogado?.id, 
        loggedInFriends.length, 
        loggedInSentRequests.length, 
        loggedInPendingRequests.length
    ]); 


    // --- Handler UNIFICADO de Ação de Amizade (Adicionar/Remover/Cancelar/Aceitar) ---
    const handleToggleAction = async () => {
        if (!userLogado || !targetUser) return;
        
        if (currentIsFriend) {
            // SE JÁ É AMIGO: REMOVER AMIGO
            dispatch(removeFriend({ 
                currentUserId: userLogado.id, 
                targetUserId: targetUser.id 
            }));
            alert(`Você removeu ${targetUser.name} de seus amigos.`);
            
        } else if (currentHasReceivedRequest) {
            // SE RECEBEU PEDIDO: ACEITAR
            dispatch(acceptFriendRequest({ accepterId: userLogado.id, requester: targetUser }));
            alert(`Você aceitou o pedido de ${targetUser.name}!`);
            
        } else {
            // CASO CONTRÁRIO: ADICIONAR / CANCELAR PEDIDO
            dispatch(toggleFriendRequest({ currentUserId: userLogado.id, targetUser }));
            
            // Feedback simples:
            if (currentHasRequested) {
                alert(`Pedido para ${targetUser.name} cancelado.`);
            } else {
                alert(`Pedido para ${targetUser.name} enviado!`);
            }
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
    } else if (currentHasReceivedRequest) {
        friendButtonText = "Aceitar Pedido"; 
    } 

    return (
        <main>
            <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, pb: 15 }}>
                
                {/* 1. HEADER */}
                <ProfileHeader 
                    user={profileUserData} 
                    onEditClick={isOwner ? handleEditProfile : null} 
                    onFriendsClick={isOwner ? handleViewFriends : null} 
                    isOwner={isOwner}
                    currentIsFriend={currentIsFriend}
                    onFriendAction={!isOwner ? handleToggleAction : null} 
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
                
                {/* 4. AMIGOS (CORREÇÃO DE isUser) */}
                <Box sx={{ mb: 4 }}>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'flex-start',
                            alignItems: 'center', 
                            mb: 2 
                        }}
                    >
                        <Box
                            onClick={isOwner ? handleViewFriends : null} 
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
                        {limitedDisplayedFriends.length > 0 ? (
                            limitedDisplayedFriends.map((friend) => (
                                <ArtistCircle
                                    key={friend.id}
                                    id={friend.id}
                                    image={friend.image || DEFAULT_USER_IMAGE}
                                    name={friend.name || friend.username || `Amigo ${friend.id}`} 
                                    onClick={() => handleFriendClick(friend.id)}
                                    sx={{ cursor: 'pointer' }}
                                    isUser={true}
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