// src/pages/PlaylistDetalhe.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Modal, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    IconButton, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    styled,
    Switch, 
    FormControlLabel,
    Menu,
    MenuItem,
    Divider,
} from '@mui/material';
// ... (Ícones e drag and drop imports) ...
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ShareIcon from '@mui/icons-material/Share';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSelector, useDispatch } from 'react-redux';
import { setQueue, togglePlayPause } from '../../redux/playerSlice';
import { fetchUserPlaylistsDetail } from '../../redux/loginSlice';
import api from '../../services/api';

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';
const LIKED_SONGS_COVER = '/assets/img/liked_cover_0.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/vibe_cover_2.png';

const ModalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'var(--sidebar-bg)',
    border: '2px solid var(--orange)',
    borderRadius: '8px',
    boxShadow: 24,
    p: 4,
    color: 'var(--text-color)',
};

const PlaylistHeaderContainer = styled(Box)(({ theme }) => ({
    display: 'flex', alignItems: 'flex-end', gap: '30px', marginBottom: '40px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px',
    ['@media (max-width:960px)']: { flexDirection: 'column', alignItems: 'flex-start' },
}));

const PlayButton = styled(IconButton)(({ theme }) => ({
    width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--orange)', color: 'white', fontSize: '26px', boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': { transform: 'scale(1.1)', backgroundColor: 'var(--darker-orange)', boxShadow: '0 6px 20px rgba(255, 107, 0, 0.7)' },
}));

const ActionIcon = styled(IconButton)(({ theme }) => ({
    color: INACTIVE_ICON_COLOR, width: '40px', height: '40px', transition: 'color 0.2s ease',
    '&:hover': { color: 'var(--text-color)', backgroundColor: 'transparent' },
}));

const SortContainer = styled(Box)(({ theme }) => ({
    display: 'flex', 
    alignItems: 'center', 
    marginLeft: 'auto',
    gap: '10px'
}));

const SortButton = styled(Button)(({ theme }) => ({
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '6px 16px',
    textTransform: 'none',
    fontSize: '0.9rem',
    backgroundColor: 'var(--input-bg)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--secondary-text-color)'
    }
}));

const sortOptions = {
    custom: 'Ordem personalizada',
    title: 'Título (A-Z)',
    album: 'Álbum (A-Z)', 
    artist: 'Artista (A-Z)',
    added: 'Adicionado em (Mais Recente)'
};

const sortSongs = (songs, key) => {
    if (key === 'custom') {
        return songs;
    }

    const sorted = [...songs].sort((a, b) => {
        let valA = a[key] || '';
        let valB = b[key] || '';

        let comparison = String(valA).localeCompare(String(valB), 'pt', { sensitivity: 'base' });

        if (key === 'added') {
            return comparison * -1;
        }
        
        return comparison;
    });

    return sorted;
};

const calculateTotalDuration = (songs) => {
    return `${songs.length} músicas`; 
};


function PlaylistDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { currentSong, isPlaying } = useSelector(state => state.player);
    const userPlaylistsDetail = useSelector(state => state.auth.userPlaylistsDetail || []);
    const user = useSelector(state => state.user?.user);
    const USER_ID = user?._id || user?.id || '';
    const likedSongsFromRedux = userPlaylistsDetail.find(p => p.id === '0')?.songs || [];
    const userPlaylists = userPlaylistsDetail;
    const playlistsStatus = useSelector(state => state.auth.playlistsStatus);

    const [playlistDetails, setPlaylistDetails] = useState(null);
    const [localSongs, setLocalSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredSongId, setHoveredSongId] = useState(null);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editImg, setEditImg] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(false); 
    
    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const [sortKey, setSortKey] = useState('custom');

    const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
    const optionsMenuOpen = Boolean(optionsAnchorEl);

    const [songOptionsAnchorEl, setSongOptionsAnchorEl] = useState(null); 
    const [songOptionsSong, setSongOptionsSong] = useState(null); 
    const songOptionsMenuOpen = Boolean(songOptionsAnchorEl);

    const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);
    
    const fetchPlaylistData = async () => {
        setIsLoading(true);
        try {
            if (id === '0') {
                if (playlistsStatus !== 'succeeded') {
                    setIsLoading(true);
                    return;
                }

                let songs = [];
                if (likedSongsFromRedux && likedSongsFromRedux.length > 0) {
                    const songsPromises = likedSongsFromRedux.map(songId => api.get(`/songs/${songId}`));
                    const results = await Promise.allSettled(songsPromises);
                    songs = results
                        .filter(r => r.status === 'fulfilled')
                        .map(r => r.value.data);
                }
                
                const likedPlaylistData = {
                    id: '0',
                    name: 'Músicas Curtidas',
                    description: 'Todas as músicas que você curtiu.',
                    img: LIKED_SONGS_COVER,
                    isPublic: false,
                    creator: 'Você',
                    creatorId: USER_ID,
                    songCount: songs.length,
                    duration: calculateTotalDuration(songs),
                };
                
                setPlaylistDetails(likedPlaylistData);
                setLocalSongs(sortSongs(songs, sortKey));
                setIsLoading(false);
                return;
            }

            // BUSCAR DETALHES DA PLAYLIST NO BACKEND
            const playlistResponse = await api.get(`/playlists/${id}`);
            let playlistData = playlistResponse.data;
            
            let songIds = playlistData.songs || [];
            let songs = [];
            
            // Verifica se as músicas já vieram populadas
            if (songIds.length > 0 && typeof songIds[0] === 'object' && songIds[0].title) {
                 songs = songIds;
            } else { // Caso contrário, buscamos os detalhes de cada ID
                const songsPromises = songIds.map(songId => api.get(`/songs/${songId}`));
                const results = await Promise.allSettled(songsPromises);
                songs = results
                    .filter(r => r.status === 'fulfilled')
                    .map(r => r.value.data);
            }
            
            // --- MAPEAMENTO BACKEND (title, cover) para FRONTEND (name, img) ---
            const updatedPlaylist = {
                ...playlistData,
                name: playlistData.title, 
                img: playlistData.cover, 
                creator: playlistData.user?.username || 'Você', 
                creatorId: playlistData.user?._id || playlistData.user?.id || USER_ID,
                songCount: songs.length,
                duration: calculateTotalDuration(songs),
                isPublic: playlistData.isPublic
            }
            
            setPlaylistDetails(updatedPlaylist);
            setLocalSongs(sortSongs(songs, sortKey));
            
            // Inicializa os estados de EDIÇÃO
            setEditName(updatedPlaylist.name);
            setEditDescription(updatedPlaylist.description || '');
            setEditImg(updatedPlaylist.img || DEFAULT_PLAYLIST_COVER); // Inicializa com a URL atual (ou fallback)
            setEditIsPublic(updatedPlaylist.isPublic || false); 

        } catch (error) {
            console.error(`Erro ao carregar detalhes da playlist (ID: ${id}):`, error);
            setPlaylistDetails(null); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylistData();
    }, [id, likedSongsFromRedux.length, playlistsStatus]); 

    useEffect(() => {
        if (id === '0' && USER_ID) {
            if (playlistsStatus !== 'succeeded') {
                try { dispatch(fetchUserPlaylistsDetail(USER_ID)); } catch {}
            }
        }
    }, [id, USER_ID, playlistsStatus, dispatch]); 
    
    useEffect(() => {
        setLocalSongs(prevSongs => sortSongs(prevSongs, sortKey));
    }, [sortKey]); 

    const handleSortClick = (event) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortClose = () => {
        setSortAnchorEl(null);
    };

    const handleSortSelect = (key) => {
        setSortKey(key); 
        handleSortClose();
    };
    
    const handleOpenEditModal = () => setIsEditModalOpen(true);
    const handleCloseEditModal = () => setIsEditModalOpen(false);
    
    // --- FUNÇÃO CRUCIAL 1: UPDATE (EDIÇÃO COM LINK EXTERNO) ---
    const handleUpdatePlaylist = async (e) => {
        e.preventDefault();
        const newTitle = editName.trim(); 

        if (!newTitle) {
             alert("O título é obrigatório.");
             return;
        }

        if (newTitle && id !== "0") {
            const updatedData = {
                // Mapeamento: FRONTEND (editName) -> BACKEND (title)
                title: newTitle, 
                description: editDescription,
                // Mapeamento: FRONTEND (editImg - URL) -> BACKEND (cover)
                cover: editImg, 
                isPublic: editIsPublic
            };

            try {
                // Chamada PATCH (envia JSON com a URL da imagem)
                const response = await api.patch(`/playlists/${id}`, updatedData);
                
                // Recarrega os dados completos após o sucesso para atualizar a UI
                fetchPlaylistData();
                handleCloseEditModal();
                alert("Playlist atualizada com sucesso!");
            } catch (error) {
                console.error("Erro ao atualizar playlist:", error.response || error);
                alert(`Não foi possível atualizar a playlist. Erro: ${error.response?.data?.message || error.message}`);
            }
        }
    };
    
    // --- FUNÇÃO CRUCIAL 2: DELETE (EXCLUSÃO) ---
    const handleDeletePlaylist = async () => {
        handleOptionsClose();
        if (id === "0") return;
        
        if (window.confirm(`Tem certeza que deseja excluir a playlist "${playlistDetails.name}"? Esta ação é irreversível.`)) {
            try {
                await api.delete(`/playlists/${id}`);

                // Navega para a página de listagem após o sucesso
                navigate('/playlists'); 
            } catch (error) {
                console.error("Erro ao excluir playlist:", error.response || error);
                alert(`Não foi possível excluir a playlist. Erro: ${error.response?.data?.message || "Acesso negado ou erro no servidor."}`);
            }
        }
    };

    // --- Outros Handlers (MANTIDOS) ---
    const handleOptionsClick = (event) => { setOptionsAnchorEl(event.currentTarget); };
    const handleOptionsClose = () => { setOptionsAnchorEl(null); };
    const handleSharePlaylist = () => { /* ... */ };
    const handleOpenAddToPlaylistModal = () => { /* ... */ };
    const handleCloseAddToPlaylistModal = () => setIsAddToPlaylistModalOpen(false);
    const handleAddSongToPlaylist = async (targetPlaylistId) => { /* ... */ };
    const availablePlaylists = userPlaylists.filter(p => p.id !== '0' && p.id !== id);
    const handleSongOptionsClick = (event, song) => { /* ... */ };
    const handleSongOptionsClose = () => { setSongOptionsAnchorEl(null); setSongOptionsSong(null); };
    const handleRemoveSong = async () => { /* ... */ };
    const handleShareSong = () => { /* ... */ };
    const handleOpenAddSongToPlaylistModal = () => { /* ... */ };

    if (isLoading) {
        return (
            <main className="content-area" style={{paddingTop: '50px'}}>
                <Typography variant="h4" sx={{color: 'var(--text-color)'}}>Carregando...</Typography>
            </main>
        );
    }
    
    if (!playlistDetails) {
        return (
            <main className="content-area" style={{paddingTop: '50px'}}>
                <Typography variant="h4" color="error">Playlist Não Encontrada! (ID: {id})</Typography>
            </main>
        );
    }

    const isThisPlaylistPlaying = isPlaying && localSongs.some(song => song.id === currentSong?.id);
    const isCustomPlaylist = id !== "0"; 
    const isOwner = playlistDetails.creatorId === USER_ID;

    const handlePlaylistPlay = () => { /* ... */ };
    const handleSongClick = (song, index) => { /* ... */ };
    const onDragEnd = async (result) => { /* ... */ };

    return (
        <main className="content-area playlist-page">
            
            <PlaylistHeaderContainer>
                {/* Imagem da Capa e Botão de Edição */}
                {isOwner && isCustomPlaylist ? (
                    <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={handleOpenEditModal}>
                        <img src={editImg || DEFAULT_PLAYLIST_COVER} alt="Playlist Cover" style={{ width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 10px 30px var(--shadow-color-dark)', objectFit: 'cover' }}/>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
                            <EditIcon sx={{ fontSize: '50px', color: 'white' }} />
                        </Box>
                    </Box>
                ) : (
                    <img src={playlistDetails.img || DEFAULT_PLAYLIST_COVER} alt="Playlist Cover" style={{ width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 10px 30px var(--shadow-color-dark)', objectFit: 'cover' }}/>
                )}

                <Box className="header-info">
                    <Typography variant="overline" className="playlist-type" sx={{ color: 'var(--secondary-text-color)', fontWeight: 'bold' }}>
                        {id === '0' ? 'PLAYLIST ESPECIAL' : (playlistDetails.isPublic ? 'PLAYLIST PÚBLICA' : 'PLAYLIST PRIVADA')}
                    </Typography>
                    <Typography variant="h3" component="h1" sx={{ color: 'var(--text-color)', fontWeight: 'bold', margin: '10px 0' }}>
                        {playlistDetails.name}
                    </Typography>
                    <Typography className="playlist-description" sx={{ color: 'var(--secondary-text-color)', maxWidth: '600px' }}>
                        {playlistDetails.description}
                    </Typography>
                    <Typography variant="body2" className="playlist-stats" sx={{ color: 'var(--secondary-text-color)', marginTop: '10px' }}>
                        Criada por <Link to={`/perfil/${playlistDetails.creatorId}`} style={{ color: 'var(--text-color)', fontWeight: 'bold', textDecoration: 'none' }}>{playlistDetails.creator}</Link>
                        • <span>{playlistDetails.songCount} músicas</span>
                        • <span>{playlistDetails.duration}</span>
                    </Typography>
                </Box>
            </PlaylistHeaderContainer>

            <Box className="actions-bar" sx={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', padding: '0 20px' }}>
                
                <PlayButton
                    aria-label={isThisPlaylistPlaying ? "Pausar Playlist" : "Tocar Playlist"}
                    onClick={handlePlaylistPlay}
                    disabled={localSongs.length === 0}
                >
                    {isThisPlaylistPlaying ? <PauseIcon sx={{ fontSize: '32px' }} /> : <PlayArrowIcon sx={{ fontSize: '32px' }} />}
                </PlayButton>
                
                <ActionIcon aria-label="Shuffle"><i className="fas fa-random" style={{ fontSize: '20px' }} /></ActionIcon>
                
                {isOwner && isCustomPlaylist && (
                    <ActionIcon 
                        aria-label="Editar Playlist"
                        onClick={handleOpenEditModal}
                    >
                        <EditIcon sx={{ fontSize: '20px' }} />
                    </ActionIcon>
                )}

                <ActionIcon 
                    aria-label="Mais Opções"
                    onClick={handleOptionsClick}
                >
                    <MoreVertIcon sx={{ fontSize: '20px' }} />
                </ActionIcon>

                {/* Menu de Opções */}
                <Menu
                    anchorEl={optionsAnchorEl}
                    open={optionsMenuOpen}
                    onClose={handleOptionsClose}
                    PaperProps={{
                        sx: {
                            backgroundColor: 'var(--card-bg)',
                            color: 'var(--text-color)',
                            marginTop: '5px',
                            '& .MuiMenuItem-root': {
                                fontSize: '0.9rem',
                                padding: '8px 16px',
                                '&:hover': { backgroundColor: 'var(--input-bg)' }
                            }
                        }
                    }}
                >
                    <MenuItem onClick={handleSharePlaylist}>
                        <ShareIcon sx={{ marginRight: 1, fontSize: '18px' }} />
                        Compartilhar Playlist
                    </MenuItem>
                    
                    <MenuItem onClick={handleOpenAddToPlaylistModal} disabled={availablePlaylists.length === 0 || localSongs.length === 0}>
                        <PlaylistAddIcon sx={{ marginRight: 1, fontSize: '18px' }} />
                        Adicionar a Outra Playlist
                    </MenuItem>
                    
                    {isOwner && isCustomPlaylist && (
                        <>
                            <Divider sx={{ backgroundColor: 'var(--border-color)' }} />
                            <MenuItem onClick={handleDeletePlaylist}>
                                <DeleteIcon sx={{ marginRight: 1, fontSize: '18px', color: 'red' }} />
                                Excluir Playlist
                            </MenuItem>
                        </>
                    )}
                </Menu>
                
                {/* Botão de Ordenação (Menu de Ordenação) */}
                <SortContainer>
                    <SortButton
                        onClick={handleSortClick}
                        endIcon={<i className="fas fa-chevron-down" style={{ fontSize: '12px' }} />}
                    >
                        <i 
                            className="fas fa-list-ul" 
                            style={{ 
                                fontSize: '18px', 
                                color: sortKey !== 'custom' ? 'var(--orange)' : INACTIVE_ICON_COLOR 
                            }} 
                        />
                        {sortOptions[sortKey]}
                    </SortButton>
                    
                    <Menu
                        anchorEl={sortAnchorEl}
                        open={Boolean(sortAnchorEl)}
                        onClose={handleSortClose}
                        PaperProps={{
                            sx: {
                                backgroundColor: 'var(--card-bg)',
                                color: 'var(--text-color)',
                                marginTop: '5px',
                                '& .MuiMenuItem-root': {
                                    fontSize: '0.9rem',
                                    padding: '8px 16px',
                                    '&:hover': { backgroundColor: 'var(--input-bg)' },
                                    '&.Mui-selected': { 
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--orange)',
                                    }
                                }
                            }
                        }}
                    >
                        {Object.entries(sortOptions).map(([key, label]) => (
                            <MenuItem 
                                key={key}
                                onClick={() => handleSortSelect(key)}
                                selected={sortKey === key}
                                disabled={!isCustomPlaylist && key === 'custom'}
                            >
                                {label}
                            </MenuItem>
                        ))}
                    </Menu>
                </SortContainer>

            </Box>
            
            {/* Tabela de Músicas (Drag and Drop) - Omitida por brevidade */}
            {/* ... */}

            {/* Modal de Edição da Playlist */}
            {isOwner && isCustomPlaylist && (
                <Modal
                    open={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    aria-labelledby="modal-edit-playlist-title"
                >
                    <Box sx={ModalStyle} component="form" onSubmit={handleUpdatePlaylist}>
                        <Typography id="modal-edit-playlist-title" variant="h6" component="h2" sx={{ marginBottom: 2 }}>
                            Editar Detalhes
                        </Typography>

                        <TextField
                            label="Nome da Playlist"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            fullWidth
                            margin="normal"
                            required
                            sx={{ input: { color: 'var(--text-color)' }, '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, '&:hover fieldset': { borderColor: 'var(--orange)' }, '&.Mui-focused fieldset': { borderColor: 'var(--orange)' }, backgroundColor: 'var(--input-bg)' } }}
                        />

                        <TextField
                            label="Descrição"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            margin="normal"
                            sx={{ textarea: { color: 'var(--text-color)' }, '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, '&:hover fieldset': { borderColor: 'var(--orange)' }, '&.Mui-focused fieldset': { borderColor: 'var(--orange)' }, backgroundColor: 'var(--input-bg)' } }}
                        />

                        <TextField
                            label="URL da Capa"
                            value={editImg}
                            onChange={(e) => setEditImg(e.target.value)}
                            fullWidth
                            margin="normal"
                            sx={{ input: { color: 'var(--text-color)' }, '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, '&:hover fieldset': { borderColor: 'var(--orange)' }, '&.Mui-focused fieldset': { borderColor: 'var(--orange)' }, backgroundColor: 'var(--input-bg)' } }}
                        />
                        
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={editIsPublic}
                                    onChange={(e) => setEditIsPublic(e.target.checked)}
                                    sx={{
                                        '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--orange)' },
                                        '& .MuiSwitch-track': { backgroundColor: 'var(--secondary-text-color)' },
                                    }}
                                />
                            }
                            label={<Typography sx={{ color: 'var(--text-color)' }}>Playlist Pública</Typography>}
                            sx={{ marginTop: 1, marginBottom: 2 }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: 3 }}>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                sx={{ 
                                    backgroundColor: 'var(--orange)', 
                                    color: 'white', 
                                    '&:hover': { backgroundColor: 'var(--darker-orange)' } 
                                }}
                            >
                                Salvar
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            )}
            
            {/* Modal de Adicionar a Outra Playlist (Add to Playlist Modal) */}
            <Modal
                open={isAddToPlaylistModalOpen}
                onClose={handleCloseAddToPlaylistModal}
                aria-labelledby="modal-add-to-playlist-title"
            >
                <Box sx={ModalStyle}>
                    <Typography id="modal-add-to-playlist-title" variant="h6" component="h2" sx={{ marginBottom: 2 }}>
                        Adicionar 
                        <Typography component="span" sx={{ fontWeight: 'bold', margin: '0 5px' }}>
                            {songOptionsSong ? songOptionsSong.title : `${localSongs.length} músicas`}
                        </Typography> 
                        a:
                    </Typography>

                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                        {availablePlaylists.length > 0 ? (
                            availablePlaylists.map((p) => (
                                <MenuItem 
                                    key={p.id} 
                                    onClick={() => handleAddSongToPlaylist(p.id)}
                                    sx={{ 
                                        padding: '10px 16px', 
                                        borderRadius: '4px',
                                        '&:hover': { backgroundColor: 'var(--input-bg)' }
                                    }}
                                >
                                    <img src={p.img || DEFAULT_PLAYLIST_COVER} alt="Cover" style={{ width: '40px', height: '40px', marginRight: '15px', borderRadius: '4px' }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: 'bold', color: 'var(--text-color)' }}>{p.name}</Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)' }}>{p.songCount} músicas</Typography>
                                    </Box>
                                </MenuItem>
                            ))
                        ) : (
                            <Typography sx={{ color: 'var(--secondary-text-color)' }}>Nenhuma outra playlist customizada disponível.</Typography>
                        )}
                    </Box>
                    
                    <Button 
                        onClick={handleCloseAddToPlaylistModal} 
                        variant="outlined" 
                        fullWidth 
                        sx={{ marginTop: 3, borderColor: 'var(--border-color)', color: 'var(--text-color)', '&:hover': { borderColor: 'var(--orange)' } }}
                    >
                        Fechar
                    </Button>
                </Box>
            </Modal>
        </main>
    );
}

export default PlaylistDetalhe;