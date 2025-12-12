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

// IMPORTANTE: Usar o serviço configurado para garantir acesso ao MongoDB
import mongoApi from '../../services/mongoApi.js';

const USER_API_URL = 'http://localhost:3000'; 
const DEFAULT_USER_IMAGE = 'https://placehold.co/400x400?text=User'; 

const fetchTargetUser = async (targetId) => {
    if (!targetId || targetId === 'undefined') {
        throw new Error('ID do usuário inválido ou ausente.');
    }
    try {
        const response = await fetch(`${USER_API_URL}/users/${targetId}`);
        if (!response.ok) throw new Error('Falha ao carregar dados do usuário alvo.');
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        return null; 
    }
};

// Função auxiliar para buscar listas (amigos, musicas) via ID
const fetchJsonOrEmptyArray = async (url) => {
    if (!url) return [];
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) return json.data;
        if (Array.isArray(json)) return json;
        return []; 
    } catch (error) {
        return [];
    }
};

export default function Perfil() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams(); 

    const userLogado = useSelector(state => state.user.user); 
    
    // Conexões (Amigos)
    const { 
        friends: loggedInFriends, 
        sentRequests: loggedInSentRequests,
        pendingRequests: loggedInPendingRequests,
        status: connectionsStatus
    } = useSelector((state) => state.connections);

    // Seletores do Redux para Artistas/Músicas (apenas para complementar dados)
    const followedArtistsRedux = useSelector(state => state.catalog?.artists?.items || state.catalog?.followedArtists || []); 
    const allSongsCatalog = useSelector(state => state.catalog?.songs?.items || []);
    const likedSongsIds = userLogado?.likedSongs || [];
    const likedSongsDetailsRedux = allSongsCatalog.filter(song => likedSongsIds.includes(song._id || song.id));

    // ESTADOS LOCAIS (Preenchidos diretamente do MongoDB)
    const [targetUser, setTargetUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [profilePlaylists, setProfilePlaylists] = useState([]); // Unificado!
    
    // Estados para visitante
    const [targetFriendsDetails, setTargetFriendsDetails] = useState([]);
    const [targetLikedSongsDetails, setTargetLikedSongsDetails] = useState([]);
    const [targetFollowedArtistsDetails, setTargetFollowedArtistsDetails] = useState([]);

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

    // --- CARREGAMENTO DE DADOS DO PERFIL ---
    useEffect(() => {
        if (!targetId) {
            setIsLoading(false);
            return;
        }

        const loadProfileData = async () => {
            setIsLoading(true);
            
            // 1. Identificar o Usuário
            let userData;
            if (isOwner) {
                userData = userLogado;
                // Dispara Redux para dados globais se necessário
                if (userLogado.following?.length) dispatch(fetchArtistsByIds(userLogado.following));
                if (userLogado.likedSongs?.length) dispatch(fetchSongsByIds(userLogado.likedSongs));
            } else {
                userData = await fetchTargetUser(targetId);
            }
            
            setTargetUser(userData);

            if (userData) {
                const userId = userData._id || userData.id;

                // 2. BUSCAR PLAYLISTS DO MONGODB (Para Dono E Visitante)
                // Isso garante que pegamos o que está no banco agora.
                try {
                    // Usa a query 'user' que bate com o campo no seu print do MongoDB
                    const playlistsRes = await mongoApi.get('/playlists', { 
                        params: { user: userId } 
                    });
                    
                    if (playlistsRes.data) {
                        setProfilePlaylists(playlistsRes.data);
                    }
                } catch (error) {
                    console.error("Erro ao buscar playlists do MongoDB:", error);
                }

                // 3. Buscar detalhes extras (Amigos/Musicas) se for visitante
                if (!isOwner) {
                    const friendsQuery = userData.friends?.length ? userData.friends.map(id => `id=${id}`).join('&') : null;
                    const songsQuery = userData.likedSongs?.length ? userData.likedSongs.map(id => `id=${id}`).join('&') : null;
                    const artistsQuery = userData.following?.length ? userData.following.map(id => `id=${id}`).join('&') : null;

                    try {
                        const [friendsDetails, songsDetails, artistsDetails] = await Promise.all([
                            friendsQuery ? fetchJsonOrEmptyArray(`${USER_API_URL}/users?${friendsQuery}`) : [],
                            songsQuery ? fetchJsonOrEmptyArray(`http://localhost:3000/songs?${songsQuery}`) : [], 
                            artistsQuery ? fetchJsonOrEmptyArray(`http://localhost:3000/artists?${artistsQuery}`) : []
                        ]);
                        
                        setTargetFriendsDetails(friendsDetails);
                        setTargetLikedSongsDetails(songsDetails);
                        setTargetFollowedArtistsDetails(artistsDetails);
                    } catch (err) { console.error(err); }
                }
            }
            setIsLoading(false);
        };
        
        loadProfileData();
    }, [targetId, isOwner, dispatch, userLogado]); 

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

    // --- RENDERIZAÇÃO ---
    
    // Normaliza as Playlists vindas do MongoDB
    const displayedPlaylists = profilePlaylists.map(p => ({
        id: p._id || p.id,
        // Banco tem 'img' (vaca) e 'cover' (vecteezy). Priorizamos cover.
        cover: p.cover || p.img || '/assets/img/vacateste.jpg',
        // Banco tem 'name' ("eu") e 'title' ("teste"). Priorizamos title.
        title: p.title || p.name || 'Sem Título',
        author: targetUser.name || targetUser.username
    }));

    const allFriends = isOwner ? loggedInFriends : targetFriendsDetails;
    const limitedDisplayedFriends = allFriends.slice(0, 6); 

    const likedSongsSource = isOwner ? likedSongsDetailsRedux : targetLikedSongsDetails;
    const displayedLikedSongs = Array.isArray(likedSongsSource) 
        ? likedSongsSource.filter(s => s && s.title).slice(0, 10)
        : [];
    
    const followedArtistsSource = isOwner ? followedArtistsRedux : targetFollowedArtistsDetails;
    const displayedFollowedArtists = Array.isArray(followedArtistsSource) ? followedArtistsSource : [];

    const totalFriendCount = isOwner ? loggedInFriends.length : targetUser.friends?.length || 0;
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
                
                {/* --- SEÇÃO PLAYLISTS (Agora pegando direto do MongoDB) --- */}
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
                                name={artist.name}
                            />
                        ))}
                    </Section>
                )}
                
                <div className="margin-bottom"></div>
            </Box>
        </main>
    );
}