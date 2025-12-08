import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
    Modal, Box, Typography, TextField, Button, IconButton, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    styled, Switch, FormControlLabel, Menu, MenuItem, Divider, CircularProgress 
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
import { togglePlayPause } from '../../redux/playerSlice'; 
import api from '../../services/api';

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';
const LIKED_SONGS_COVER = '/assets/img/liked_cover_0.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/vibe_cover_2.png'; 

const ModalStyle = {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: 400, bgcolor: 'var(--sidebar-bg)', border: '2px solid var(--orange)',
    borderRadius: '8px', boxShadow: 24, p: 4, color: 'var(--text-color)',
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
    display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: '10px'
}));

const SortButton = styled(Button)(({ theme }) => ({
    color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '6px 16px', textTransform: 'none', fontSize: '0.9rem', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', gap: '8px',
    '&:hover': { backgroundColor: 'var(--card-bg)', borderColor: 'var(--secondary-text-color)' }
}));

const sortOptions = {
    custom: 'Ordem personalizada',
    title: 'Título (A-Z)',
    album: 'Álbum (A-Z)', 
    artist: 'Artista (A-Z)',
    added: 'Adicionado em (Mais Recente)'
};

const mapSongSafe = (s) => {
    if (!s) return null;

    let artistName = 'Desconhecido';
    if (Array.isArray(s.artists) && s.artists.length > 0) {
        artistName = s.artists.map(a => a.name).join(', ');
    } else if (s.artist && typeof s.artist === 'object') {
        artistName = s.artist.name || 'Desconhecido';
    } else if (typeof s.artist === 'string') {
        artistName = s.artist;
    }

    let albumName = '';
    let albumId = null;
    if (s.album && typeof s.album === 'object') {
        albumName = s.album.title || s.album.name || '';
        albumId = s.album._id || s.album.id;
    } else if (typeof s.album === 'string') {
        albumName = s.album;
    }

    let durationDisplay = "0:00";
    if (typeof s.duration === 'number') {
        const min = Math.floor(s.duration / 60);
        const sec = Math.floor(s.duration % 60);
        durationDisplay = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    } else if (s.duration) {
        durationDisplay = s.duration;
    }

    return {
        ...s,
        id: s._id || s.id,
        title: s.title || s.name || 'Sem título',
        artist: artistName,  
        album: albumName,    
        albumId: albumId || s.albumId,
        artistId: (s.artists && s.artists[0]?._id) || (s.artist?._id) || s.artistId,
        cover: s.cover || s.image || (s.album && s.album.cover) || '/assets/img/default_song_cover.png',
        duration: durationDisplay
    };
};

function PlaylistDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { currentSong, isPlaying } = useSelector(state => state.player);
    const user = useSelector(state => state.user?.user) || useSelector(state => state.auth?.user);
    const USER_ID = user?._id || user?.id || '';

    const [playlistDetails, setPlaylistDetails] = useState(null);
    const [localSongs, setLocalSongs] = useState([]);
    const [originalSongs, setOriginalSongs] = useState([]);
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
    const [isAddToPlaylistModalOpen, setIsAddToPlaylistModalOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (id === '0' && !USER_ID) return;
            
            setIsLoading(true);
            try {
                let details = null;
                let rawSongs = [];
                let songIds = [];

                if (id === '0') {
                    const userRes = await api.get(`/users/${USER_ID}`);
                    const userData = userRes.data;
                    songIds = (userData.likedSongs || []).filter(Boolean);

                    details = {
                        id: '0',
                        name: 'Músicas Curtidas',
                        description: 'Todas as músicas que você curtiu.',
                        img: LIKED_SONGS_COVER,
                        isPublic: false,
                        creator: 'Você',
                        creatorId: USER_ID,
                    };
                } else {
                    const playlistResponse = await api.get(`/playlists/${id}`);
                    const playlistData = playlistResponse.data;
                    songIds = playlistData.songs || [];
                    
                    details = {
                        ...playlistData,
                        name: playlistData.title, 
                        img: playlistData.cover || DEFAULT_PLAYLIST_COVER, 
                        creator: playlistData.user?.username || 'Você', 
                        creatorId: playlistData.user?._id || playlistData.user?.id || USER_ID,
                        isPublic: playlistData.isPublic
                    };
                }

                if (songIds.length > 0) {
                    if (typeof songIds[0] === 'object' && (songIds[0].title || songIds[0].name)) {
                        rawSongs = songIds;
                    } else {
                        const songsPromises = songIds.map(songId => api.get(`/songs/${songId}`));
                        const results = await Promise.allSettled(songsPromises);
                        rawSongs = results
                            .filter(r => r.status === 'fulfilled')
                            .map(r => r.value.data);
                    }
                }

                const cleanSongs = rawSongs.map(mapSongSafe).filter(Boolean);

                if (isMounted) {
                    details.songCount = cleanSongs.length;
                    details.duration = `${cleanSongs.length} músicas`;
                    
                    setPlaylistDetails(details);
                    setOriginalSongs(cleanSongs); 
                    setLocalSongs(cleanSongs);    

                    setEditName(details.name);
                    setEditDescription(details.description || '');
                    setEditImg(details.img || DEFAULT_PLAYLIST_COVER);
                    setEditIsPublic(details.isPublic || false); 
                }

            } catch (error) {
                console.error("Erro ao carregar playlist:", error);
                if (isMounted) setPlaylistDetails(null);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        loadData();

        return () => { isMounted = false; };
    }, [id, USER_ID]); 

    useEffect(() => {
        if (!originalSongs || originalSongs.length === 0) return;

        let sorted = [...originalSongs];
        if (sortKey !== 'custom') {
            sorted.sort((a, b) => {
                let valA = a[sortKey] || '';
                let valB = b[sortKey] || '';
                let comparison = String(valA).localeCompare(String(valB), 'pt', { sensitivity: 'base' });
                return sortKey === 'added' ? comparison * -1 : comparison;
            });
        }
        setLocalSongs(sorted);
    }, [sortKey, originalSongs]);

    const handleUpdatePlaylist = async (e) => {
        e.preventDefault();
        if (!editName.trim()) return alert("Título obrigatório.");
        if (id === "0") return;

        try {
            await api.patch(`/playlists/${id}`, {
                title: editName, description: editDescription, cover: editImg, isPublic: editIsPublic
            });
            window.location.reload();
        } catch (error) {
            alert("Erro ao atualizar.");
        }
    };

    const handleDeletePlaylist = async () => {
        setOptionsAnchorEl(null);
        if (id === "0") return;
        if (window.confirm(`Excluir "${playlistDetails.name}"?`)) {
            try {
                await api.delete(`/playlists/${id}`);
                navigate('/playlists');
            } catch (error) {
                alert("Erro ao excluir.");
            }
        }
    };

    const onDragEnd = (result) => {
        if (!result.destination || result.destination.index === result.source.index) return;
        const items = Array.from(localSongs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setLocalSongs(items);
    };

    const handleSortClick = (e) => setSortAnchorEl(e.currentTarget);
    const handleSortClose = () => setSortAnchorEl(null);
    const handleSortSelect = (key) => { setSortKey(key); handleSortClose(); };
    const handleOptionsClick = (e) => setOptionsAnchorEl(e.currentTarget);
    const handleOptionsClose = () => setOptionsAnchorEl(null);
    const handlePlaylistPlay = () => { if(localSongs.length > 0) console.log("Play"); };

    if (isLoading) return <main className="content-area" style={{paddingTop: '50px', display:'flex', justifyContent:'center'}}><CircularProgress color="warning" /></main>;
    if (!playlistDetails) return <main className="content-area" style={{paddingTop: '50px', textAlign:'center'}}><Typography variant="h4" color="error">Playlist não encontrada.</Typography><Button onClick={() => navigate('/playlists')} sx={{mt: 2, color:'var(--orange)'}}>Voltar</Button></main>;

    const isCustomPlaylist = id !== "0"; 
    const isOwner = playlistDetails.creatorId === USER_ID;
    const isThisPlaylistPlaying = isPlaying && localSongs.some(song => song.id === currentSong?.id);

    return (
        <main className="content-area playlist-page">
            <PlaylistHeaderContainer>
                <Box sx={{ position: 'relative', cursor: isOwner && isCustomPlaylist ? 'pointer' : 'default' }} onClick={isOwner && isCustomPlaylist ? () => setIsEditModalOpen(true) : undefined}>
                    <img src={playlistDetails.img} alt="Capa" onError={(e) => {e.target.src = DEFAULT_PLAYLIST_COVER}} style={{ width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 10px 30px var(--shadow-color-dark)', objectFit: 'cover' }} />
                    {isOwner && isCustomPlaylist && (
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
                            <EditIcon sx={{ fontSize: '50px', color: 'white' }} />
                        </Box>
                    )}
                </Box>
                <Box className="header-info">
                    <Typography variant="overline" sx={{ color: 'var(--secondary-text-color)', fontWeight: 'bold' }}>
                        {id === '0' ? 'PLAYLIST ESPECIAL' : (playlistDetails.isPublic ? 'PLAYLIST PÚBLICA' : 'PLAYLIST PRIVADA')}
                    </Typography>
                    <Typography variant="h3" component="h1" sx={{ color: 'var(--text-color)', fontWeight: 'bold', margin: '10px 0' }}>{playlistDetails.name}</Typography>
                    <Typography sx={{ color: 'var(--secondary-text-color)', maxWidth: '600px' }}>{playlistDetails.description}</Typography>
                    <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)', mt: '10px' }}>
                        Criada por <strong style={{ color: 'var(--text-color)' }}>{playlistDetails.creator}</strong> • {playlistDetails.songCount} músicas
                    </Typography>
                </Box>
            </PlaylistHeaderContainer>
            
            <Box className="actions-bar" sx={{ display: 'flex', alignItems: 'center', gap: '15px', mb: '30px', px: '20px' }}>
                <PlayButton onClick={handlePlaylistPlay} disabled={localSongs.length === 0}>
                    {isThisPlaylistPlaying ? <PauseIcon sx={{ fontSize: '32px' }} /> : <PlayArrowIcon sx={{ fontSize: '32px' }} />}
                </PlayButton>
                <ActionIcon onClick={handleOptionsClick}><MoreVertIcon sx={{ fontSize: '20px' }} /></ActionIcon>
                <Menu anchorEl={optionsAnchorEl} open={Boolean(optionsAnchorEl)} onClose={handleOptionsClose} PaperProps={{ sx: { bgcolor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                    <MenuItem disabled>Compartilhar (Em breve)</MenuItem>
                    {isOwner && isCustomPlaylist && <Divider sx={{ my: 1, bgcolor: 'var(--border-color)' }} />}
                    {isOwner && isCustomPlaylist && <MenuItem onClick={handleDeletePlaylist} sx={{color: 'red'}}><DeleteIcon sx={{ mr: 1, fontSize: '18px' }} /> Excluir Playlist</MenuItem>}
                </Menu>
                <SortContainer>
                    <SortButton onClick={handleSortClick} endIcon={<i className="fas fa-chevron-down" style={{ fontSize: '12px' }} />}>
                        <i className="fas fa-list-ul" style={{ fontSize: '18px', color: sortKey !== 'custom' ? 'var(--orange)' : INACTIVE_ICON_COLOR }} /> {sortOptions[sortKey]}
                    </SortButton>
                    <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={handleSortClose} PaperProps={{ sx: { bgcolor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                        {Object.entries(sortOptions).map(([key, label]) => (
                            <MenuItem key={key} onClick={() => handleSortSelect(key)} selected={sortKey === key} disabled={!isCustomPlaylist && key === 'custom'}>{label}</MenuItem>
                        ))}
                    </Menu>
                </SortContainer>
            </Box>
            
            <TableContainer sx={{ mt: '20px', px: '20px' }}>
                <Table stickyHeader sx={{ minWidth: 650, borderSpacing: '0 10px', borderCollapse: 'separate' }}>
                    <TableHead>
                        <TableRow sx={{ '& th': { color: 'var(--secondary-text-color)', borderBottom: '1px solid var(--border-color)', bgcolor: 'var(--main-bg)' } }}>
                            <TableCell sx={{ width: '40px' }}></TableCell>
                            <TableCell align="center" sx={{ width: '40px' }}>#</TableCell>
                            <TableCell>Título</TableCell>
                            <TableCell>Álbum</TableCell>
                            <TableCell>Artista</TableCell>
                            <TableCell align="center" sx={{ width: '40px' }}><AccessTimeIcon sx={{ fontSize: '18px' }} /></TableCell>
                            <TableCell sx={{ width: '40px' }}></TableCell>
                        </TableRow>
                    </TableHead>
                    {isCustomPlaylist && isOwner && sortKey === 'custom' ? (
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="songs">
                                {(provided) => (
                                    <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                                        {localSongs.map((song, index) => (
                                            <Draggable key={song.id} draggableId={String(song.id)} index={index}>
                                                {(provided) => (
                                                    <TableRow ref={provided.innerRef} {...provided.draggableProps} sx={{ '&:hover': { bgcolor: 'var(--card-bg)' } }}>
                                                        <TableCell sx={{borderBottom:'none'}}><div {...provided.dragHandleProps} style={{display:'flex',justifyContent:'center',color:INACTIVE_ICON_COLOR}}><DragIndicatorIcon /></div></TableCell>
                                                        <TableCell align="center" sx={{borderBottom:'none', color:INACTIVE_ICON_COLOR}}>{index + 1}</TableCell>
                                                        <TableCell sx={{borderBottom:'none', color:'var(--text-color)'}}><Box sx={{display:'flex', alignItems:'center', gap: 2}}><img src={song.cover} style={{width: 40, height: 40, borderRadius: 4}} alt="" />{song.title}</Box></TableCell>
                                                        <TableCell sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.album}</TableCell>
                                                        <TableCell sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.artist}</TableCell>
                                                        <TableCell align="center" sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.duration}</TableCell>
                                                        <TableCell sx={{borderBottom:'none'}}></TableCell>
                                                    </TableRow>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </TableBody>
                                )}
                            </Droppable>
                        </DragDropContext>
                    ) : (
                         <TableBody>
                            {localSongs.map((song, index) => (
                                <TableRow key={song.id} sx={{ '&:hover': { bgcolor: 'var(--card-bg)' } }}>
                                     <TableCell sx={{borderBottom:'none'}}></TableCell>
                                     <TableCell align="center" sx={{borderBottom:'none', color:INACTIVE_ICON_COLOR}}>{index + 1}</TableCell>
                                     <TableCell sx={{borderBottom:'none', color:'var(--text-color)'}}><Box sx={{display:'flex', alignItems:'center', gap: 2}}><img src={song.cover} style={{width: 40, height: 40, borderRadius: 4}} alt="" />{song.title}</Box></TableCell>
                                     <TableCell sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.album}</TableCell>
                                     <TableCell sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.artist}</TableCell>
                                     <TableCell align="center" sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.duration}</TableCell>
                                     <TableCell sx={{borderBottom:'none'}}></TableCell>
                                </TableRow>
                            ))}
                         </TableBody>
                    )}
                </Table>
            </TableContainer>

            <Modal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
                 <Box sx={ModalStyle} component="form" onSubmit={handleUpdatePlaylist}>
                        <Typography variant="h6" sx={{ mb: 2, color: 'var(--orange)' }}>Editar Playlist</Typography>
                        <TextField label="Nome" value={editName} onChange={e => setEditName(e.target.value)} fullWidth margin="normal" sx={{ input: { color: 'white' } }} />
                        <TextField label="Descrição" value={editDescription} onChange={e => setEditDescription(e.target.value)} fullWidth multiline rows={2} margin="normal" sx={{ textarea: { color: 'white' } }} />
                        <TextField label="Capa URL" value={editImg} onChange={e => setEditImg(e.target.value)} fullWidth margin="normal" sx={{ input: { color: 'white' } }} />
                        <FormControlLabel control={<Switch checked={editIsPublic} onChange={e => setEditIsPublic(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--orange)' } }} />} label={<Typography sx={{color:'white'}}>Pública</Typography>} />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                            <Button type="submit" variant="contained" sx={{ bgcolor: 'var(--orange)' }}>Salvar</Button>
                        </Box>
                 </Box>
            </Modal>
        </main>
    );
}

export default PlaylistDetalhe;