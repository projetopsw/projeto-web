import React, { useState, useEffect } from 'react';
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
    Add as AddIcon, // Ícone para adicionar músicas
    Search as SearchIcon,
    MusicNote as MusicNoteIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux'; // Necessário para despachar a ação
import { addSongToPlaylistAsync, fetchUserPlaylistsDetail } from '../../redux/loginSlice'; // Suas ações
import mongoApi from '../../services/mongoApi'; // Para buscar as músicas disponíveis

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';
const COR_LARANJA = 'var(--orange)';

// ... (Estilos PlayButton, ActionIcon, SortButton mantidos iguais) ...
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
    playlistId // ID DA PLAYLIST ATUAL
}) {
    const dispatch = useDispatch();
    const user = useSelector(state => state.user?.user || state.auth?.user);

    const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
    const [sortAnchorEl, setSortAnchorEl] = useState(null);

    // --- Estados do Modal de Compartilhar ---
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    // --- Estados do Novo Modal de Adicionar Músicas ---
    const [addMusicModalOpen, setAddMusicModalOpen] = useState(false);
    const [musicSearchTerm, setMusicSearchTerm] = useState("");
    const [allSongs, setAllSongs] = useState([]); // Lista para guardar as músicas do banco
    const [loadingSongs, setLoadingSongs] = useState(false);

    const handleSortSelect = (key) => {
        onSortChange(key);
        setSortAnchorEl(null);
    };

    // --- Lógica: Carregar músicas quando abrir o modal ---
    const handleOpenAddMusicModal = async () => {
        setAddMusicModalOpen(true);
        setOptionsAnchorEl(null); // Fecha o menu se foi aberto por lá
        
        // Se já carregou antes, não carrega de novo para economizar
        if (allSongs.length > 0) return;

        try {
            setLoadingSongs(true);
            // Busca todas as músicas para permitir a pesquisa local
            // (Idealmente, se tiver MUITAS músicas, faça uma busca no backend via API search)
            const response = await mongoApi.get('/songs'); 
            if (response.data) {
                setAllSongs(response.data);
            }
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

    // --- Lógica: Adicionar Música Escolhida ---
    const handleAddSongToCurrentPlaylist = async (songId, songTitle) => {
        if (!user || !playlistId) return;

        try {
            await dispatch(addSongToPlaylistAsync({
                playlistId: playlistId,
                songId: songId
            })).unwrap();

            alert(`"${songTitle}" adicionada à playlist!`);
            
            // Atualiza a playlist na tela para mostrar a nova música
            if (user.id || user._id) {
                dispatch(fetchUserPlaylistsDetail(user.id || user._id));
            }
            // Opcional: Fechar modal após adicionar? 
            // handleCloseAddMusicModal(); 
        } catch (error) {
            alert("Erro ao adicionar música: " + (error.message || error));
        }
    };

    // --- Filtro de Músicas ---
    const filteredSongs = allSongs.filter(song => {
        if (!musicSearchTerm) return false; // Só mostra se digitar algo (opcional)
        const term = musicSearchTerm.toLowerCase();
        const title = song.title ? song.title.toLowerCase() : '';
        const artist = (typeof song.artist === 'string' ? song.artist : song.artist?.name) || '';
        
        return title.includes(term) || artist.toLowerCase().includes(term);
    });

    // --- Handlers de Compartilhamento (iguais ao anterior) ---
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
            
            {/* NOVO: Botão de Adicionar Músicas (Só aparece se for dono e custom) */}
            {isOwner && isCustom && (
                <ActionIcon onClick={handleOpenAddMusicModal} title="Adicionar músicas">
                    <AddIcon sx={{ fontSize: '28px' }} />
                </ActionIcon>
            )}

            <ActionIcon onClick={(e) => setOptionsAnchorEl(e.currentTarget)}>
                <MoreVertIcon sx={{ fontSize: '20px' }} />
            </ActionIcon>

            {/* Menu de Opções */}
            <Menu anchorEl={optionsAnchorEl} open={Boolean(optionsAnchorEl)} onClose={() => setOptionsAnchorEl(null)} PaperProps={{ sx: { bgcolor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                <MenuItem onClick={handleOpenShareModal}>
                    <ShareIcon sx={{ mr: 1, fontSize: '18px' }} /> Compartilhar
                </MenuItem>
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
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { backgroundColor: 'var(--card-bg)', color: 'var(--text-color)', borderRadius: '12px' } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    Adicionar à playlist
                    <IconButton onClick={handleCloseAddMusicModal} sx={{ color: 'var(--secondary-text-color)' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <DialogContent sx={{ mt: 2, p: 0 }}>
                    <div style={{ padding: '16px' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Buscar músicas..."
                            value={musicSearchTerm}
                            onChange={(e) => setMusicSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <SearchIcon sx={{ color: 'var(--secondary-text-color)', mr: 1 }} />,
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'var(--input-bg)',
                                    color: 'var(--text-color)',
                                    '& fieldset': { borderColor: 'var(--border-color)' },
                                    '&.Mui-focused fieldset': { borderColor: COR_LARANJA },
                                }
                            }}
                        />
                    </div>

                    <List sx={{ width: '100%', pt: 0, pb: 0, maxHeight: '400px', overflowY: 'auto' }}>
                        {loadingSongs && (
                            <Typography sx={{ p: 2, textAlign: 'center', color: 'var(--secondary-text-color)' }}>Carregando catálogo...</Typography>
                        )}

                        {!loadingSongs && musicSearchTerm === "" && (
                             <Typography sx={{ p: 2, textAlign: 'center', color: 'var(--secondary-text-color)' }}>
                                Digite para buscar novas músicas.
                            </Typography>
                        )}

                        {filteredSongs.map((song) => {
                             // Tratamento de Artista para exibição segura
                             let artistName = "Desconhecido";
                             if (song.artists && song.artists.length > 0) artistName = song.artists[0].name || song.artists[0];
                             else if (song.artist) artistName = song.artist.name || song.artist;

                             return (
                                <ListItem 
                                    button 
                                    key={song._id || song.id} 
                                    onClick={() => handleAddSongToCurrentPlaylist(song._id || song.id, song.title)}
                                    sx={{ '&:hover': { backgroundColor: 'var(--button-hover-bg)' } }}
                                >
                                    <ListItemAvatar>
                                        <Avatar 
                                            src={song.cover || song.album?.cover} 
                                            variant="square" 
                                            sx={{ borderRadius: '4px', bgcolor: 'var(--sidebar-bg)' }}
                                        >
                                            <MusicNoteIcon /> 
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText 
                                        primary={song.title} 
                                        secondary={artistName}
                                        primaryTypographyProps={{ style: { color: 'var(--text-color)' } }}
                                        secondaryTypographyProps={{ style: { color: 'var(--secondary-text-color)' } }}
                                    />
                                    <IconButton size="small" sx={{color: COR_LARANJA}}>
                                        <AddIcon />
                                    </IconButton>
                                </ListItem>
                            )
                        })}

                        {!loadingSongs && musicSearchTerm !== "" && filteredSongs.length === 0 && (
                            <Typography sx={{ p: 2, textAlign: 'center', color: 'var(--secondary-text-color)' }}>
                                Nenhuma música encontrada.
                            </Typography>
                        )}
                    </List>
                </DialogContent>
            </Dialog>

            {/* --- Modal de Compartilhar (Já existente) --- */}
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