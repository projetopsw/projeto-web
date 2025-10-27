// Song.jsx (CÓDIGO CORRIGIDO)

import React, { useState } from 'react';
import { Menu, MenuItem, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import AlbumIcon from '@mui/icons-material/Album';
import QueueIcon from '@mui/icons-material/Queue';
import ShareIcon from '@mui/icons-material/Share';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CloseIcon from '@mui/icons-material/Close';

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleLikeSongAsync, addSongToPlaylistAsync, fetchUserPlaylistsDetail } from '../redux/loginSlice';
import { playSong, togglePlayPause, addSingleSongToQueue } from '../redux/playerSlice';

const COR_LARANJA = 'var(--orange)';
const LIKED_SONGS_ID = "0";

export default function Song({ song }) {
    const { title, duration = "3:20", artist, artistId, albumId: initialAlbumId, id: songId } = song;

    let albumId = initialAlbumId; 
    
    if (albumId === null) {
        albumId = songId;
    }

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, userPlaylistsDetail } = useSelector(state => state.auth);

    // Agora só precisamos do user para checar se está logado e obter o ID
    const userLikedSongs = user?.likedSongs || [];
    const isLiked = userLikedSongs.includes(songId); 

    const { currentSong, isPlaying } = useSelector(state => state.player);
    const isThisSongCurrentlySelected = currentSong?.id === songId;
    const isThisSongPlaying = isThisSongCurrentlySelected && isPlaying;

    const [anchorEl, setAnchorEl] = useState(null);
    const [playlistAnchorEl, setPlaylistAnchorEl] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const aberto = Boolean(anchorEl);
    const playlistMenuAberto = Boolean(playlistAnchorEl);

    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    
    const handlePlaylistMenuClose = () => {
        setPlaylistAnchorEl(null);
        handleMenuClose();
    };
    
    const handleLikeClick = async (e) => {
        e.stopPropagation();
        if (user && user.id) {
            
            const wasLiked = isLiked;

            try {
                await dispatch(toggleLikeSongAsync({
                    userId: user.id,
                    songId: songId,
                    // REMOVIDO: currentLikedSongs não é mais necessário aqui
                })).unwrap();

                if (wasLiked) {
                    alert(`"${title}" foi removida das Músicas Curtidas.`);
                } else {
                    alert(`"${title}" foi curtida com sucesso!`);
                    // 👑 NOVO: Navega para a playlist de Músicas Curtidas
                    navigate(`/playlist/${LIKED_SONGS_ID}`);
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
    
    const handleAddPlaylistClick = (currentTarget) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setPlaylistAnchorEl(currentTarget); 
    };

    const handleAddToSpecificPlaylist = (playlistId, playlistName) => {
        if (!user) {
            navigate('/login');
            return;
        }
        
        dispatch(addSongToPlaylistAsync({
            userId: user.id,
            playlistId: playlistId,
            songId: songId
        })).unwrap().then(() => {
            alert(`"${title}" adicionada com sucesso à playlist "${playlistName}"!`);
        }).catch((error) => {
            console.error("Erro ao adicionar música à playlist:", error);
            alert(`Erro ao adicionar "${title}" à playlist "${playlistName}".`);
        });
        
        handlePlaylistMenuClose();
    };

    const handleCreatePlaylist = () => {
        handlePlaylistMenuClose();
        handleMenuClose();
        navigate('/playlists?openCreateModal=true'); 
    };

    const handleAddToQueue = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        dispatch(addSingleSongToQueue(song));
        alert(`"${title}" adicionada à fila.`);
    };

    const handleOpenShareModal = () => {
        setShareModalOpen(true);
        handleMenuClose(); 
    };

    const handleCloseShareModal = () => {
        setShareModalOpen(false);
        setCopied(false); 
    };

    const handleCopyLink = () => {
        const shareLink = `${window.location.origin}/song/${songId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
        }).catch(err => {
            console.error('Erro ao copiar o link: ', err);
            alert('Não foi possível copiar o link.');
        });
    };
    
    // Corrigido: Aplicando a cor secundária a todos os ícones
    const menuOptions = [
        { 
            icon: <AddIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Adicionar à playlist', 
            action: handleAddPlaylistClick, 
            requiresEvent: true 
        }, 
        { 
            icon: <PersonIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Ir para o artista', 
            action: () => { handleMenuClose(); navigate(`/artista/${artistId}`); } 
        },
        { 
            icon: <AlbumIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Ir para o álbum', 
            action: () => { handleMenuClose(); albumId ? navigate(`/album/${albumId}`) : navigate(`/song/${songId}`) } 
        }, 
        { 
            icon: <QueueIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Adicionar à fila', 
            action: handleAddToQueue 
        }, 
        { 
            icon: <ShareIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Compartilhar', 
            action: handleOpenShareModal 
        },    
    ];

    const corIcone = isLiked ? COR_LARANJA : 'var(--secondary-text-color)';
    
    return (
        <>
            <div className="song flex">
                <div className="song-detail flex">
                
                    <div onClick={handlePlayPauseClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {isThisSongPlaying ? (
                            <PauseIcon
                                style={{ color: COR_LARANJA }} 
                                onMouseEnter={(e) => (e.target.style.color = COR_LARANJA)}
                                onMouseLeave={(e) => (e.target.style.color = COR_LARANJA)}
                            />
                        ) : (
                            <PlayArrowIcon
                                onMouseEnter={(e) => (e.target.style.color = COR_LARANJA)}
                                onMouseLeave={(e) => (e.target.style.color = 'white')} />
                        )}
                    </div>

                    <div className="song-info flex" style={{ marginLeft: '15px' }}>
                        <span
                            className="song-title"
                            style={{ color: isThisSongCurrentlySelected ? COR_LARANJA : 'white' }}
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

            {/* MENU PRINCIPAL DE OPÇÕES */}
            <Menu
                id="song-options-menu"
                anchorEl={anchorEl}
                open={aberto}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        backgroundColor: 'var(--sidebar-bg)',
                        color: 'var(--text-color)',
                    }
                }}
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
                        sx={{ 
                            color: 'var(--text-color)',
                            '&:hover': { 
                                backgroundColor: 'var(--button-hover-bg)' 
                            }, 
                        }}
                    >
                        {option.icon}
                        <Typography variant="body1" sx={{ ml: '8px' }}>{option.label}</Typography>
                    </MenuItem>
                ))}
            </Menu>

            {/* MENU DE SELEÇÃO DE PLAYLISTS */}
            <Menu
                id="playlist-selection-menu"
                anchorEl={playlistAnchorEl}
                open={playlistMenuAberto}
                onClose={handlePlaylistMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                PaperProps={{
                    sx: {
                        backgroundColor: 'var(--sidebar-bg)',
                        color: 'var(--text-color)',
                        '& .MuiMenuItem-root': {
                            color: 'var(--text-color)',
                            '&:hover': {
                                backgroundColor: 'var(--button-hover-bg)', 
                            }
                        }
                    }
                }}
            >
                <MenuItem disabled style={{ opacity: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'var(--secondary-text-color)' }}>Adicionar a:</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => handleAddToSpecificPlaylist(LIKED_SONGS_ID, 'Músicas Curtidas')}>
                    <FavoriteIcon fontSize="small" style={{ marginRight: '8px', color: COR_LARANJA }} />
                    <Typography variant="body1">Músicas Curtidas</Typography>
                </MenuItem>
                
                <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border-color)' }} />

                {userPlaylistsDetail && userPlaylistsDetail
                    .filter(p => p.id !== LIKED_SONGS_ID)
                    .map((playlist) => (
                        <MenuItem
                            key={playlist.id}
                            onClick={() => handleAddToSpecificPlaylist(playlist.id, playlist.name)}
                        >
                            <Typography variant="body1">{playlist.name}</Typography>
                        </MenuItem>
                ))}
                
                <MenuItem onClick={handleCreatePlaylist} sx={{ borderTop: '1px solid var(--border-color)', mt: '4px' }}>
                    <AddIcon fontSize="small" sx={{ mr: '8px', color: 'var(--secondary-text-color)' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Criar playlist</Typography>
                </MenuItem>
            </Menu>

            {/* DIALOG DE COMPARTILHAMENTO */}
            <Dialog open={shareModalOpen} onClose={handleCloseShareModal} 
                PaperProps={{
                    sx: {
                        backgroundColor: 'var(--card-bg)',
                        color: 'var(--text-color)',
                    }
                }}
            >
                <DialogTitle sx={{ color: 'var(--text-color)' }}>
                    Compartilhar Música
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseShareModal}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'var(--secondary-text-color)',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom sx={{ color: 'var(--text-color)' }}>Copie o link abaixo para compartilhar "{title}":</Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={`${window.location.origin}/song/${songId}`}
                        sx={{ 
                            '& .MuiInputBase-input': { color: 'var(--input-text-color)' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: 'var(--border-color)' },
                                '&:hover fieldset': { borderColor: 'var(--orange)' },
                                '&.Mui-focused fieldset': { borderColor: 'var(--orange)' },
                                backgroundColor: 'var(--input-bg)'
                            }
                        }}
                        InputProps={{
                            readOnly: true,
                        }}
                        onFocus={(event) => event.target.select()}
                    />
                </DialogContent>
                <DialogActions sx={{ p: '16px' }}>
                    <Button onClick={handleCopyLink} variant="contained" 
                        sx={{ 
                            backgroundColor: COR_LARANJA, 
                            '&:hover': { 
                                backgroundColor: 'var(--darker-orange)',
                            } 
                        }}
                    >
                        {copied ? 'Copiado!' : 'Copiar Link'}
                    </Button>
                </DialogActions>
            </Dialog>
</>
)
}