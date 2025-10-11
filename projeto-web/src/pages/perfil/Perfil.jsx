import React, { useEffect, useState, useMemo } from 'react';
import { Box, Divider, Typography, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { setUserData } from '../../redux/userSlice';
import { fetchPlaylistsByUserId } from '../../redux/playlistsSlice';
import { fetchArtistsByIds, fetchSongsByIds } from '../../redux/catalogoSlice';
import { fetchUsersByIds } from '../../redux/loginSlice';

import Section from '../../components/Section.jsx';
import PlaylistCard from '../../components/PlaylistCard.jsx';
import ArtistCircle from '../../components/ArtistCircle.jsx';
import ProfileHeader from '../../components/ProfileHeader';
import SongList from '../../components/SongList';

const CURRENT_USER_ID = '1';
const API_URL = 'http://localhost:3001';

export default function Perfil() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const user = useSelector(state => state.user.user);
    
    const [isLoading, setIsLoading] = useState(true);

    const { items: friendDetails } = useSelector(state => state.auth.friends);
    const { items: userPlaylists } = useSelector(state => state.playlists.userPlaylists);
    const { items: followedArtists } = useSelector(state => state.catalog.followedArtists);
    const { items: likedSongsDetails } = useSelector(state => state.catalog.likedSongsDetails);

    const handleFriendClick = (id) => {
        navigate(`/perfil/${id}`);
    };

    const handleViewFriends = () => {
        navigate('/conexoes');
    };

    const handleEditProfile = () => {
        navigate('/perfil/editar');
    };

    useEffect(() => {
        const fetchAndSetUser = async () => {
            try {
                const response = await fetch(`${API_URL}/users/${CURRENT_USER_ID}`);
                if (!response.ok) throw new Error('Falha ao carregar dados do usuário.');
                const userData = await response.json();
                
                dispatch(setUserData(userData));
                
            } catch (error) {
                console.error("Erro ao buscar usuário na Perfil Page:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            setIsLoading(false);
        } else {
            fetchAndSetUser();
        }
    }, [user, dispatch]);

    useEffect(() => {
        if (user && user.id) {
            dispatch(fetchPlaylistsByUserId(user.id));

            if (user.following?.length > 0) {
                dispatch(fetchArtistsByIds(user.following));
            }
            
            if (user.likedSongs?.length > 0) {
                dispatch(fetchSongsByIds(user.likedSongs));
            }
            
            if (user.friends?.length > 0) {
                dispatch(fetchUsersByIds(user.friends));
            }
        }
    }, [user, dispatch]);

    if (isLoading) {
        return <main><h1>Carregando perfil...</h1></main>;
    }

    if (!user) {
        return <main><Typography color="error">Não foi possível carregar os dados do perfil.</Typography></main>;
    }

    const profileUserData = {
        ...user,
        username: user.name || user.username,
        playlists: userPlaylists.length,
        friends: user.friends?.length || 0,
        following: user.following || []
    };

    return (
        <main>
            <Box sx={{ p: { xs: 2, md: 4, lg: 6 }, pb: 15 }}>
                <ProfileHeader 
                    user={profileUserData} 
                    onEditClick={handleEditProfile} 
                    onFriendsClick={handleViewFriends} 
                />
                <Divider sx={{ my: 4 }} />
                
                <SongList 
                    tituloDaSecao={"Suas Músicas Mais Mugidas"} 
                    tracksArr={likedSongsDetails}
                />
                
                <Divider sx={{ my: 4 }} />
                
                <Section key={"Suas Playlists"} title={"Suas Playlists"}>
                    {userPlaylists.map((playlist) => (
                        <PlaylistCard
                            key={playlist.id}
                            id={playlist.id}
                            cover={playlist.cover}
                            title={playlist.title}
                            artist={user.name}
                        />
                    ))}
                </Section>
                
                <Divider sx={{ my: 4 }} />
                
                <Box sx={{ mb: 4 }}>
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            mb: 2 
                        }}
                    >
                        <Box
                            onClick={handleViewFriends}
                            sx={{ 
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                            }}
                        >
                            <Typography variant="h5" sx={{ color: 'var(--text-primary)' }}>
                                Peões Amigos ({user.friends?.length || 0})
                            </Typography>
                        </Box>

                        <Button 
                            variant="text" 
                            sx={{ color: 'var(--orange)', '&:hover': { background: 'none' } }}
                            onClick={handleViewFriends}
                        >
                            Ver todos e Sugestões
                        </Button>
                    </Box>
                    
                    <Box sx={{ display: 'flex', overflowX: 'auto', gap: 2 }}>
                        {friendDetails.map((friend) => (
                            <ArtistCircle
                                key={friend.id}
                                id={friend.id}
                                image={friend.image || 'https://placehold.co/400x400?text=User'}
                                name={friend.name}
                                onClick={() => handleFriendClick(friend.id)}
                            />
                        ))}
                    </Box>
                </Box>

                <Divider sx={{ my: 4 }} />

                <Section key={"Artistas Seguidos"} title={"Artistas Seguidos"}>
                    {followedArtists.map((artist) => (
                        <ArtistCircle
                            key={artist.id}
                            id={artist.id}
                            image={artist.image}
                            name={artist.name}
                        />
                    ))}
                </Section>
                
                <div className="margin-bottom"></div>
            </Box>
        </main>
    );
}