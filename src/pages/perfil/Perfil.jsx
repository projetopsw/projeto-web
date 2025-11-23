import React, { useEffect, useState } from 'react';
import { Box, Divider, Typography, CircularProgress } from '@mui/material'; 
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchPlaylistsByUserId } from '../../redux/playlistsSlice.js';
import { fetchArtistsByIds, fetchSongsByIds } from '../../redux/catalogoSlice.js';
import { updateProfile } from '../../redux/userSlice.js';

import { 
    toggleFriendRequest, 
    acceptFriendRequest,
    removeFriend,
    fetchConnectionsData
} from '../../redux/connectionsSlice.js';

import Section from '../../components/Section.jsx'; 
import PlaylistCard from '../../components/PlaylistCard.jsx';
import ArtistCircle from '../../components/ArtistCircle.jsx';
import ProfileHeader from '../../components/ProfileHeader.jsx'; 
import SongList from '../../components/SongList.jsx';

const DATA_API_URL = 'http://localhost:3001'; 
const USER_API_URL = 'http://localhost:3000'; 
const DEFAULT_USER_IMAGE = 'https://placehold.co/400x400?text=User'; 

const fetchTargetUser = async (targetId) => {
    try {
        const response = await fetch(`${USER_API_URL}/users/${targetId}`);
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
    
    // 🔍 LOG 1: O que o Redux está fornecendo em CADA renderização
    console.log("🔄 RENDER (Perfil.jsx): userLogado (Redux) atual:", userLogado);

    const { 
        friends: loggedInFriends, 
        sentRequests: loggedInSentRequests,
        pendingRequests: loggedInPendingRequests
    } = useSelector((state) => state.connections);

    const [targetUser, setTargetUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [targetPlaylists, setTargetPlaylists] = useState([]);
    const [targetFriendsDetails, setTargetFriendsDetails] = useState([]);
    const [targetLikedSongsDetails, setTargetLikedSongsDetails] = useState([]);
    const [targetFollowedArtistsDetails, setTargetFollowedArtistsDetails] = useState([]);

    const targetId = id || (userLogado ? String(userLogado.id) : null);
    const isOwner = userLogado && targetId && String(userLogado.id) === String(targetId);

    const friendDetailsRedux = loggedInFriends; 
    const { items: userPlaylistsRedux } = useSelector(state => state.playlists?.userPlaylists || { items: [] });
    const { items: followedArtistsRedux } = useSelector(state => state.catalog?.followedArtists || { items: [] });
    const { items: likedSongsDetailsRedux } = useSelector(state => state.catalog?.likedSongsDetails || { items: [] });

    const targetUserIdStr = String(targetUser?._id || targetUser?.id);
    
    const currentIsFriend = loggedInFriends.some(f => String(f.id) === targetUserIdStr);
    const currentHasRequested = loggedInSentRequests.some(req => String(req.id) === targetUserIdStr);
    const currentHasReceivedRequest = loggedInPendingRequests.some(req => String(req.id) === targetUserIdStr);
    
    useEffect(() => {
        // 🔍 LOG 2: O useEffect foi acionado
        console.log("🔥 USE_EFFECT (Perfil.jsx): Disparou a lógica de carregamento.");
        console.log("   isOwner:", isOwner, " | userLogado.name:", userLogado?.name);


        if (!targetId) {
            setIsLoading(false);
            return;
        }

        const loadProfileData = async () => {
            setIsLoading(true);
            
            let finalUserData;

            if (isOwner) {
                // Se dono, usa o objeto atualizado do Redux
                console.log("   MODO DONO: Usando dados do Redux (userLogado).");
                finalUserData = userLogado;
            } else {
                // Se terceiro, busca da API
                console.log("   MODO TERCEIRO: Buscando da API.");
                finalUserData = await fetchTargetUser(targetId);
            }
            
            if (finalUserData) {
                
                // 🔍 LOG 3: Dados que serão usados para setar o estado local
                console.log("   DADOS FINAIS para setTargetUser:", { 
                    id: finalUserData.id, 
                    name: finalUserData.name || finalUserData.username, 
                    img: finalUserData.img || finalUserData.image 
                });

                setTargetUser(finalUserData);
                
                const userIdToUse = finalUserData._id || finalUserData.id; 

                if (isOwner) {
                    dispatch(fetchPlaylistsByUserId(userIdToUse));
                    dispatch(fetchArtistsByIds(finalUserData.following || []));
                    dispatch(fetchSongsByIds(finalUserData.likedSongs || []));
                    dispatch(fetchConnectionsData(userIdToUse));
                } else {
                    const fetchDetailsForFriend = async (user) => {
                    const [playlists, friendsDetails, songsDetails, artistsDetails] = await Promise.all([

                        fetch(`${DATA_API_URL}/userPlaylists?creatorId=${user.id}`).then(res => res.ok ? res.json() : []), 
                        
                        user.friends?.length ? fetch(`${USER_API_URL}/users?${user.friends.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : [],
            
                        user.likedSongs?.length ? fetch(`${DATA_API_URL}/songs?${user.likedSongs.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : [], 
                        
                        user.following?.length ? fetch(`${DATA_API_URL}/artists?${user.following.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : []
                    ]);
                    setTargetPlaylists(playlists.filter(p => p)); 
                    setTargetFriendsDetails(friendsDetails.filter(f => f));
                    setTargetLikedSongsDetails(songsDetails.filter(s => s));
                    setTargetFollowedArtistsDetails(artistsDetails.filter(a => a));
                }
                fetchDetailsForFriend(finalUserData);
            }
        }else {
            setTargetUser(null);
        }
        
        setIsLoading(false);
        };
        loadProfileData();
    }, [
        targetId, 
        isOwner, 
        dispatch, 
        userLogado?.id,
        userLogado?.name, 
        userLogado?.img,
        loggedInFriends.length, 
        loggedInSentRequests.length, 
        loggedInPendingRequests.length
    ]); 


    const handleToggleAction = async () => {
        if (!userLogado || !targetUser) return;
        
        const targetIdCorrect = targetUser._id || targetUser.id;

        if (currentIsFriend) {
            dispatch(removeFriend({ currentUserId: userLogado.id, targetUserId: targetIdCorrect }));
            alert(`Você removeu ${targetUser.name || targetUser.username} de seus amigos.`);
        } else if (currentHasReceivedRequest) {
            dispatch(acceptFriendRequest({ accepterId: userLogado.id, requester: targetUser }));
            alert(`Você aceitou o pedido de ${targetUser.name || targetUser.username}!`);
        } else {
            const isPending = currentHasRequested; 
            dispatch(toggleFriendRequest({ currentUserId: userLogado.id, targetUser }));
            alert(isPending 
                ? `Pedido para ${targetUser.name || targetUser.username} cancelado.`
                : `Pedido para ${targetUser.name || targetUser.username} enviado!`);
        }
    };

    const handleFriendClick = (id) => navigate(`/perfil/${id}`);
    const handleViewFriends = () => navigate('/conexoes'); 
    const handleEditProfile = () => navigate('/perfil/editar');
    
    if (isLoading) {
        return <main><Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box></main>;
    }
    
    // 🔍 LOG 4: Valor do targetUser no momento da renderização (após load)
    console.log("🔄 RENDER (Perfil.jsx): targetUser (Estado Local) atual:", targetUser ? { name: targetUser.name, img: targetUser.img } : "Ainda não definido");

    if (!targetUser) {
        return <main><Box sx={{ p: 4 }}><Typography color="error">Perfil do usuário não encontrado. 😢</Typography></Box></main>;
    }

    const displayedPlaylists = isOwner ? userPlaylistsRedux : targetPlaylists;
    const allFriends = isOwner ? friendDetailsRedux : targetFriendsDetails;
    const limitedDisplayedFriends = allFriends.slice(0, 6); 

    const displayedLikedSongs = isOwner ? likedSongsDetailsRedux : targetLikedSongsDetails;
    const displayedFollowedArtists = isOwner ? followedArtistsRedux : targetFollowedArtistsDetails;


    const totalFriendCount = targetUser.friends?.length || 0;
    
    const finalImage = targetUser.img || targetUser.image || DEFAULT_USER_IMAGE;
    
    const profileUserData = {
        ...targetUser,
        username: targetUser.name || targetUser.username,
        playlists: displayedPlaylists.length,
        friends: totalFriendCount, 
        following: targetUser.following || [],
        img: finalImage,
        image: finalImage 
    };
    
    let friendButtonText = "Adicionar aos Amigos";
    let friendButtonVariant = "contained";
    let isFriendButtonDisabled = false;
    let friendButtonCustomStyle = {};

    if (currentIsFriend) {
        friendButtonText = "Remover Amigo";
        friendButtonVariant = "outlined";
        friendButtonCustomStyle = { color: 'var(--text-primary)', borderColor: 'var(--text-primary)' };

    } else if (currentHasRequested) {
        friendButtonText = "CANCELAR SOLICITAÇÃO";
        friendButtonVariant = "outlined";
        isFriendButtonDisabled = false;
        
        friendButtonCustomStyle = { 
            color: 'var(--orange)', 
            borderColor: 'var(--orange)',
            '&:hover': {
                borderColor: 'var(--orange)', 
                backgroundColor: 'rgba(255, 102, 0, 0.08)'
            }
        };
        
    } else if (currentHasReceivedRequest) {
        friendButtonText = "Aceitar Pedido"; 
        friendButtonVariant = "contained";
        friendButtonCustomStyle = { bgcolor: 'var(--orange)', '&:hover': { bgcolor: 'darkorange' } };
        
    } else {
        friendButtonCustomStyle = { bgcolor: 'var(--orange)', '&:hover': { bgcolor: 'darkorange' } };
    }

    return (
        <main>
            <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, pb: 15 }}>
                
                <ProfileHeader 
                    user={profileUserData} 
                    onEditClick={isOwner ? handleEditProfile : null} 
                    onFriendsClick={isOwner ? handleViewFriends : null} 
                    isOwner={isOwner}
                    onFriendAction={!isOwner ? handleToggleAction : null} 
                    friendActionText={friendButtonText}
                    friendButtonVariant={friendButtonVariant}
                    isFriendActionDisabled={isFriendButtonDisabled}
                    friendButtonCustomStyle={friendButtonCustomStyle} 
                />
                
                <Divider sx={{ my: 4 }} />
                
                {displayedLikedSongs.length > 0 && (
                    <>
                        <SongList 
                            tituloDaSecao={isOwner ? "Suas Músicas Mais Mugidas" : `Músicas Mugidas de ${targetUser.name || targetUser.username}`} 
                            tracksArr={displayedLikedSongs}
                        />
                        <Divider sx={{ my: 4 }} />
                    </>
                )}
                
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
                        <Typography sx={{ color: 'var(--secondary-text-color)', pl: '1rem' }}>
                            {targetUser.name || targetUser.username} não criou nenhuma playlist.
                        </Typography>
                    )}
                </Section>
                
                <Divider sx={{ my: 4 }} />
                
                <Section
                    key={"Amigos"}
                    title={`Peões Amigos (${totalFriendCount})`}
                    onClick={isOwner ? handleViewFriends : null}
                    viewAllText="Ver todos" 
                >
                    {limitedDisplayedFriends.length > 0 ? (
                        limitedDisplayedFriends.map((friend) => (
                            <ArtistCircle
                                key={friend.id}
                                id={friend.id}
                                image={friend.img || friend.image || DEFAULT_USER_IMAGE} 
                                name={friend.name || friend.username || `Amigo ${friend.id}`} 
                                onClick={() => handleFriendClick(friend.id)}
                                sx={{ cursor: 'pointer' }}
                                isUser={true} 
                            />
                        ))
                    ) : (
                        <Typography sx={{ color: 'var(--secondary-text-color)', pl: '1rem' }}>
                            Este usuário ainda não tem amigos exibíveis.
                        </Typography>
                    )}
                </Section>

                <Divider sx={{ my: 4 }} />

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