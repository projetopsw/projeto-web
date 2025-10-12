import React, { useState, useEffect, useMemo } from 'react'; // Adicionado useMemo para manter
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
    Menu, // Usando Menu
    MenuItem, // Usando MenuItem
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSelector, useDispatch } from 'react-redux';
import { setQueue, togglePlayPause } from '../../redux/playerSlice';
import api from '../../services/api';

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';
const USER_ID = "1"; 
const LIKED_SONGS_COVER = '/assets/img/liked_cover_0.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/vacateste.jpg';

// ... (ModalStyle, PlaylistHeaderContainer, PlayButton, ActionIcon mantidos)

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


// Container ajustado para o dropdown de ordenação (apenas para espaçamento)
const SortContainer = styled(Box)(({ theme }) => ({
    display: 'flex', 
    alignItems: 'center', 
    marginLeft: 'auto',
    gap: '10px' // Mantido o gap se precisar de outros elementos
}));

// Botão personalizado para o dropdown (ajustado para incluir ícone)
const SortButton = styled(Button)(({ theme }) => ({
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '6px 16px',
    textTransform: 'none',
    fontSize: '0.9rem',
    backgroundColor: 'var(--input-bg)',
    display: 'flex', // Para alinhar ícone e texto
    alignItems: 'center',
    gap: '8px', // Espaço entre ícone e texto
    '&:hover': {
        backgroundColor: 'var(--card-bg)',
        borderColor: 'var(--secondary-text-color)'
    }
}));

// Mapeamento das opções de ordenação
const sortOptions = {
    custom: 'Ordem personalizada',
    title: 'Título (A-Z)',
    album: 'Álbum (A-Z)', 
    artist: 'Artista (A-Z)',
    added: 'Adicionado em (Mais Recente)' // Mudança no texto para indicar ordenação
};

/**
 * Lógica de classificação AJUSTADA
 * - Usa localeCompare para ordenar strings corretamente (letras acentuadas, maiúsculas/minúsculas).
 * - Garante que 'added' (Adicionado em) seja decrescente (mais recente primeiro).
 */
const sortSongs = (songs, key) => {
    if (key === 'custom') {
        return songs;
    }

    const sorted = [...songs].sort((a, b) => {
        let valA = a[key] || '';
        let valB = b[key] || '';

        // Ordenação de strings robusta
        let comparison = String(valA).localeCompare(String(valB), 'pt', { sensitivity: 'base' });

        // Se a chave for 'added', inverte a comparação para obter 'Mais Recente'
        if (key === 'added') {
            return comparison * -1; // -1 inverte a ordem (decrescente)
        }
        
        // Retorna a comparação normal (crescente: A-Z, 1-N)
        return comparison;
    });

    return sorted;
};

// Função auxiliar para calcular a duração total (deixei fora do componente como no original)
const calculateTotalDuration = (songs) => {
    return `${songs.length} músicas`; 
};


function PlaylistDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // ... (restante dos useSelector e variáveis)

    const { currentSong, isPlaying } = useSelector(state => state.player);
    const likedSongsFromRedux = useSelector(state => 
        state.auth.userPlaylistsDetail.find(p => p.id === '0')?.songs || []
    );

    const [playlistDetails, setPlaylistDetails] = useState(null);
    const [localSongs, setLocalSongs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredSongId, setHoveredSongId] = useState(null);
    
    // ESTADOS PARA EDIÇÃO
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editImg, setEditImg] = useState('');
    const [editIsPublic, setEditIsPublic] = useState(false); 
    
    // ESTADOS PARA O DROPDOWN (Menu)
    const [sortAnchorEl, setSortAnchorEl] = useState(null);
    const [sortKey, setSortKey] = useState('custom'); // Chave de ordenação atual

    const fetchPlaylistData = async () => {
        setIsLoading(true);
        try {
            const playlistResponse = await api.get(`/userPlaylists/${id}`);
            let playlistData = playlistResponse.data;
            let songIds = playlistData.songs || [];

            // ... (Lógica para Liked Songs mantida)

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
            // Ao carregar, aplica a ordenação atual (se for 'custom' não faz nada)
            setLocalSongs(sortSongs(songs, sortKey));
            
            // ... (Atualiza estados de edição mantido)
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

    useEffect(() => {
        fetchPlaylistData();
    }, [id, id === '0' ? likedSongsFromRedux.length : null]); 
    
    // EFEITO para reordenar localmente SEMPRE que a chave de ordenação (sortKey) mudar.
    // É importante passar o array *anterior* para a função sortSongs, que retorna um novo.
    useEffect(() => {
        // Usa o estado anterior de localSongs para garantir a ordenação correta 
        // sem depender da atualização assíncrona do useEffect anterior.
        setLocalSongs(prevSongs => sortSongs(prevSongs, sortKey));
    }, [sortKey]); 

    // Handlers para o dropdown (Menu)
    const handleSortClick = (event) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortClose = () => {
        setSortAnchorEl(null);
    };

    const handleSortSelect = (key) => {
        // ATUALIZA A CHAVE DE ORDENAÇÃO. O useEffect acima cuidará da ordenação de localSongs.
        setSortKey(key); 
        handleSortClose();
    };

    // ... (handleOpenEditModal, handleCloseEditModal, handleUpdatePlaylist, handleDeletePlaylist mantidos)

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
            // Garante que a fila do player use a lista ordenada atual (localSongs)
            const currentSongIndex = localSongs.findIndex(s => s.id === currentSong?.id);
            dispatch(setQueue({ songs: localSongs, startIndex: currentSongIndex >= 0 ? currentSongIndex : 0 }));
        }
    };
    
    const handleSongClick = (song, index) => {
        if (currentSong?.id === song.id) {
            dispatch(togglePlayPause());
        } else {
            // Garante que a fila do player use a lista ordenada atual (localSongs)
            dispatch(setQueue({ songs: localSongs, startIndex: index }));
        }
    }

    const onDragEnd = async (result) => {
        // Permite drag-and-drop APENAS se for uma playlist customizada E a ordenação for 'custom'
        if (!result.destination || !isCustomPlaylist || sortKey !== 'custom') return;
        
        const { source, destination } = result;
        
        // Se a ordenação for 'custom', localSongs já está na ordem que queremos reordenar
        const newSongs = Array.from(localSongs); 
        const [movedItem] = newSongs.splice(source.index, 1);
        newSongs.splice(destination.index, 0, movedItem);
        
        // Atualiza a ordem local e a fila do player
        setLocalSongs(newSongs); 

        const currentSongIndex = newSongs.findIndex(s => s.id === currentSong?.id);
        dispatch(setQueue({ songs: newSongs, startIndex: currentSongIndex }));

        try {
            const newSongIds = newSongs.map(song => song.id);
            // Persiste a nova ordem de IDs no banco de dados
            await api.patch(`/userPlaylists/${id}`, { songs: newSongIds });
            
        } catch (error) {
            console.error("Erro ao salvar nova ordem da playlist:", error);
        }
    };

    return (
        <main className="content-area playlist-page">
            
            <PlaylistHeaderContainer>
                {/* ... (Header da Playlist - Mantido) ... */}
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

                <ActionIcon aria-label="More Options"><i className="fas fa-ellipsis-h" style={{ fontSize: '20px' }} /></ActionIcon>

                {/* DROPDOWN DE ORDENAÇÃO AJUSTADO */}
                <SortContainer>
                    <SortButton
                        onClick={handleSortClick}
                        endIcon={<i className="fas fa-chevron-down" style={{ fontSize: '12px' }} />}
                    >
                        <i 
                            className="fas fa-list-ul" 
                            style={{ 
                                fontSize: '18px', 
                                // Cor do ícone dinâmico: Laranja se não for ordem customizada, Senão secundário
                                color: sortKey !== 'custom' ? 'var(--orange)' : INACTIVE_ICON_COLOR 
                            }} 
                        />
                        {sortOptions[sortKey]}
                    </SortButton>
                    
                    <Menu
                        anchorEl={sortAnchorEl}
                        open={Boolean(sortAnchorEl)}
                        onClose={handleSortClose}
                        // ... (PaperProps mantido)
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
                                    '&.Mui-selected': { // Destaca a opção selecionada
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

            {/* Drag and Drop com restrição de ordenação */}
            <DragDropContext onDragEnd={onDragEnd}>
                {/* O drop só é permitido se a ordenação for 'custom' */}
                <Droppable droppableId="playlist-detail" isDropDisabled={!isCustomPlaylist || sortKey !== 'custom'}>
                    {(provided) => (
                        <TableContainer
                            className="songs-list"
                            sx={{ background: 'transparent', padding: '0 20px' }} 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            <Table sx={{ borderSpacing: '0 0', borderCollapse: 'separate' }}>
                                {/* ... (TableHead mantido) ... */}
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
                                     </TableRow>
                                </TableHead>
                                <TableBody>
                                    {localSongs.map((song, index) => { // localSongs já está ordenado
                                        const isCurrentRowPlaying = currentSong?.id === song.id && isPlaying;
                                        const isRowHovered = hoveredSongId === song.id;

                                        return (
                                            <Draggable 
                                                key={song.id} 
                                                draggableId={String(song.id)} 
                                                index={index}
                                                // Desabilita o Drag se a ordenação não for 'custom'
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
                                                        {/* Coluna # (Número/Drag Handle) - Centralizado */}
                                                        <TableCell sx={{ color: 'var(--text-color)', borderBottom: 'none', width: '40px', padding: '15px 10px 15px 0' }}>
                                                            <Box 
                                                                // dragHandleProps só é aplicado se a ordenação for 'custom'
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
                                                        
                                                        {/* ... (demais colunas mantidas) ... */}
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
                                                        <TableCell sx={{ color: 'var(--text-color)', borderBottom: 'none', paddingRight: '0 !important' }} align="right">{song.duration}</TableCell>

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

            {/* ... (Modal de Edição - Mantido) ... */}
        </main>
    );
}

export default PlaylistDetalhe;