import React, { useState, useEffect } from 'react';
import { 
    Menu, MenuItem, Typography, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, TextField, IconButton 
} from '@mui/material';
import { 
    FavoriteBorder as FavoriteBorderIcon, 
    Favorite as FavoriteIcon, 
    Add as AddIcon, 
    Person as PersonIcon, 
    Album as AlbumIcon, 
    Queue as QueueIcon, 
    Share as ShareIcon, 
    PlayArrow as PlayArrowIcon, 
    Pause as PauseIcon, 
    Close as CloseIcon, 
    Delete as DeleteIcon, 
    Edit as EditIcon 
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    toggleLikeSongAsync, 
    addSongToPlaylistAsync, 
    fetchUserPlaylistsDetail 
} from '../redux/loginSlice';
import { playSong, togglePlayPause, addSingleSongToQueue } from '../redux/playerSlice';
import mongoApi from '../services/mongoApi';
import DeleteConfirmationModal from './DeleteMusica.jsx';
import EditMusicaModal from './EditMusica.jsx'; 

const COR_LARANJA = 'var(--orange)';
const LIKED_SONGS_ID = "0";

// Função para formatar tempo
const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "0:00";
    if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

// --- NOVO: Função para detectar se é um código de banco de dados (ObjectId) ---
const isObjectId = (text) => {
    // Verifica se é uma string de 24 caracteres hexadecimais (0-9, a-f)
    return typeof text === 'string' && /^[0-9a-fA-F]{24}$/.test(text);
};

