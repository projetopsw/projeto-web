import React, { useState, useEffect } from 'react';
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
    styled 
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSelector, useDispatch } from 'react-redux';
import { setQueue, togglePlayPause } from '../../store/playerSlice';
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

const SearchSongsContainer = styled(Box)(({ theme }) => ({
    display: 'flex', alignItems: 'center', width: '300px', height: '38px', backgroundColor: 'var(--input-bg)',
    borderRadius: '20px', padding: '0 5px 0 10px', transition: 'box-shadow 0.3s ease', marginLeft: 'auto',
    '&:focus-within': { boxShadow: `0 0 0 1px var(--secondary-text-color)` },
    '& .MuiSvgIcon-root': { color: 'var(--secondary-text-color)', fontSize: '20px', marginRight: '10px', marginLeft: '5px' }
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
    color: 'var(--input-text-color)', width: '100%',
    '& .MuiInputBase-input': { padding: '5px 0', fontSize: '0.95rem' },
    '& ::placeholder': { color: INACTIVE_ICON_COLOR, opacity: 0.8 },
}));

const calculateTotalDuration = (songs) => {
    return `${songs.length} músicas`; 
};

function PlaylistDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { currentSong, isPlaying } = useSelector(state => state.player);
    // Agora, pegamos a lista de músicas da playlist "0" diretamente do Redux, se estiver carregada.
    // Isso garante que o useEffect reaja a mudanças feitas no Song.jsx.
    const likedSongsFromRedux = useSelector(state => 
        state.auth.userPlaylistsDetail.find(p => p.id === '0')?.songs || []
    );

    const [playlistDetails, setPlaylistDetails] = useState(null);
    const [localSongs, setLocalSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredSongId, setHoveredSongId] = useState(null);
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    
    const fetchPlaylistData = async () => {
        setIsLoading(true);
        try {
            // 💡 MUDANÇA PRINCIPAL: Busca a playlist diretamente, incluindo a de ID "0"
            const playlistResponse = await api.get(`/userPlaylists/${id}`);
            let playlistData = playlistResponse.data;
            let songIds = playlistData.songs || [];

            // A playlist '0' não deve ser editável
            const isCustomPlaylist = id !== "0";

            // Se for a playlist 'Músicas Curtidas', garante a capa e o nome
            if (id === "0") {
                playlistData = {
                    ...playlistData,
                    img: LIKED_SONGS_COVER,
                    type: "Playlist do Usuário",
                    creator: "Você",
                    creatorId: USER_ID
                };
            }

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
            setLocalSongs(songs);
            setEditName(updatedPlaylist.name);

        } catch (error) {
            console.error(`Erro ao carregar detalhes da playlist (ID: ${id}):`, error);
            setPlaylistDetails(null); 
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaylistData();
        // 💡 Se for a playlist '0', use a lista do Redux como dependência para atualização instantânea
        // Se for outra playlist, use o ID como dependência normal
    }, [id, id === '0' ? likedSongsFromRedux.length : null]); 
    
    // O resto do componente (lógica de edição, exclusão, drag-and-drop) pode permanecer inalterado,
    // pois a checagem `isCustomPlaylist = id !== "0"` já lida com as restrições da playlist curtida.

    const handleOpenEditModal = () => setIsEditModalOpen(true);
    const handleCloseEditModal = () => setIsEditModalOpen(false);

    const handleUpdatePlaylist = async (e) => {
        e.preventDefault();
        const newName = editName.trim();

        if (newName && id !== "0") {
            try {
                await api.patch(`/userPlaylists/${id}`, { 
                    name: newName,
                    img: DEFAULT_PLAYLIST_COVER,
                });
                
                fetchPlaylistData();
                handleCloseEditModal();
            } catch (error) {
                console.error("Erro ao atualizar playlist:", error);
                alert("Não foi possível atualizar o nome da playlist.");
            }
        }
    };

    const handleDeletePlaylist = async () => {
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
        if (isThisPlaylistPlaying) {
            dispatch(togglePlayPause());
        } else {
            dispatch(setQueue({ songs: localSongs, startIndex: 0 }));
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
        if (!result.destination || !isCustomPlaylist) return;
        
        const { source, destination } = result;
        
        const newSongs = Array.from(localSongs);
        const [movedItem] = newSongs.splice(source.index, 1);
        newSongs.splice(destination.index, 0, movedItem);
        
        setLocalSongs(newSongs);

        const currentSongIndex = newSongs.findIndex(s => s.id === currentSong?.id);
        dispatch(setQueue({ songs: newSongs, startIndex: currentSongIndex }));

        try {
            const newSongIds = newSongs.map(song => song.id);
            await api.patch(`/userPlaylists/${id}`, { songs: newSongIds });
            
        } catch (error) {
            console.error("Erro ao salvar nova ordem da playlist:", error);
        }
    };

    return (
        <main className="content-area playlist-page">
            
            <PlaylistHeaderContainer>
                <img src={playlistDetails.img} alt="Playlist Cover" style={{ width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 10px 30px var(--shadow-color-dark)', objectFit: 'cover' }}/>
                <Box className="header-info">
                    <Typography variant="overline" className="playlist-type" sx={{ color: 'var(--secondary-text-color)', fontWeight: 'bold' }}>{playlistDetails.type}</Typography>
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

                <ActionIcon aria-label="More Options"><i className="fas fa-ellipsis-h" style={{ fontSize: '20px' }} /></ActionIcon>

                <SearchSongsContainer>
                    <SearchInput placeholder="Ordem personalizada" /> 
                    <i className="fas fa-list-ul" style={{ color: INACTIVE_ICON_COLOR, fontSize: '18px', marginLeft: '10px', cursor: isCustomPlaylist ? 'pointer' : 'default' }} />
                </SearchSongsContainer>
            </Box>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="playlist-detail" isDropDisabled={!isCustomPlaylist}>
                    {(provided) => (
                        <TableContainer
                            className="songs-list"
                            sx={{ background: 'transparent' }}
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            <Table sx={{ borderSpacing: '0 0', borderCollapse: 'separate' }}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: 'var(--card-bg)', '& th': { borderBottom: '1px solid var(--border-color)', padding: '15px', fontWeight: 'normal' }}}>
                                        <TableCell sx={{ color: 'var(--secondary-text-color)' }}>#</TableCell>
                                        <TableCell sx={{ color: 'var(--secondary-text-color)' }}>Título</TableCell>
                                        <TableCell sx={{ color: 'var(--secondary-text-color)' }}>Álbum</TableCell>
                                        <TableCell sx={{ color: 'var(--secondary-text-color)' }}>Adicionada em</TableCell>
                                        <TableCell sx={{ color: 'var(--secondary-text-color)', width: '50px' }} align="right"><AccessTimeIcon fontSize="small" /></TableCell>
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
                                                isDragDisabled={!isCustomPlaylist}
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
                                                        <TableCell sx={{ color: 'var(--text-color)', borderBottom: 'none', width: '40px', padding: '15px' }}>
                                                            <Box {...draggableProvided.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '18px', cursor: isCustomPlaylist ? 'grab' : 'default' }}>
                                                                {(isRowHovered && isCustomPlaylist) ? (
                                                                    <DragIndicatorIcon fontSize="small" sx={{ color: 'var(--secondary-text-color)' }} />
                                                                ) : (
                                                                    <Typography sx={{ color: 'var(--secondary-text-color)', fontSize: '0.9rem' }}>{index + 1}</Typography>
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        
                                                        <TableCell sx={{ borderBottom: 'none' }}>
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
                                                        <TableCell sx={{ color: 'var(--text-color)', borderBottom: 'none' }} align="right">{song.duration}</TableCell>

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

            <Modal
                open={isEditModalOpen}
                onClose={handleCloseEditModal}
                aria-labelledby="edit-modal-title"
                aria-describedby="edit-modal-description"
            >
                <Box sx={ModalStyle} component="form" onSubmit={handleUpdatePlaylist}>
                    <Typography
                        id="edit-modal-title"
                        variant="h6"
                        component="h2"
                        sx={{ color: 'var(--orange)', mb: 2 }}
                    >
                        Editar Playlist: {playlistDetails?.name}
                    </Typography>

                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Novo Nome da Playlist"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        InputLabelProps={{ style: { color: 'var(--secondary-text-color)' } }}
                        InputProps={{ style: { color: 'var(--text-color)', border: '1px solid var(--border-color)' } }}
                        sx={{ mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                        <Button
                            onClick={handleDeletePlaylist}
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            sx={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
                        >
                            Excluir
                        </Button>
                        
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                onClick={handleCloseEditModal}
                                sx={{ color: 'var(--secondary-text-color)' }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!editName.trim() || editName.trim() === playlistDetails?.name}
                                sx={{
                                    backgroundColor: 'var(--orange)',
                                    '&:hover': { backgroundColor: '#cc612a' }
                                }}
                            >
                                Salvar
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Modal>
        </main>
    );
}

export default PlaylistDetalhe;