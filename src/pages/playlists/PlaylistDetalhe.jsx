import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Modal, 
    Box, 
    Typography, 
    TextField, 
    Button, 
    IconButton, 
    InputBase, 
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
import api from '../../services/api';

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';
const USER_ID = "1"; 
const LIKED_SONGS_COVER = '/assets/img/liked_cover_0.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/vacateste.jpg';

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
    const likedSongsFromRedux = useSelector(state => 
        state.auth.userPlaylistsDetail.find(p => p.id === '0')?.songs || []
    );
    const userPlaylists = useSelector(state => state.auth.userPlaylistsDetail || []);

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
            // Lógica para lidar com a playlist '0' (Músicas Curtidas) do Redux
            if (id === '0') {
                // Simula a busca no servidor para a playlist de curtidas
                const songsPromises = likedSongsFromRedux.map(songId => api.get(`/allSongs/${songId}`));
                const songsResponses = await Promise.all(songsPromises);
                const songs = songsResponses.map(res => res.data);
                
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

            // Lógica para playlists customizadas
            const playlistResponse = await api.get(`/userPlaylists/${id}`);
            let playlistData = playlistResponse.data;
            let songIds = playlistData.songs || [];

            const songsPromises = songIds.map(songId => api.get(`/allSongs/${songId}`));
            const songsResponses = await Promise.all(songsPromises);
            const songs = songsResponses.map(res => res.data);
            
            const updatedPlaylist = {
                ...playlistData,
                songCount: songs.length,
                duration: calculateTotalDuration(songs),
                creator: playlistData.creator || 'Você'
            }
            
            setPlaylistDetails(updatedPlaylist);
            setLocalSongs(sortSongs(songs, sortKey));
            
            setEditName(updatedPlaylist.name);
            setEditDescription(updatedPlaylist.description || '');
            setEditImg(updatedPlaylist.img);
            setEditIsPublic(updatedPlaylist.isPublic || false); 

        } catch (error) {
            console.error(`Erro ao carregar detalhes da playlist (ID: ${id}):`, error);
            setPlaylistDetails(null); 
        } finally {
            setIsLoading(false);
        }
    };

    // Efeito para carregar dados
    useEffect(() => {
        fetchPlaylistData();
    }, [id, likedSongsFromRedux.length]); // Dependência em likedSongsFromRedux.length garante atualização para playlist 0
    
    // Efeito para reordenar músicas localmente ao mudar a chave de ordenação
    useEffect(() => {
        // A função sortSongs pode ser aplicada no array local sem recarregar tudo do servidor
        setLocalSongs(prevSongs => sortSongs(prevSongs, sortKey));
    }, [sortKey]); 

    // --- Funções de Menu da Playlist ---
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
    
    const handleUpdatePlaylist = async (e) => {
        e.preventDefault();
        const newName = editName.trim();

        if (newName && id !== "0") {
            const updatedData = {
                name: newName,
                description: editDescription,
                img: editImg,
                isPublic: editIsPublic
            };

            try {
                await api.patch(`/userPlaylists/${id}`, updatedData);
                fetchPlaylistData();
                handleCloseEditModal();
            } catch (error) {
                console.error("Erro ao atualizar playlist:", error);
                alert("Não foi possível atualizar a playlist. Verifique se a URL da imagem é válida.");
            }
        }
    };
    
    const handleDeletePlaylist = async () => {
        handleOptionsClose();
        if (id === "0") return;
        if (window.confirm(`Tem certeza que deseja excluir a playlist "${playlistDetails.name}"?`)) {
            try {
                await api.delete(`/userPlaylists/${id}`);

                const userResponse = await api.get(`/users/${USER_ID}`);
                const currentUserPlaylists = userResponse.data.userPlaylists || [];
                const updatedPlaylistsList = currentUserPlaylists.filter(plId => plId !== id);

                await api.patch(`/users/${USER_ID}`, { userPlaylists: updatedPlaylistsList });

                navigate('/playlists'); 
            } catch (error) {
                console.error("Erro ao excluir playlist:", error);
                alert("Não foi possível excluir a playlist.");
            }
        }
    };

    const handleOptionsClick = (event) => {
        setOptionsAnchorEl(event.currentTarget);
    };

    const handleOptionsClose = () => {
        setOptionsAnchorEl(null);
    };
    
    const handleSharePlaylist = () => {
        handleOptionsClose();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            alert("Link da playlist copiado para a área de transferência!");
        } else {
            alert(`Link da playlist: ${window.location.href}`);
        }
    };

    const handleOpenAddToPlaylistModal = () => {
        handleOptionsClose();
        setSongOptionsSong(null); // Garante que o modal será para a playlist inteira, não uma música
        setIsAddToPlaylistModalOpen(true);
    };
    
    const handleCloseAddToPlaylistModal = () => setIsAddToPlaylistModalOpen(false);

    const handleAddSongToPlaylist = async (targetPlaylistId) => {
        // Define se é para adicionar uma única música (menu da música) ou a playlist inteira (menu da playlist)
        const songIdsToAdd = songOptionsSong ? [songOptionsSong.id] : localSongs.map(song => song.id);

        try {
            const targetPlaylistResponse = await api.get(`/userPlaylists/${targetPlaylistId}`);
            const targetPlaylist = targetPlaylistResponse.data;
            
            const existingSongs = new Set(targetPlaylist.songs || []);
            const songsSuccessfullyAdded = songIdsToAdd.filter(songId => !existingSongs.has(songId));
            
            if (songsSuccessfullyAdded.length > 0) {
                const newSongsList = [...(targetPlaylist.songs || []), ...songsSuccessfullyAdded];
                await api.patch(`/userPlaylists/${targetPlaylistId}`, { songs: newSongsList });
                alert(`${songsSuccessfullyAdded.length} música(s) adicionada(s) à playlist "${targetPlaylist.name}" com sucesso!`);
            } else {
                alert("As músicas selecionadas já estão nesta playlist.");
            }
            
            handleCloseAddToPlaylistModal();
            handleSongOptionsClose(); 
        } catch (error) {
            console.error("Erro ao adicionar música(s) a outra playlist:", error);
            alert("Não foi possível adicionar a(s) música(s). Tente novamente.");
        }
    };
    
    const availablePlaylists = userPlaylists.filter(p => p.id !== '0' && p.id !== id);
    
    // --- Funções: Menu da Música ---
    const handleSongOptionsClick = (event, song) => {
        event.stopPropagation(); 
        setSongOptionsAnchorEl(event.currentTarget);
        setSongOptionsSong(song);
    };

    const handleSongOptionsClose = () => {
        setSongOptionsAnchorEl(null);
        setSongOptionsSong(null);
    };

    const handleRemoveSong = async () => {
        handleSongOptionsClose();
        if (!songOptionsSong || id === "0") return;

        if (window.confirm(`Tem certeza que deseja excluir "${songOptionsSong.title}" da playlist "${playlistDetails.name}"?`)) {
            try {
                const songIdToRemove = songOptionsSong.id;
                
                // 1. Filtra a lista local para remover a primeira ocorrência da música
                // Nota: Em playlists simples (não a fila de reprodução), uma simples filtragem é suficiente.
                const newLocalSongs = [];
                let removed = false;
                for (const song of localSongs) {
                    if (song.id === songIdToRemove && !removed) {
                        removed = true;
                        continue;
                    }
                    newLocalSongs.push(song);
                }
                
                // Se a música não estava na lista local, algo está errado
                if (!removed) return; 

                setLocalSongs(newLocalSongs);

                // 2. Atualiza a playlist no servidor
                const newSongIds = newLocalSongs.map(song => song.id);
                await api.patch(`/userPlaylists/${id}`, { songs: newSongIds });
                
                // 3. Atualiza o estado da playlist para recontar músicas e duração
                fetchPlaylistData();
                
                alert(`Música "${songOptionsSong.title}" removida com sucesso!`);
            } catch (error) {
                console.error("Erro ao remover música:", error);
                alert("Não foi possível remover a música. Tente novamente.");
            }
        }
    };
    
    const handleShareSong = () => {
        handleSongOptionsClose();
        if (!songOptionsSong) return;
        
        const songLink = `${window.location.origin}/song/${songOptionsSong.id}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(songLink);
            alert(`Link da música "${songOptionsSong.title}" copiado para a área de transferência!`);
        } else {
            alert(`Link da música: ${songLink}`);
        }
    };
    
    const handleOpenAddSongToPlaylistModal = () => {
        handleSongOptionsClose();
        // songOptionsSong já está definido, a lógica de 'handleAddSongToPlaylist' saberá usá-lo
        setIsAddToPlaylistModalOpen(true);
    };
    // --- FIM NOVAS FUNÇÕES ---

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

    const handlePlaylistPlay = () => {
        if (localSongs.length === 0) return;
        
        if (isThisPlaylistPlaying) {
            dispatch(togglePlayPause());
        } else {
            // Se a música atual está na playlist, começa dela, senão, começa do início.
            const currentSongIndex = localSongs.findIndex(s => s.id === currentSong?.id);
            dispatch(setQueue({ 
                songs: localSongs, 
                startIndex: currentSongIndex >= 0 ? currentSongIndex : 0 
            }));
        }
    };
    
    const handleSongClick = (song, index) => {
        if (currentSong?.id === song.id) {
            dispatch(togglePlayPause());
        } else {
            dispatch(setQueue({ songs: localSongs, startIndex: index }));
        }
    }

    const onDragEnd = async (result) => {
        // Só permite drag se for customizada E a ordenação for customizada
        if (!result.destination || !isCustomPlaylist || sortKey !== 'custom') return;
        
        const { source, destination } = result;
        
        const newSongs = Array.from(localSongs); 
        const [movedItem] = newSongs.splice(source.index, 1);
        newSongs.splice(destination.index, 0, movedItem);
        
        setLocalSongs(newSongs); 

        // Atualiza a fila de reprodução no Redux
        const currentSongIndex = newSongs.findIndex(s => s.id === currentSong?.id);
        dispatch(setQueue({ 
            songs: newSongs, 
            startIndex: currentSongIndex >= 0 ? currentSongIndex : 0 // Reinicia do 0 se a atual saiu
        }));

        try {
            const newSongIds = newSongs.map(song => song.id);
            await api.patch(`/userPlaylists/${id}`, { songs: newSongIds });
            
        } catch (error) {
            console.error("Erro ao salvar nova ordem da playlist:", error);
            // Poderia reverter o estado local aqui em caso de falha
        }
    };

    return (
        <main className="content-area playlist-page">
            
            <PlaylistHeaderContainer>
                {isCustomPlaylist ? (
                    <Box sx={{ position: 'relative', cursor: 'pointer' }} onClick={handleOpenEditModal}>
                        <img src={playlistDetails.img} alt="Playlist Cover" style={{ width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 10px 30px var(--shadow-color-dark)', objectFit: 'cover' }}/>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
                            <EditIcon sx={{ fontSize: '50px', color: 'white' }} />
                        </Box>
                    </Box>
                ) : (
                    <img src={playlistDetails.img} alt="Playlist Cover" style={{ width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 10px 30px var(--shadow-color-dark)', objectFit: 'cover' }}/>
                )}

                <Box className="header-info">
                    <Typography variant="overline" className="playlist-type" sx={{ color: 'var(--secondary-text-color)', fontWeight: 'bold' }}>{playlistDetails.isPublic ? 'PLAYLIST PÚBLICA' : 'PLAYLIST PRIVADA'}</Typography>
                    <Typography variant="h3" component="h1" sx={{ color: 'var(--text-color)', fontWeight: 'bold', margin: '10px 0' }}>{playlistDetails.name}</Typography>
                    <Typography className="playlist-description" sx={{ color: 'var(--secondary-text-color)', maxWidth: '600px' }}>{playlistDetails.description}</Typography>
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
                
                {isCustomPlaylist && (
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
                    
                    {isCustomPlaylist && (
                        <>
                            <Divider sx={{ backgroundColor: 'var(--border-color)' }} />
                            <MenuItem onClick={handleDeletePlaylist}>
                                <DeleteIcon sx={{ marginRight: 1, fontSize: '18px' }} />
                                Excluir Playlist
                            </MenuItem>
                        </>
                    )}
                </Menu>
                
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
                                    '&:hover': {
                                        backgroundColor: 'var(--input-bg)'
                                    },
                                    '&.Mui-selected': { 
                                        backgroundColor: 'var(--input-bg)',
                                        color: 'var(--orange)',
                                    }
                                }
                            }
                        }}
                    >
                        <MenuItem 
                            onClick={() => handleSortSelect('custom')}
                            selected={sortKey === 'custom'}
                        >
                            Ordem personalizada
                        </MenuItem>
                        <MenuItem 
                            onClick={() => handleSortSelect('title')}
                            selected={sortKey === 'title'}
                        >
                            Título (A-Z)
                        </MenuItem>
                        <MenuItem 
                            onClick={() => handleSortSelect('album')}
                            selected={sortKey === 'album'}
                        >
                            Álbum (A-Z)
                        </MenuItem>
                        <MenuItem 
                            onClick={() => handleSortSelect('artist')}
                            selected={sortKey === 'artist'}
                        >
                            Artista (A-Z)
                        </MenuItem>
                        <MenuItem 
                            onClick={() => handleSortSelect('added')}
                            selected={sortKey === 'added'}
                        >
                            Adicionado em (Mais Recente)
                        </MenuItem>
                    </Menu>
                </SortContainer>

            </Box>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="playlist-detail" isDropDisabled={!isCustomPlaylist || sortKey !== 'custom'}>
                    {(provided) => (
                        <TableContainer
                            className="songs-list"
                            sx={{ background: 'transparent', padding: '0 20px' }} 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            <Table sx={{ borderSpacing: '0 0', borderCollapse: 'separate' }}>
                                <TableHead>
                                    <TableRow sx={{ 
                                        backgroundColor: 'var(--card-bg)', 
                                        '& th': { 
                                            borderBottom: '1px solid var(--border-color)', 
                                            padding: '15px 10px', 
                                            fontWeight: 'normal',
                                            color: 'var(--secondary-text-color)', 
                                        }
                                    }}>
                                        <TableCell sx={{ width: '40px', paddingLeft: '0 !important', textAlign: 'center' }}>#</TableCell>
                                        <TableCell sx={{ paddingLeft: '15px !important' }}>Título</TableCell> 
                                        <TableCell>Álbum</TableCell>
                                        <TableCell>Adicionada em</TableCell>
                                        <TableCell sx={{ width: '50px', paddingRight: '0 !important' }} align="right"><AccessTimeIcon fontSize="small" /></TableCell>
                                        <TableCell sx={{ width: '40px', paddingRight: '0 !important', paddingLeft: '0 !important' }}></TableCell> 
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {localSongs.map((song, index) => {
                                        const isCurrentRowPlaying = currentSong?.id === song.id && isPlaying;
                                        const isRowHovered = hoveredSongId === song.id;

                                        return (
                                            <Draggable 
                                                key={song.id} 
                                                draggableId={String(song.id)} 
                                                index={index}
                                                isDragDisabled={!isCustomPlaylist || sortKey !== 'custom'}
                                            >
                                                {(draggableProvided, draggableSnapshot) => (
                                                    <TableRow
                                                        ref={draggableProvided.innerRef}
                                                        {...draggableProvided.draggableProps}
                                                        
                                                        className="songs-list-row"
                                                        onClick={() => handleSongClick(song, index)}
                                                        onMouseEnter={() => setHoveredSongId(song.id)}
                                                        onMouseLeave={() => setHoveredSongId(null)}
                                                        sx={{
                                                            cursor: 'default',
                                                            transition: 'background-color 0.2s ease',
                                                            borderRadius: '8px',
                                                            marginBottom: '5px',
                                                            backgroundColor: draggableSnapshot.isDragging ? 'var(--input-bg)' : (isCurrentRowPlaying ? 'var(--input-bg)' : 'transparent'),
                                                            '&:hover': { backgroundColor: 'var(--card-bg)' }
                                                        }}
                                                    >
                                                        <TableCell sx={{ color: 'var(--text-color)', borderBottom: 'none', width: '40px', padding: '15px 10px 15px 0' }}>
                                                            <Box 
                                                                {...((isCustomPlaylist && sortKey === 'custom') ? draggableProvided.dragHandleProps : {})} 
                                                                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px', cursor: (isCustomPlaylist && sortKey === 'custom') ? 'grab' : 'default' }}
                                                            >
                                                                {(isRowHovered && isCustomPlaylist && sortKey === 'custom') ? (
                                                                    <DragIndicatorIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />
                                                                ) : (
                                                                    <Typography sx={{ color: 'var(--secondary-text-color)', fontSize: '0.9rem' }}>{index + 1}</Typography>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        
                                                        <TableCell sx={{ borderBottom: 'none', paddingLeft: '15px !important' }}>
                                                            <Box className="song-info" sx={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                <img src={song.cover} alt="Song Cover" style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' }} />
                                                                <Box>
                                                                    <Typography className="song-title" sx={{ fontWeight: 'bold', display: 'block', color: isCurrentRowPlaying ? 'var(--orange)' : 'var(--text-color)' }}>{song.title}</Typography>
                                                                    <Typography className="song-artist" sx={{ color: 'var(--secondary-text-color)', fontSize: '0.9rem' }}>{song.artist}</Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ color: 'var(--text-color)', borderBottom: 'none' }}>{song.album}</TableCell>
                                                        <TableCell sx={{ color: 'var(--text-color)', borderBottom: 'none' }}>{song.added}</TableCell>
                                                        <TableCell sx={{ color: 'var(--secondary-text-color)', borderBottom: 'none', paddingRight: '0 !important' }} align="right">{song.duration}</TableCell>

                                                        <TableCell sx={{ width: '40px', paddingRight: '0 !important', paddingLeft: '0 !important', borderBottom: 'none', textAlign: 'center' }}>
                                                            <IconButton
                                                                aria-label="Mais opções da música"
                                                                size="small"
                                                                onClick={(e) => handleSongOptionsClick(e, song)}
                                                                sx={{
                                                                    color: isRowHovered || songOptionsSong?.id === song.id ? 'var(--text-color)' : INACTIVE_ICON_COLOR,
                                                                    visibility: isRowHovered || songOptionsSong?.id === song.id ? 'visible' : 'hidden',
                                                                    '&:hover': { backgroundColor: 'transparent', color: 'var(--text-color)' }
                                                                }}
                                                            >
                                                                <MoreVertIcon fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                        
                                                    </TableRow>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Droppable>
            </DragDropContext>
            
            <Menu
                anchorEl={songOptionsAnchorEl}
                open={songOptionsMenuOpen}
                onClose={handleSongOptionsClose}
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
                <MenuItem onClick={handleShareSong}>
                    <ShareIcon sx={{ marginRight: 1, fontSize: '18px' }} />
                    Compartilhar Música
                </MenuItem>
                
                <MenuItem onClick={handleOpenAddSongToPlaylistModal} disabled={availablePlaylists.length === 0}>
                    <PlaylistAddIcon sx={{ marginRight: 1, fontSize: '18px' }} />
                    Adicionar a Outra Playlist
                </MenuItem>
                
                {isCustomPlaylist && ( 
                    <>
                        <Divider sx={{ backgroundColor: 'var(--border-color)' }} />
                        <MenuItem onClick={handleRemoveSong}>
                            <DeleteIcon sx={{ marginRight: 1, fontSize: '18px' }} />
                            Excluir da Playlist
                        </MenuItem>
                    </>
                )}
            </Menu>
            
            {/* Modal de Edição de Playlist */}
            {isCustomPlaylist && (
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
            
            {/* Modal Adicionar a Outra Playlist */}
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