export default function Song({ song }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const songId = song._id || song.id;
    const title = song.title || "Sem título";

    // --- Lógica de Artista BLINDADA ---
    let artistDisplay = "Desconhecido";
    let mainArtistId = null;

    // 1. Array de Objetos (Melhor cenário: [{name: 'X'}])
    if (Array.isArray(song.artists) && song.artists.length > 0) {
        // Filtra para pegar apenas nomes válidos (ignora IDs no meio do array)
        const validNames = song.artists
            .map(a => (typeof a === 'string' ? a : a.name))
            .filter(name => !isObjectId(name)); // Remove IDs

        if (validNames.length > 0) {
            artistDisplay = validNames.join(', ');
        }
        
        // Tenta pegar o ID do primeiro artista para navegação
        const firstArtist = song.artists[0];
        mainArtistId = typeof firstArtist === 'object' ? (firstArtist._id || firstArtist.id) : firstArtist;
    } 
    // 2. Objeto Único ({name: 'X'})
    else if (song.artist && typeof song.artist === 'object') {
        artistDisplay = song.artist.name || "Desconhecido";
        mainArtistId = song.artist._id || song.artist.id;
    } 
    // 3. String (Aqui estava o problema!)
    else if (typeof song.artist === 'string') {
        // Só exibe se NÃO for um código de banco de dados
        if (!isObjectId(song.artist)) {
            artistDisplay = song.artist;
        }
        // Se for um ID, mantemos "Desconhecido" (melhor que mostrar código)
        
        mainArtistId = song.artistId || null;
    }

    // --- Lógica de Álbum ---
    let albumId = null;
    let isSingle = false; 

    if (song.album && typeof song.album === 'object') {
        albumId = song.album._id || song.album.id;
        const type = song.album.type || song.album.album_type || "";
        if (type.toLowerCase() === 'single') isSingle = true;
    } else if (song.albumId) {
        albumId = song.albumId;
    }
    if (song.albumType && song.albumType.toLowerCase() === 'single') isSingle = true;

    const durationDisplay = formatTime(song.duration);

    // --- Redux e Like ---
    const user = useSelector(state => state.user?.user) || useSelector(state => state.auth?.user);
    const isAdmin = user?.role === 'admin'; 
    const userPlaylistsDetail = useSelector(state => state.auth?.userPlaylistsDetail || []);
    const { currentSong, isPlaying } = useSelector(state => state.player);

    // Lógica robusta de Like
    const likedPlaylist = userPlaylistsDetail.find(p => p.id === LIKED_SONGS_ID);
    const likedSongsList = likedPlaylist ? likedPlaylist.songs : (user?.likedSongs || []);
    const songIdStr = String(songId);

    const isLikedRedux = Array.isArray(likedSongsList) && likedSongsList.some(item => {
        if (!item) return false;
        const itemId = typeof item === 'object' ? (item._id || item.id) : item;
        return String(itemId) === songIdStr;
    });

    const [localIsLiked, setLocalIsLiked] = useState(isLikedRedux);

    useEffect(() => {
        setLocalIsLiked(isLikedRedux);
    }, [isLikedRedux]);

    const isThisSongCurrentlySelected = (currentSong?._id === songId) || (currentSong?.id === songId);
    const isThisSongPlaying = isThisSongCurrentlySelected && isPlaying;

    // --- UI States ---
    const [anchorEl, setAnchorEl] = useState(null);
    const [playlistAnchorEl, setPlaylistAnchorEl] = useState(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); 
    const [copied, setCopied] = useState(false);
    
    const aberto = Boolean(anchorEl);
    const playlistMenuAberto = Boolean(playlistAnchorEl);
    const canManage = isAdmin; 

    // --- HANDLERS ---
    const handleMenuClose = () => setAnchorEl(null);
    const handlePlaylistMenuClose = () => { setPlaylistAnchorEl(null); handleMenuClose(); };
    
    const handleLikeClick = async (e) => {
        e.stopPropagation();
        if (!user || (!user.id && !user._id)) { navigate('/login'); return; }

        const previousState = localIsLiked;
        setLocalIsLiked(!previousState);

        try {
            await dispatch(toggleLikeSongAsync({ songId })).unwrap();
            if (user.id || user._id) {
                dispatch(fetchUserPlaylistsDetail(user.id || user._id));
            }
        } catch (error) {
            setLocalIsLiked(previousState);
            alert("Erro ao curtir música.");
        }
    }

    const handleDeleteSong = async () => {
        if (!songId) return;
        try {
            await mongoApi.delete(`/songs/${songId}`); 
            alert(`Música "${title}" deletada com sucesso!`); 
            window.location.reload(); 
        } catch (error) {
            alert('Falha ao deletar a música.');
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleUpdateSuccess = () => {
        window.location.reload(); 
        setShowEditModal(false);
    }

    const handlePlayPauseClick = (e) => {
        e.stopPropagation();
        if (isThisSongCurrentlySelected) dispatch(togglePlayPause());
        else dispatch(playSong(song));
    };

    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        if (user && (user.id || user._id) && userPlaylistsDetail.length === 0) {
            dispatch(fetchUserPlaylistsDetail(user.id || user._id));
        }
    };
    
    const handleAddPlaylistClick = (currentTarget) => {
        if (!user) { navigate('/login'); return; }
        setPlaylistAnchorEl(currentTarget); 
    };

    const handleAddToSpecificPlaylist = async (playlistId, playlistName) => {
        if (!user) { navigate('/login'); return; }

        if (playlistId === LIKED_SONGS_ID) {
            handleLikeClick({ stopPropagation: () => {} });
            handlePlaylistMenuClose();
            return;
        }
        
        try {
            const result = await dispatch(addSongToPlaylistAsync({
                playlistId,
                songId
            })).unwrap();

            alert(result.message || `"${title}" adicionada à playlist "${playlistName}"!`);
            
            if (user.id || user._id) dispatch(fetchUserPlaylistsDetail(user.id || user._id));

        } catch (error) {
            alert(typeof error === 'string' ? error : "Erro ao adicionar música à playlist.");
        }
        
        handlePlaylistMenuClose();
    };

    const handleCreatePlaylist = () => {
        handlePlaylistMenuClose();
        handleMenuClose();
        navigate('/playlists?openCreateModal=true'); 
    };

    const handleAddToQueue = () => {
        dispatch(addSingleSongToQueue(song));
    };

    const handleOpenShareModal = () => { setShareModalOpen(true); handleMenuClose(); };
    const handleCloseShareModal = () => { setShareModalOpen(false); setCopied(false); };

    const handleCopyLink = () => {
        const shareLink = `${window.location.origin}/song/${songId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
        }).catch(err => alert('Não foi possível copiar o link.'));
    };

    const menuOptions = [
        { 
            icon: <AddIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Adicionar à playlist', 
            action: handleAddPlaylistClick, 
            requiresEvent: true 
        }, 
        ...(mainArtistId && !isObjectId(mainArtistId) ? [{  // Proteção extra aqui também
            icon: <PersonIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Ir para o artista', 
            action: () => { handleMenuClose(); navigate(`/artista/${mainArtistId}`); } 
        }] : []),
        ...(albumId && !isSingle ? [{ 
            icon: <AlbumIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />, 
            label: 'Ir para o álbum', 
            action: () => { handleMenuClose(); navigate(`/album/${albumId}`) } 
        }] : []), 
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
        ...(canManage ? [
            { 
                icon: <EditIcon fontSize="small" sx={{ color: COR_LARANJA }} />, 
                label: 'Editar Música', 
                action: () => { handleMenuClose(); setShowEditModal(true); } 
            },
            { 
                icon: <DeleteIcon fontSize="small" sx={{ color: 'red' }} />, 
                label: 'Deletar Música', 
                action: () => { handleMenuClose(); setShowDeleteModal(true); } 
            },
        ] : [])
    ];

    const corIcone = localIsLiked ? COR_LARANJA : 'var(--secondary-text-color)';
    
    return (
        <>
            <div className="song flex">
                <div className="song-detail flex">
                    <div onClick={handlePlayPauseClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        {isThisSongPlaying ? (
                            <PauseIcon style={{ color: COR_LARANJA }} />
                        ) : (
                            <PlayArrowIcon className="play-hover" sx={{color:'white', '&:hover':{color:COR_LARANJA}}} />
                        )}
                    </div>

                    <div className="song-info flex" style={{ marginLeft: '15px' }}>
                        <span className="song-title" style={{ color: isThisSongCurrentlySelected ? COR_LARANJA : 'white' }}>{title}</span>
                        {artistDisplay != "Desconhecido" && <span className="song-artist">{artistDisplay}</span>}
                    </div>
                </div>
                <div className="song-detail flex">
                    <div className="icon" onClick={handleLikeClick} style={{ cursor: 'pointer', color: corIcone }}>
                        {localIsLiked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                    </div>
                    <span className="song-duration">{durationDisplay}</span>
                    <i className="icon fa-solid fa-ellipsis" onClick={handleMenuClick} style={{ cursor: 'pointer', color: 'var(--secondary-text-color)' }}></i>
                </div>
            </div>
            
            {/* Menus e Modais continuam iguais abaixo */}
            <Menu
                id="song-options-menu"
                anchorEl={anchorEl}
                open={aberto}
                onClose={handleMenuClose}
                PaperProps={{ sx: { backgroundColor: 'var(--sidebar-bg)', color: 'var(--text-color)' } }}
            >
                {menuOptions.map((option) => (
                    <MenuItem
                        key={option.label}
                        onClick={(e) => {
                            if (option.requiresEvent) option.action(e.currentTarget);
                            else { option.action(); if (option.label !== 'Adicionar à playlist') handleMenuClose(); }
                        }}
                        sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}
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
                PaperProps={{ sx: { backgroundColor: 'var(--sidebar-bg)', color: 'var(--text-color)' } }}
            >
                <MenuItem disabled style={{ opacity: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'var(--secondary-text-color)' }}>Adicionar a:</Typography>
                </MenuItem>
                
                <MenuItem onClick={() => handleAddToSpecificPlaylist(LIKED_SONGS_ID, 'Músicas Curtidas')}>
                    <FavoriteIcon fontSize="small" style={{ marginRight: '8px', color: COR_LARANJA }} />
                    <Typography variant="body1">Músicas Curtidas</Typography>
                </MenuItem>
                
                <div style={{ margin: '4px 0', borderTop: '1px solid var(--border-color)' }}></div>

                {userPlaylistsDetail && userPlaylistsDetail
                    .filter(p => p.id !== LIKED_SONGS_ID)
                    .map((playlist) => (
                        <MenuItem
                            key={playlist.id || playlist._id}
                            onClick={() => handleAddToSpecificPlaylist(playlist.id || playlist._id, playlist.name)}
                        >
                            <Typography variant="body1">{playlist.name}</Typography>
                        </MenuItem>
                ))}
                
                <MenuItem onClick={handleCreatePlaylist} sx={{ borderTop: '1px solid var(--border-color)', mt: '4px' }}>
                    <AddIcon fontSize="small" sx={{ mr: '8px', color: 'var(--secondary-text-color)' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Criar playlist</Typography>
                </MenuItem>
            </Menu>

            <Dialog open={shareModalOpen} onClose={handleCloseShareModal} PaperProps={{ sx: { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                <DialogTitle sx={{ color: 'var(--text-color)' }}>
                    Compartilhar Música
                    <IconButton onClick={handleCloseShareModal} sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--secondary-text-color)' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom sx={{ color: 'var(--text-color)' }}>Link para compartilhar "{title}":</Typography>
                    <TextField fullWidth variant="outlined" value={`${window.location.origin}/song/${songId}`} sx={{ '& .MuiInputBase-input': { color: 'var(--input-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, backgroundColor: 'var(--input-bg)' } }} InputProps={{ readOnly: true }} onFocus={(event) => event.target.select()} />
                </DialogContent>
                <DialogActions sx={{ p: '16px' }}>
                    <Button onClick={handleCopyLink} variant="contained" sx={{ backgroundColor: COR_LARANJA }}>{copied ? 'Copiado!' : 'Copiar Link'}</Button>
                </DialogActions>
            </Dialog>

            <DeleteConfirmationModal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteSong} itemTitle={title} />
            
            {song && <EditMusicaModal show={showEditModal} onClose={() => setShowEditModal(false)} song={song} onUpdateSuccess={handleUpdateSuccess} />}
        </>
    )
}