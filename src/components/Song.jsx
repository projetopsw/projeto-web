import React, { useState, useEffect } from 'react';
import { 
    Menu, MenuItem, Typography, Dialog, DialogTitle, DialogContent, 
    DialogActions, Button, TextField, IconButton, List, ListItem, 
    ListItemAvatar, Avatar, ListItemText, Divider 
} from '@mui/material'; // Adicionei List, ListItem, etc.
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
    Edit as EditIcon,
    Search as SearchIcon, // Novo ícone
    Audiotrack as AudiotrackIcon // Novo ícone para playlist sem capa
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

// ... (Mantenha as funções formatTime e isObjectId iguais) ...
const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "0:00";
    if (typeof seconds === 'string' && seconds.includes(':')) return seconds;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

const isObjectId = (text) => {
    return typeof text === 'string' && /^[0-9a-fA-F]{24}$/.test(text);
};

export default function Song({ song }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const songId = song._id || song.id;
    const title = song.title || "Sem título";

    // ... (Mantenha toda a lógica de Artista e Álbum igual) ...
    let artistDisplay = "Desconhecido";
    let mainArtistId = null;

    if (Array.isArray(song.artists) && song.artists.length > 0) {
        const validNames = song.artists
            .map(a => (typeof a === 'string' ? a : a.name))
            .filter(name => !isObjectId(name)); 

        if (validNames.length > 0) artistDisplay = validNames.join(', ');
        const firstArtist = song.artists[0];
        mainArtistId = typeof firstArtist === 'object' ? (firstArtist._id || firstArtist.id) : firstArtist;
    } else if (song.artist && typeof song.artist === 'object') {
        artistDisplay = song.artist.name || "Desconhecido";
        mainArtistId = song.artist._id || song.artist.id;
    } else if (typeof song.artist === 'string') {
        if (!isObjectId(song.artist)) artistDisplay = song.artist;
        mainArtistId = song.artistId || null;
    }

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
    
    // NOVO: Controle do Modal de Playlist
    const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
    const [playlistSearchTerm, setPlaylistSearchTerm] = useState("");

    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); 
    const [copied, setCopied] = useState(false);
    
    const aberto = Boolean(anchorEl);
    const canManage = isAdmin; 

    // --- HANDLERS ---
    const handleMenuClose = () => setAnchorEl(null);
    
    // Novo Handler para fechar o modal de playlist
    const handlePlaylistModalClose = () => {
        setPlaylistModalOpen(false);
        setPlaylistSearchTerm("");
    };

    const handleLikeClick = async (e) => {
        e?.stopPropagation();
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
        // Garante que as playlists estejam carregadas ao abrir o menu
        if (user && (user.id || user._id)) {
            dispatch(fetchUserPlaylistsDetail(user.id || user._id));
        }
    };
    
    // ALTERADO: Agora abre o Modal em vez do submenu
    const handleOpenPlaylistModal = () => {
        if (!user) { navigate('/login'); return; }
        setPlaylistModalOpen(true);
        handleMenuClose();
    };

    const handleAddToSpecificPlaylist = async (playlistId, playlistName) => {
        if (!user) { navigate('/login'); return; }

        if (playlistId === LIKED_SONGS_ID) {
            handleLikeClick(); // Chama a função de like existente
            handlePlaylistModalClose();
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
        
        handlePlaylistModalClose();
    };

    const handleCreatePlaylist = () => {
        handlePlaylistModalClose();
        handleMenuClose();
        navigate('/playlists?openCreateModal=true'); 
    };

    const handleAddToQueue = () => {
        dispatch(addSingleSongToQueue(song));
        handleMenuClose(); // Fechar menu ao clicar
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
            action: handleOpenPlaylistModal, // Alterado para abrir o modal
            requiresEvent: false 
        }, 
        ...(mainArtistId && !isObjectId(mainArtistId) ? [{ 
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

    // Filtra as playlists com base na busca
    // Filtra as playlists com base na busca (COM PROTEÇÃO CONTRA ERRO)
    const filteredPlaylists = userPlaylistsDetail
        .filter(p => p.id !== LIKED_SONGS_ID)
        .filter(p => {
            // 1. Tenta pegar o nome, se não tiver, tenta o título, se não, string vazia
            const playlistName = p.name || p.title || ""; 
            
            // 2. Só faz a busca se tivermos um texto válido
            if (typeof playlistName === 'string') {
                return playlistName.toLowerCase().includes(playlistSearchTerm.toLowerCase());
            }
            return false;
        });
    
    return (
        <>
            <div className="song flex">
                {/* ... (Parte visual da música mantida igual) ... */}
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
            
            {/* Menu Principal (Opções) */}
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
                            else option.action(); 
                        }}
                        sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}
                    >
                        {option.icon}
                        <Typography variant="body1" sx={{ ml: '8px' }}>{option.label}</Typography>
                    </MenuItem>
                ))}
            </Menu>

            {/* --- NOVO MODAL DE SELEÇÃO DE PLAYLIST --- */}
            <Dialog 
                open={playlistModalOpen} 
                onClose={handlePlaylistModalClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{ 
                    sx: { 
                        backgroundColor: 'var(--card-bg)', 
                        color: 'var(--text-color)',
                        borderRadius: '12px'
                    } 
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    Adicionar à playlist
                    <IconButton onClick={handlePlaylistModalClose} sx={{ color: 'var(--secondary-text-color)' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ mt: 2, p: 0 }}>
                    {/* Campo de Busca */}
                    <div style={{ padding: '16px' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Buscar playlist..."
                            value={playlistSearchTerm}
                            onChange={(e) => setPlaylistSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: 'var(--secondary-text-color)', mr: 1 }} />,
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-color)',
                                    '& fieldset': { borderColor: 'var(--border-color)' },
                                    '&:hover fieldset': { borderColor: COR_LARANJA },
                                    '&.Mui-focused fieldset': { borderColor: COR_LARANJA },
                                }
                            }}
                        />
                    </div>

                    <List sx={{ width: '100%', pt: 0, pb: 0, maxHeight: '400px', overflowY: 'auto' }}>
                        {/* Opção Nova Playlist */}
                        <ListItem button onClick={handleCreatePlaylist} sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'transparent', border: '1px solid var(--secondary-text-color)' }}>
                                    <AddIcon sx={{ color: 'var(--text-color)' }} />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Nova Playlist" />
                        </ListItem>

                        {/* Opção Músicas Curtidas */}
                        <ListItem button onClick={() => handleAddToSpecificPlaylist(LIKED_SONGS_ID, 'Músicas Curtidas')} sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}>
                            <ListItemAvatar>
                                <Avatar sx={{ bgcolor: 'transparent' /*ou um gradiente roxo*/ }}>
                                    <FavoriteIcon sx={{ color: COR_LARANJA }} />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText primary="Músicas Curtidas" />
                        </ListItem>

                        <Divider sx={{ backgroundColor: 'var(--border-color)' }} />

                        {filteredPlaylists.length > 0 ? (
                            filteredPlaylists.map((playlist) => {
                                const displayName = playlist.name || playlist.title || "Playlist sem nome";
                                
                                return (
                                    <ListItem 
                                        button 
                                        key={playlist.id || playlist._id} 
                                        onClick={() => handleAddToSpecificPlaylist(playlist.id || playlist._id, displayName)}
                                        sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar 
                                                src={playlist.img || playlist.cover} 
                                                variant="square" 
                                                sx={{ borderRadius: '4px', bgcolor: 'var(--sidebar-bg)' }}
                                            >
                                                <AudiotrackIcon /> 
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText 
                                            primary={displayName} 
                                            secondary={`${playlist.songCount || (playlist.songs ? playlist.songs.length : 0)} músicas`}
                                            primaryTypographyProps={{ style: { color: 'var(--text-color)' } }}
                                            secondaryTypographyProps={{ style: { color: 'var(--secondary-text-color)' } }}
                                        />
                                    </ListItem>
                                );
                            })
                        ) : (
                            <Typography sx={{ p: 2, textAlign: 'center', color: 'var(--secondary-text-color)' }}>
                                Nenhuma playlist encontrada.
                            </Typography>
                        )}
                    </List>
                </DialogContent>
            </Dialog>

            <Dialog open={shareModalOpen} onClose={handleCloseShareModal} PaperProps={{ sx: { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
               {/* (Modal de compartilhar mantido igual) */}
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