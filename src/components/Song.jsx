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
import api from '../services/api'; 

const COR_LARANJA = 'var(--orange)';
const LIKED_SONGS_ID = "0";

const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "0:00";
    if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function Song({ song }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const songId = song._id || song.id;

    const title = song.title || "Sem título";

    let artistDisplay = "Desconhecido";
    let mainArtistId = null;

    if (song.artists && Array.isArray(song.artists) && song.artists.length > 0) {
        artistDisplay = song.artists.map(a => a.name).join(', ');
        mainArtistId = song.artists[0]._id || song.artists[0].id;
    } else if (song.artist) {
        artistDisplay = typeof song.artist === 'string' ? song.artist : song.artist.name;
        mainArtistId = song.artistId || (song.artist._id);
    }

    const albumId = song.album?._id || song.album?.id || song.albumId || songId; 

    const durationDisplay = formatTime(song.duration);

    const { user, userPlaylistsDetail } = useSelector(state => state.auth);

    const userLikedSongs = user?.likedSongs || [];
    const isLiked = userLikedSongs.includes(songId); 

    const { currentSong, isPlaying } = useSelector(state => state.player);
    const isThisSongCurrentlySelected = (currentSong?._id === songId) || (currentSong?.id === songId);
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
        
        if (!user || !user.id) {
            navigate('/login');
            return;
        }

        const wasLiked = isLiked; 

        try {
            await dispatch(toggleLikeSongAsync({
                userId: user.id,
                songId: songId,
                currentLikedSongs: userLikedSongs,
            })).unwrap();

            if (!wasLiked) {
                
                try {
                    const prefResponse = await api.post('/users/like', { songId: songId });
                    
                    if (prefResponse.data.analyzed) {
                        alert(`Parabéns! Suas preferências musicais foram analisadas e salvas!`);
                    } else if (prefResponse.data.count) {
                        alert(`Like registrado. Faltam ${5 - prefResponse.data.count} para a análise de preferências.`);
                    } else {
                         alert(`"${title}" foi curtida com sucesso!`);
                    }
                } catch (prefError) {
                    console.warn("Aviso: Falha na análise de preferências. Continuando com o like padrão.");
                    alert(`"${title}" foi curtida com sucesso!`);
                }
                
            } else {
                alert(`"${title}" foi removida das Músicas Curtidas.`);
            }

        } catch (error) {
            console.error("Erro ao curtir/descurtir música:", error);
            alert("Erro ao processar sua curtida. Tente novamente.");
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
            action: () => { handleMenuClose(); navigate(`/artista/${mainArtistId}`); } 
        },
        { 
            icon: <AlbumIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Ir para o álbum', 
            action: () => { handleMenuClose(); navigate(`/album/${albumId}`) } 
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
                        <span className="song-artist">{artistDisplay}</span>
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
                    <span className="song-duration">{durationDisplay}</span>
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