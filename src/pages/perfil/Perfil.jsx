import React, { useEffect, useState } from 'react';
import { Box, Divider, Typography, CircularProgress, Button } from '@mui/material'; 
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { fetchPlaylistsByUserId } from '../../redux/playlistsSlice.js';
import { fetchArtistsByIds, fetchSongsByIds } from '../../redux/catalogoSlice.js';

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

const API_URL = 'http://localhost:3001';
const DEFAULT_USER_IMAGE = 'https://placehold.co/400x400?text=User'; 

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
    const isOwner = userLogado && targetId && String(userLogado.id) === targetId;

    const friendDetailsRedux = loggedInFriends; 
    const { items: userPlaylistsRedux } = useSelector(state => state.playlists?.userPlaylists || { items: [] });
    const { items: followedArtistsRedux } = useSelector(state => state.catalog?.followedArtists || { items: [] });
    const { items: likedSongsDetailsRedux } = useSelector(state => state.catalog?.likedSongsDetails || { items: [] });

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
            
            let userToDisplay = await fetchTargetUser(targetId);
            
            if (isOwner && userLogado) {
                 userToDisplay = {...userToDisplay, ...userLogado, ...userToDisplay};
            }
            
            if (userToDisplay) {
                setTargetUser(userToDisplay);

                if (isOwner) {
                    dispatch(fetchPlaylistsByUserId(userToDisplay.id));
                    dispatch(fetchArtistsByIds(userToDisplay.following || []));
                    dispatch(fetchSongsByIds(userToDisplay.likedSongs || []));
                    dispatch(fetchConnectionsData(userToDisplay.id));
                } else {
                    const fetchDetailsForFriend = async (user) => {
                        const [playlists, friendsDetails, songsDetails, artistsDetails] = await Promise.all([
                            fetch(`${API_URL}/userPlaylists?creatorId=${user.id}`).then(res => res.ok ? res.json() : []), 
                            user.friends?.length ? fetch(`${API_URL}/users?${user.friends.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : [],
                            user.likedSongs?.length ? fetch(`${API_URL}/songs?${user.likedSongs.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : [], 
                            user.following?.length ? fetch(`${API_URL}/artists?${user.following.map(id => `id=${id}`).join('&')}`).then(res => res.json()) : []
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
        userLogado, 
        loggedInFriends.length, 
        loggedInSentRequests.length, 
        loggedInPendingRequests.length
    ]); 


    const handleToggleAction = async () => {
        if (!userLogado || !targetUser) return;
        
        if (currentIsFriend) {
            dispatch(removeFriend({ currentUserId: userLogado.id, targetUserId: targetUser.id }));
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

    if (!targetUser) {
        return <main><Box sx={{ p: 4 }}><Typography color="error">Perfil do usuário **{targetId}** não encontrado. 😢</Typography></Box></main>;
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