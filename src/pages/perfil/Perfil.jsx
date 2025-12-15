import React, { useEffect, useState } from 'react';
import { Box, Divider, Typography, CircularProgress } from '@mui/material'; 
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

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

import mongoApi from '../../services/mongoApi.js';

const DEFAULT_USER_IMAGE = 'https://placehold.co/400x400?text=User'; 

export default function Perfil() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); 

    const userLogado = useSelector(state => state.user.user); 
   
    const { 
        friends: loggedInFriends, 
        sentRequests: loggedInSentRequests,
        pendingRequests: loggedInPendingRequests,
        status: connectionsStatus
    } = useSelector((state) => state.connections);

    const [targetUser, setTargetUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const [profilePlaylists, setProfilePlaylists] = useState([]); 
    const [profileLikedSongs, setProfileLikedSongs] = useState([]); 
    const [profileFollowedArtists, setProfileFollowedArtists] = useState([]);
    const [profileFriends, setProfileFriends] = useState([]);

    const targetId = id || (userLogado ? String(userLogado.id || userLogado._id) : null);
    const isOwner = userLogado && targetId && String(userLogado.id || userLogado._id) === String(targetId);

    const targetUserIdStr = String(targetUser?._id || targetUser?.id);
    
    const currentIsFriend = loggedInFriends.some(f => String(f.id) === targetUserIdStr);
    const currentHasRequested = loggedInSentRequests.some(req => String(req.id) === targetUserIdStr);
    const currentHasReceivedRequest = loggedInPendingRequests.some(req => String(req.id) === targetUserIdStr);
   
    useEffect(() => {
        if (userLogado?.id || userLogado?._id) {
            const loggedId = String(userLogado.id || userLogado._id);
            if (connectionsStatus === 'idle' || connectionsStatus === 'failed') {
                dispatch(fetchConnectionsData(loggedId));
            }
        }
    }, [dispatch, userLogado, connectionsStatus]);

    useEffect(() => {
        if (!targetId) {
            setIsLoading(false);
            return;
        }

        const loadProfileData = async () => {
            setIsLoading(true);
            
            setProfilePlaylists([]);
            setProfileLikedSongs([]);
            setProfileFollowedArtists([]);
            setProfileFriends([]);

            try {
                let userData = null;
                try {
                    const resUser = await mongoApi.get(`/users/${targetId}`);
                    userData = resUser.data;
                } catch (error) {
                    console.error("Erro ao buscar usuário:", error);
                    if (isOwner) userData = userLogado;
                }

                if (!userData) {
                    setTargetUser(null);
                    setIsLoading(false);
                    return;
                }

                setTargetUser(userData);
                const userId = userData._id || userData.id;

                try {
                    const resPlaylists = await mongoApi.get('/playlists', { params: { user: userId } });
                    const rawPlaylists = resPlaylists.data || [];
                    
                    const filteredPlaylists = rawPlaylists.filter(p => {
                        const pUserId = p.user ? (p.user._id || p.user) : (p.owner?._id || p.owner);
                        return String(pUserId) === String(userId);
                    });
                    
                    setProfilePlaylists(filteredPlaylists);
                } catch (e) { console.error("Erro Playlists:", e); }


                if (userData.likedSongs && userData.likedSongs.length > 0) {
                    const idsQuery = userData.likedSongs.map(id => `id=${id}`).join('&');
                    try {
                        const resSongs = await mongoApi.get(`/songs?${idsQuery}`);
                        let songsData = Array.isArray(resSongs.data) ? resSongs.data : (resSongs.data?.data || []);
                        
                        songsData = songsData.filter(s => 
                            userData.likedSongs.includes(s._id) || userData.likedSongs.includes(s.id)
                        );
                        
                        setProfileLikedSongs(songsData);
                    } catch (e) { console.error("Erro Músicas:", e); }
                } 


                if (userData.following && userData.following.length > 0) {
                    const idsQuery = userData.following.map(id => `id=${id}`).join('&');
                    try {
                        const resArtists = await mongoApi.get(`/artists?${idsQuery}`);
                        let artistsData = Array.isArray(resArtists.data) ? resArtists.data : (resArtists.data?.data || []);
                        
                        artistsData = artistsData.filter(artist => 
                            userData.following.includes(artist._id) || userData.following.includes(artist.id)
                        );

                        setProfileFollowedArtists(artistsData);
                    } catch (e) { console.error("Erro Artistas:", e); }
                }


                if (!isOwner && userData.friends && userData.friends.length > 0) {
                    const idsQuery = userData.friends.map(id => `id=${id}`).join('&');
                    try {
                        const resFriends = await mongoApi.get(`/users?${idsQuery}`);
                        let friendsData = Array.isArray(resFriends.data) ? resFriends.data : (resFriends.data?.data || []);

                        friendsData = friendsData.filter(friend => 
                            userData.friends.includes(friend._id) || userData.friends.includes(friend.id)
                        );

                        setProfileFriends(friendsData);
                    } catch (e) { console.error("Erro Amigos:", e); }
                }

            } catch (error) {
                console.error("Erro crítico no perfil:", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadProfileData();
    }, [targetId, isOwner, userLogado]); 

    const handleToggleAction = async () => {
        if (!userLogado || !targetUser) return;
        const currentUserIdStr = String(userLogado.id || userLogado._id);
        const targetIdCorrect = String(targetUser._id || targetUser.id);
        const cleanTargetUser = { ...targetUser, id: targetIdCorrect, _id: targetIdCorrect };

        if (currentIsFriend) {
            dispatch(removeFriend({ currentUserId: currentUserIdStr, targetUserId: targetIdCorrect }));
        } else if (currentHasReceivedRequest) {
            dispatch(acceptFriendRequest({ accepterId: currentUserIdStr, requester: cleanTargetUser }));
        } else {
            dispatch(toggleFriendRequest({ currentUserId: currentUserIdStr, targetUser: cleanTargetUser }));
        }
    };

    const handleFriendClick = (id) => navigate(`/perfil/${id}`);
    const handleViewFriends = () => navigate('/conexoes'); 
    const handleEditProfile = () => navigate('/perfil/editar');
    
    if (isLoading) return <main><Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box></main>;
    if (!targetUser) return <main><Box sx={{ p: 4 }}><Typography color="error">Usuário não encontrado.</Typography></Box></main>;

    
    const displayedPlaylists = profilePlaylists.map(p => ({
        id: p._id || p.id,
        cover: p.cover || p.img || '/assets/img/vacateste.jpg',
        title: p.title || p.name || 'Sem Título',
        author: targetUser.name || targetUser.username
    }));

    const allFriends = isOwner ? loggedInFriends : profileFriends;
    
    const limitedDisplayedFriends = allFriends.slice(0, 6); 

    const displayedLikedSongs = profileLikedSongs
        .filter(s => s && (s.title || s.name)) 
        .slice(0, 10);
    
    const displayedFollowedArtists = profileFollowedArtists
        .filter(a => a && (a.name || a.username));

    const totalFriendCount = isOwner 
        ? loggedInFriends.length 
        : (targetUser.friends ? targetUser.friends.length : 0);

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
    
    let friendButtonText = "Adicionar";
    let friendButtonVariant = "contained";
    let isFriendButtonDisabled = false;
    let friendButtonCustomStyle = { bgcolor: 'var(--orange)', '&:hover': { bgcolor: 'darkorange' } };

    if (currentIsFriend) {
        friendButtonText = "Remover";
        friendButtonVariant = "outlined";
        friendButtonCustomStyle = { color: 'var(--text-primary)', borderColor: 'var(--text-primary)' };
    } else if (currentHasRequested) {
        friendButtonText = "Pendente";
        friendButtonVariant = "outlined";
        friendButtonCustomStyle = { color: 'var(--orange)', borderColor: 'var(--orange)' };
    } else if (currentHasReceivedRequest) {
        friendButtonText = "Aceitar"; 
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
                                author={playlist.author}
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
                                key={friend.id || friend._id}
                                id={friend.id || friend._id}
                                image={friend.img || friend.image || DEFAULT_USER_IMAGE} 
                                name={friend.name || friend.username || `Amigo`} 
                                onClick={() => handleFriendClick(friend.id || friend._id)}
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
                                key={artist.id || artist._id}
                                id={artist.id || artist._id}
                                image={artist.image || artist.cover || DEFAULT_USER_IMAGE} 
                                name={artist.name || artist.username || 'Artista'}
                            />
                        ))}
                    </Section>
                )}
                
                <div className="margin-bottom"></div>
            </Box>
        </main>
    );
}