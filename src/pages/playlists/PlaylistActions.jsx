import React, { useState } from 'react';
import { 
    Box, Button, IconButton, Menu, MenuItem, Divider, styled, 
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography,
    List, ListItem, ListItemAvatar, Avatar, ListItemText 
} from '@mui/material';
import { 
    PlayArrow as PlayArrowIcon, 
    Pause as PauseIcon, 
    MoreVert as MoreVertIcon, 
    Delete as DeleteIcon,
    Share as ShareIcon,
    Close as CloseIcon,
    Add as AddIcon, 
    Search as SearchIcon,
    MusicNote as MusicNoteIcon,
    RemoveCircle as RemoveCircleIcon // Ícone para remover
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux'; 
// Adicionei removeSongFromPlaylistAsync nas importações (certifique-se de criar essa action no redux)
import { addSongToPlaylistAsync, removeSongFromPlaylistAsync, fetchUserPlaylistsDetail } from '../../redux/loginSlice'; 
import mongoApi from '../../services/mongoApi'; 

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';
const COR_LARANJA = 'var(--orange)';

const PlayButton = styled(IconButton)(({ theme }) => ({
    width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--orange)', color: 'white', fontSize: '26px', boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': { transform: 'scale(1.1)', backgroundColor: 'var(--darker-orange)', boxShadow: '0 6px 20px rgba(255, 107, 0, 0.7)' },
}));

