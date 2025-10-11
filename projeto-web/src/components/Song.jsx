import React, { useState } from 'react';
import { Menu, MenuItem, Typography } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import AlbumIcon from '@mui/icons-material/Album';
import QueueIcon from '@mui/icons-material/Queue';
import ShareIcon from '@mui/icons-material/Share';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleLikeSongAsync, addSongToPlaylistAsync, fetchUserPlaylistsDetail } from '../redux/loginSlice';
import { playSong, togglePlayPause } from '../redux/playerSliceBebel';

const COR_LARANJA = 'var(--orange)';
const LIKED_SONGS_ID = "0";

export default function Song({ song }) {
    const { title, duration = "3:20", artist, artistId, albumId, id: songId } = song;
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, userPlaylistsDetail } = useSelector(state => state.auth);

    // 💡 LENDO user.likedSongs diretamente do objeto user (que é sincronizado pelo Redux)
    const userLikedSongs = user?.likedSongs || [];
    const isLiked = userLikedSongs.includes(songId); 

    const { currentSong, isPlaying } = useSelector(state => state.player);
    const isThisSongCurrentlySelected = currentSong?.id === songId;
    const isThisSongPlaying = isThisSongCurrentlySelected && isPlaying;

    const [anchorEl, setAnchorEl] = useState(null);
    const [playlistAnchorEl, setPlaylistAnchorEl] = useState(null);
    
    const aberto = Boolean(anchorEl);
    const playlistMenuAberto = Boolean(playlistAnchorEl);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    
    const handlePlaylistMenuClose = () => {
        setPlaylistAnchorEl(null);
    };
    
    const handleLikeClick = async (e) => {
        e.stopPropagation();
        if (user && user.id) {
            
            const wasLiked = isLiked;

            try {
                // 💡 CORREÇÃO: Passando todos os argumentos que a thunk espera
                await dispatch(toggleLikeSongAsync({
                    userId: user.id,
                    songId: songId,
                    currentLikedSongs: userLikedSongs, // Passando o array atual do Redux
                })).unwrap();

                if (wasLiked) {
                    alert(`"${title}" foi removida das Músicas Curtidas.`);
                } else {
                    alert(`"${title}" foi curtida com sucesso e adicionada às Músicas Curtidas!`);
                }

            } catch (error) {
                console.error("Erro ao curtir/descurtir música:", error);
                alert("Erro ao processar sua curtida. Tente novamente.");
            }

        } else {
            navigate('/login');
        }
    }

    const handlePlayPauseClick = (e) => {
        e.stopPropagation();
        if (isThisSongCurrentlySelected) {
            dispatch(togglePlayPause());
        } else {
            dispatch(playSong(song));
        }
    };

    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        if (user && user.id) {
            dispatch(fetchUserPlaylistsDetail(user.id));
        }
    };
    
    // Ação que abre o menu de seleção de playlists
    const handleAddPlaylistClick = (event) => {
        if (!user) {
            navigate('/login');
            return;
        }
        // Fecha o menu principal ANTES de abrir o secundário.
        setAnchorEl(null); 
        // Define o novo âncora para o menu de playlists
        setPlaylistAnchorEl(event); 
    };

    const handleAddToSpecificPlaylist = (playlistId, playlistTitle) => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        dispatch(addSongToPlaylistAsync({
            userId: user.id,
            playlistId: playlistId,
            songId: songId
        }));
        
        handlePlaylistMenuClose();
    };

    const handleCreatePlaylist = () => {
        handlePlaylistMenuClose();
        navigate('/playlists?openCreateModal=true');
    };
    
    const menuOptions = [
        { icon: <AddIcon fontSize="small" />, label: 'Adicionar à playlist', action: (e) => handleAddPlaylistClick(e.currentTarget), requiresEvent: true },
        { icon: <PersonIcon fontSize="small" />, label: 'Ir para o artista', action: () => navigate(`/artista/${artistId}`) },
        { icon: <AlbumIcon fontSize="small" />, label: 'Ir para o álbum', action: () => navigate(`/song/${songId}`) },
        { icon: <QueueIcon fontSize="small" />, label: 'Adicionar à fila', action: () => console.log(`Adicionar ${title}`) },
        { icon: <ShareIcon fontSize="small" />, label: 'Compartilhar', action: () => console.log(`Compartilhar ${title}`) },
    ];
    
    const corIcone = isLiked ? COR_LARANJA : 'var(--secondary-text-color)';
    
    return (
        <>
            <div className="song flex">
                <div className="song-detail flex">
                
                    <div onClick={handlePlayPauseClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {isThisSongPlaying ? (
                            <PauseIcon
                                onMouseEnter={(e) => (e.target.style.color = COR_LARANJA)}
                                onMouseLeave={(e) => (e.target.style.color = 'white')}/>
                        ) : (
                            <PlayArrowIcon
                                onMouseEnter={(e) => (e.target.style.color = COR_LARANJA)}
                                onMouseLeave={(e) => (e.target.style.color = 'white')} />
                        )}
                    </div>

                    <div className="song-info flex" style={{ marginLeft: '15px' }}>
                        <span
                            className="song-title"
                            >{title}</span>
                        <span className="song-artist">{artist}</span>
                    </div>
                </div>
                <div className="song-detail flex">
                    <div
                        className="icon"
                        onClick={handleLikeClick}
                        style={{ cursor: 'pointer', color: corIcone }}
                    >
                        {isLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                    </div>
                    <span className="song-duration">{duration}</span>
                    <i
                        className="icon fa-solid fa-ellipsis"
                        onClick={handleMenuClick}
                        style={{ cursor: 'pointer', color: 'var(--secondary-text-color)' }}
                    ></i>
                </div>
            </div>

            <Menu
                id="song-options-menu"
                anchorEl={anchorEl}
                open={aberto}
                onClose={handleMenuClose}
            >
                {menuOptions.map((option) => (
                    <MenuItem
                        key={option.label}
                        onClick={(e) => {
                            if (option.requiresEvent) {
                                option.action(e.currentTarget);
                            } else {
                                option.action();
                                handleMenuClose();
                            }
                        }}
                    >
                        {option.icon}
                        <Typography variant="body1">{option.label}</Typography>
                    </MenuItem>
                ))}
            </Menu>

            <Menu
                id="playlist-selection-menu"
                anchorEl={playlistAnchorEl}
                open={playlistMenuAberto}
                onClose={handlePlaylistMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem disabled>
                    <Typography variant="subtitle2" style={{ fontWeight: 'bold' }}>Adicionar a:</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => handleAddToSpecificPlaylist(LIKED_SONGS_ID, 'Músicas Curtidas')}>
                    <FavoriteIcon fontSize="small" style={{ marginRight: '8px', color: COR_LARANJA }} />
                    <Typography variant="body1">Músicas Curtidas</Typography>
                </MenuItem>
                
                <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #333' }} />

                {userPlaylistsDetail
                    .filter(p => p.id !== LIKED_SONGS_ID)
                    .map((playlist) => (
                        <MenuItem
                            key={playlist.id}
                            onClick={() => handleAddToSpecificPlaylist(playlist.id, playlist.name)}
                        >
                            <Typography variant="body1">{playlist.name}</Typography>
                        </MenuItem>
                ))}
                
                <MenuItem onClick={handleCreatePlaylist} style={{ borderTop: '1px solid #333', marginTop: '4px' }}>
                    <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
                    <Typography variant="body1" style={{ fontWeight: 'bold' }}>Criar playlist</Typography>
                </MenuItem>
            </Menu>
        </>
    )
}