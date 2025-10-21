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
    // CORREÇÃO: Renomeie 'albumId' na desestruturação para 'initialAlbumId'
    // A atribuição na linha 23 estava tentando modificar uma 'const'.
    const { title, duration = "3:20", artist, artistId, albumId: initialAlbumId, id: songId } = song;

    // Declare 'albumId' com 'let' para que possa ser modificada.
    let albumId = initialAlbumId; 
    
    if (albumId === null) {
        albumId = songId;
    }

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, userPlaylistsDetail } = useSelector(state => state.auth);

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

    // ... (Restante do código de handlers mantido)

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
                    currentLikedSongs: userLikedSongs,
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
        { icon: <AddIcon fontSize="small" />, label: 'Adicionar à playlist', action: handleAddPlaylistClick, requiresEvent: true }, 
        { icon: <PersonIcon fontSize="small" />, label: 'Ir para o artista', action: () => navigate(`/artista/${artistId}`) },
        { icon: <AlbumIcon fontSize="small" />, label: 'Ir para o álbum', action: () => {albumId ? navigate(`/album/${albumId}`) : navigate(`/song/${songId}`) } }, 
        { icon: <QueueIcon fontSize="small" />, label: 'Adicionar à fila', action: handleAddToQueue }, 
        { icon: <ShareIcon fontSize="small" />, label: 'Compartilhar', action: handleOpenShareModal },     
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
                        <Typography variant="body1" style={{ marginLeft: '8px' }}>{option.label}</Typography>
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
                <MenuItem disabled style={{ opacity: 1 }}>
                    <Typography variant="subtitle2" style={{ fontWeight: 'bold' }}>Adicionar a:</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => handleAddToSpecificPlaylist(LIKED_SONGS_ID, 'Músicas Curtidas')}>
                    <FavoriteIcon fontSize="small" style={{ marginRight: '8px', color: COR_LARANJA }} />
                    <Typography variant="body1">Músicas Curtidas</Typography>
                </MenuItem>
                
                <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #333' }} />

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
                
                <MenuItem onClick={handleCreatePlaylist} style={{ borderTop: '1px solid #333', marginTop: '4px' }}>
                    <AddIcon fontSize="small" style={{ marginRight: '8px' }} />
                    <Typography variant="body1" style={{ fontWeight: 'bold' }}>Criar playlist</Typography>
                </MenuItem>
            </Menu>

            <Dialog open={shareModalOpen} onClose={handleCloseShareModal}>
                <DialogTitle>
                    Compartilhar Música
                    <IconButton
                        aria-label="close"
                        onClick={handleCloseShareModal}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: (theme) => theme.palette.grey[500],
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Copie o link abaixo para compartilhar "{title}":</Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={`${window.location.origin}/song/${songId}`}
                        InputProps={{
                            readOnly: true,
                        }}
                        onFocus={(event) => event.target.select()}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCopyLink} variant="contained" style={{ backgroundColor: COR_LARANJA }}>
                        {copied ? 'Copiado!' : 'Copiar Link'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}