const ActionIcon = styled(IconButton)(({ theme }) => ({
    color: INACTIVE_ICON_COLOR, width: '40px', height: '40px', transition: 'color 0.2s ease',
    '&:hover': { color: 'var(--text-color)', backgroundColor: 'transparent' },
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

export default function PlaylistActions({ 
    onPlay, isPlaying, isDisabled, 
    onSortChange, sortKey, 
    onDelete, isOwner, isCustom,
    playlistId,
    playlistSongs = [] // NOVA PROP: Recebe as músicas da playlist atual para poder listar na remoção
}) {
    const dispatch = useDispatch();
    const user = useSelector(state => state.user?.user || state.auth?.user);

    const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
    const [sortAnchorEl, setSortAnchorEl] = useState(null);

    // --- Estados do Modal de Compartilhar ---
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // --- Estados do Modal de Adicionar Músicas ---
    const [addMusicModalOpen, setAddMusicModalOpen] = useState(false);
    const [musicSearchTerm, setMusicSearchTerm] = useState("");
    const [allSongs, setAllSongs] = useState([]); 
    const [loadingSongs, setLoadingSongs] = useState(false);

    // --- NOVOS Estados do Modal de Remover Músicas ---
    const [removeMusicModalOpen, setRemoveMusicModalOpen] = useState(false);
    const [removeSearchTerm, setRemoveSearchTerm] = useState("");

    const handleSortSelect = (key) => {
        onSortChange(key);
        setSortAnchorEl(null);
    };

    // ================== LÓGICA DE ADICIONAR ==================
    const handleOpenAddMusicModal = async () => {
        setAddMusicModalOpen(true);
        setOptionsAnchorEl(null); 
        if (allSongs.length > 0) return;
        try {
            setLoadingSongs(true);
            const response = await mongoApi.get('/songs'); 
            if (response.data) setAllSongs(response.data);
        } catch (error) {
            console.error("Erro ao carregar músicas:", error);
        } finally {
            setLoadingSongs(false);
        }
    };

    const handleCloseAddMusicModal = () => {
        setAddMusicModalOpen(false);
        setMusicSearchTerm("");
    };

    const handleAddSongToCurrentPlaylist = async (songId, songTitle) => {
        if (!user || !playlistId) return;
        try {
            await dispatch(addSongToPlaylistAsync({ playlistId, songId })).unwrap();
            window.location.reload();
        } catch (error) {
            alert("Erro ao adicionar música: " + (error.message || error));
        }
    };

    const filteredSongsToAdd = allSongs.filter(song => {
        if (!musicSearchTerm) return false; 
        const term = musicSearchTerm.toLowerCase();
        const title = song.title ? song.title.toLowerCase() : '';
        const artist = (typeof song.artist === 'string' ? song.artist : song.artist?.name) || '';
        return title.includes(term) || artist.toLowerCase().includes(term);
    });

    // ================== NOVA LÓGICA DE REMOVER ==================
    const handleOpenRemoveMusicModal = () => {
        setRemoveMusicModalOpen(true);
        setOptionsAnchorEl(null);
    };

    const handleCloseRemoveMusicModal = () => {
        setRemoveMusicModalOpen(false);
        setRemoveSearchTerm("");
    };

    const handleRemoveSongFromPlaylist = async (songId) => {
        if (!confirm("Tem certeza que deseja remover esta música da playlist?")) return;

        try {
            // Despacha a ação de remover (assumindo que você criou essa action no Redux)
            await dispatch(removeSongFromPlaylistAsync({ playlistId, songId })).unwrap();
            
            // Recarrega a página imediatamente após remover
            window.location.reload();
        } catch (error) {
            alert("Erro ao remover música: " + (error.message || error));
        }
    };

    // Filtra as músicas QUE JÁ ESTÃO na playlist para exibir na lista de remoção
    const filteredSongsToRemove = playlistSongs.filter(song => {
        const term = removeSearchTerm.toLowerCase();
        const title = song.title ? song.title.toLowerCase() : '';
        const artist = (typeof song.artist === 'string' ? song.artist : song.artist?.name) || '';
        return title.includes(term) || artist.toLowerCase().includes(term);
    });

    // ================== OUTROS HANDLERS ==================
    const handleOpenShareModal = () => {
        setOptionsAnchorEl(null);
        setShareModalOpen(true);
    };
    const handleCloseShareModal = () => {
        setShareModalOpen(false);
        setCopied(false);
    };
    const handleCopyLink = () => {
        const shareLink = `${window.location.origin}/playlist/${playlistId}`;
        navigator.clipboard.writeText(shareLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); 
        }).catch(err => alert('Erro ao copiar.'));
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px', mb: '30px', px: '20px' }}>
            <PlayButton onClick={onPlay} disabled={isDisabled}>
                {isPlaying ? <PauseIcon sx={{ fontSize: '32px' }} /> : <PlayArrowIcon sx={{ fontSize: '32px' }} />}
            </PlayButton>
            
            {/* Botão Atalho Adicionar */}
            {isOwner && isCustom && (
                <ActionIcon onClick={handleOpenAddMusicModal} title="Adicionar músicas">
                    <AddIcon sx={{ fontSize: '28px' }} />
                </ActionIcon>
            )}

            <ActionIcon onClick={(e) => setOptionsAnchorEl(e.currentTarget)}>
                <MoreVertIcon sx={{ fontSize: '20px' }} />
            </ActionIcon>

            {/* Menu Dropdown */}
            <Menu anchorEl={optionsAnchorEl} open={Boolean(optionsAnchorEl)} onClose={() => setOptionsAnchorEl(null)} PaperProps={{ sx: { bgcolor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                <MenuItem onClick={handleOpenShareModal}>
                    <ShareIcon sx={{ mr: 1, fontSize: '18px' }} /> Compartilhar
                </MenuItem>
                
                {isOwner && isCustom && (
                    <MenuItem onClick={handleOpenRemoveMusicModal}>
                        <RemoveCircleIcon sx={{ mr: 1, fontSize: '18px' }} /> Remover Músicas
                    </MenuItem>
                )}

                {isOwner && isCustom && <Divider sx={{ my: 1, bgcolor: 'var(--border-color)' }} />}
                
                {isOwner && isCustom && (
                    <MenuItem onClick={() => { setOptionsAnchorEl(null); onDelete(); }} sx={{color: 'red'}}>
                        <DeleteIcon sx={{ mr: 1, fontSize: '18px' }} /> Excluir Playlist
                    </MenuItem>
                )}
            </Menu>
            
            {/* Sort Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: '10px' }}>
                <SortButton onClick={(e) => setSortAnchorEl(e.currentTarget)} endIcon={<i className="fas fa-chevron-down" style={{ fontSize: '12px' }} />}>
                    <i className="fas fa-list-ul" style={{ fontSize: '18px', color: sortKey !== 'custom' ? 'var(--orange)' : INACTIVE_ICON_COLOR }} /> {sortOptions[sortKey]}
                </SortButton>
                <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={() => setSortAnchorEl(null)} PaperProps={{ sx: { bgcolor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                    {Object.entries(sortOptions).map(([key, label]) => (
                        <MenuItem key={key} onClick={() => handleSortSelect(key)} selected={sortKey === key} disabled={!isCustom && key === 'custom'}>
                            {label}
                        </MenuItem>
                    ))}
                </Menu>
            </Box>

            {/* --- MODAL DE ADICIONAR MÚSICAS --- */}
            <Dialog 
                open={addMusicModalOpen} 
                onClose={handleCloseAddMusicModal}
                fullWidth maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: '12px' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    Adicionar à playlist
                    <IconButton onClick={handleCloseAddMusicModal} sx={{ color: 'var(--secondary-text-color)' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, p: 0 }}>
                    <div style={{ padding: '16px' }}>
                        <TextField
                            fullWidth variant="outlined" placeholder="Buscar músicas para adicionar..."
                            value={musicSearchTerm} onChange={(e) => setMusicSearchTerm(e.target.value)}
                            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'var(--secondary-text-color)', mr: 1 }} /> }}
                            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', '& fieldset': { borderColor: 'var(--border-color)' }, '&.Mui-focused fieldset': { borderColor: COR_LARANJA } } }}
                        />
                    </div>
                    <List sx={{ width: '100%', pt: 0, pb: 0, maxHeight: '400px', overflowY: 'auto' }}>
                        {loadingSongs && <Typography sx={{ p: 2, textAlign: 'center', color: 'var(--secondary-text-color)' }}>Carregando...</Typography>}
                        {!loadingSongs && filteredSongsToAdd.map((song) => {
                             let artistName = "Desconhecido";
                             if (song.artists && song.artists.length > 0) artistName = song.artists[0].name || song.artists[0];
                             else if (song.artist) artistName = song.artist.name || song.artist;
                             return (
                                <ListItem button key={song._id || song.id} onClick={() => handleAddSongToCurrentPlaylist(song._id || song.id, song.title)} sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}>
                                    <ListItemAvatar>
                                        <Avatar src={song.cover || song.album?.cover} variant="square" sx={{ borderRadius: '4px', bgcolor: 'var(--sidebar-bg)' }}><MusicNoteIcon /> </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText primary={song.title} secondary={artistName} primaryTypographyProps={{ style: { color: 'var(--text-color)' } }} secondaryTypographyProps={{ style: { color: 'var(--secondary-text-color)' } }} />
                                    <IconButton size="small" sx={{color: COR_LARANJA}}><AddIcon /></IconButton>
                                </ListItem>
                            )
                        })}
                    </List>
                </DialogContent>
            </Dialog>

            {/* --- NOVO: MODAL DE REMOVER MÚSICAS --- */}
            <Dialog 
                open={removeMusicModalOpen} 
                onClose={handleCloseRemoveMusicModal}
                fullWidth maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: '12px' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    Remover da playlist
                    <IconButton onClick={handleCloseRemoveMusicModal} sx={{ color: 'var(--secondary-text-color)' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent sx={{ mt: 2, p: 0 }}>
                    <div style={{ padding: '16px' }}>
                        <TextField
                            fullWidth variant="outlined" placeholder="Buscar na playlist..."
                            value={removeSearchTerm} onChange={(e) => setRemoveSearchTerm(e.target.value)}
                            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'var(--secondary-text-color)', mr: 1 }} /> }}
                            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: 'var(--input-bg)', color: 'var(--text-color)', '& fieldset': { borderColor: 'var(--border-color)' }, '&.Mui-focused fieldset': { borderColor: 'red' } } }}
                        />
                    </div>
                    
                    <List sx={{ width: '100%', pt: 0, pb: 0, maxHeight: '400px', overflowY: 'auto' }}>
                        {playlistSongs.length === 0 && (
                            <Typography sx={{ p: 2, textAlign: 'center', color: 'var(--secondary-text-color)' }}>
                                Esta playlist está vazia.
                            </Typography>
                        )}

                        {filteredSongsToRemove.map((song) => {
                             let artistName = "Desconhecido";
                             if (song.artists && song.artists.length > 0) artistName = song.artists[0].name || song.artists[0];
                             else if (song.artist) artistName = song.artist.name || song.artist;

                             return (
                                <ListItem 
                                    key={song._id || song.id} 
                                    // Não é clicável o item inteiro para evitar clique acidental, apenas o botão
                                    sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}
                                >
                                    <ListItemAvatar>
                                        <Avatar src={song.cover || song.album?.cover} variant="square" sx={{ borderRadius: '4px', bgcolor: 'var(--sidebar-bg)' }}><MusicNoteIcon /> </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={song.title} 
                                        secondary={artistName}
                                        primaryTypographyProps={{ style: { color: 'var(--text-color)' } }}
                                        secondaryTypographyProps={{ style: { color: 'var(--secondary-text-color)' } }}
                                    />
                                    <IconButton 
                                        onClick={() => handleRemoveSongFromPlaylist(song._id || song.id)}
                                        title="Remover música"
                                        sx={{color: 'var(--secondary-text-color)', '&:hover': { color: 'red' }}}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItem>
                            )
                        })}

                         {playlistSongs.length > 0 && filteredSongsToRemove.length === 0 && (
                            <Typography sx={{ p: 2, textAlign: 'center', color: 'var(--secondary-text-color)' }}>
                                Nenhuma música encontrada.
                            </Typography>
                        )}
                    </List>
                </DialogContent>
            </Dialog>

            {/* --- Modal de Compartilhar --- */}
            <Dialog open={shareModalOpen} onClose={handleCloseShareModal} PaperProps={{ sx: { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                <DialogTitle sx={{ color: 'var(--text-color)' }}>
                    Compartilhar Playlist
                    <IconButton onClick={handleCloseShareModal} sx={{ position: 'absolute', right: 8, top: 8, color: 'var(--secondary-text-color)' }}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom sx={{ color: 'var(--text-color)' }}>Link para compartilhar esta playlist:</Typography>
                    <TextField fullWidth variant="outlined" value={`${window.location.origin}/playlist/${playlistId}`} sx={{ '& .MuiInputBase-input': { color: 'var(--input-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, backgroundColor: 'var(--input-bg)' } }} InputProps={{ readOnly: true }} />
                </DialogContent>
                <DialogActions sx={{ p: '16px' }}>
                    <Button onClick={handleCopyLink} variant="contained" sx={{ backgroundColor: COR_LARANJA }}>{copied ? 'Copiado!' : 'Copiar Link'}</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}