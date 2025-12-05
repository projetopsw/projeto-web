// src/pages/Playlists.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
} from '@mui/material';
import api from '../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserPlaylistsDetail } from '../../redux/loginSlice'; 

// --- Configurações de Playlists Estáticas ---
const LIKED_SONGS_COVER = '/assets/img/liked_cover_0.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/vacateste.jpg';

const LIKED_SONGS_PLAYLIST = {
    id: "0",
    name: "Músicas Curtidas",
    img: LIKED_SONGS_COVER,
    type: "Playlist Especial",
    description: "Todas as músicas que você curtiu.",
    creator: "Você",
    songCount: 0, 
    duration: "0 min",
};

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
// --- FIM Configurações de Playlists Estáticas ---


function Playlists() {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate(); 

    const user = useSelector(state => state.user?.user);
    const USER_ID = user?.id || user?._id; 
    const userLikedSongs = user?.likedSongs || []; 

    const [playlists, setPlaylists] = useState([]); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [isCreating, setIsCreating] = useState(false); 

    // --- Lógica de Fetch e Handlers (MANTIDO) ---

    const fetchPlaylists = async () => {
        if (!USER_ID) return; 

        try {
            const userResponse = await api.get(`/users/${USER_ID}`);
            const userData = userResponse.data;
            const userPlaylistsIds = userData.userPlaylists || [];
            
            const likedSongsCount = (userData.likedSongs || []).filter(id => id).length; 

            const playlistsPromises = userPlaylistsIds.map(async id => {
                try {
                    const res = await api.get(`/playlists/${id}`);
                    const playlistData = res.data;
                    const songsCount = playlistData.songs ? playlistData.songs.length : 0;
                    
                    return {
                        id: playlistData._id,
                        name: playlistData.title,
                        img: playlistData.cover || DEFAULT_PLAYLIST_COVER,
                        description: playlistData.description,
                        creator: playlistData.user?.username || 'Usuário',
                        songCount: songsCount,
                        duration: `${songsCount} músicas`,
                    };
                } catch (e) {
                    return null;
                }
            });
            
            let userCustomPlaylists = (await Promise.all(playlistsPromises)).filter(p => p !== null);
            
            const updatedLikedPlaylist = {
                ...LIKED_SONGS_PLAYLIST,
                songCount: likedSongsCount,
                duration: `${likedSongsCount} músicas`
            };

            const finalPlaylists = [updatedLikedPlaylist, ...userCustomPlaylists];
            setPlaylists(finalPlaylists);

            dispatch(fetchUserPlaylistsDetail(USER_ID)); 

        } catch (error) {
            console.error("Erro ao buscar playlists:", error);
            setPlaylists([LIKED_SONGS_PLAYLIST]); 
        }
    };
    
    useEffect(() => {
        fetchPlaylists();
    }, [USER_ID, userLikedSongs.length]); 

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        if (query.get('openCreateModal') === 'true') {
            handleOpen();
        }
    }, [location.search]);

    const handleOpen = () => setIsModalOpen(true);
    const handleClose = () => {
        setIsModalOpen(false);
        setNewPlaylistName('');
    }

    const handleCreatePlaylist = async (e) => {
        e.preventDefault();
        const title = newPlaylistName.trim();
        
        if (!USER_ID) {
            alert("Faça login para criar uma playlist.");
            return;
        }

        if (title) {
            setIsCreating(true);
            try {
                const newPlaylist = {
                    title,
                    description: `Playlist criada por ${user?.name || user?.username || 'usuário'}.`,
                };
                
                await api.post('/playlists', newPlaylist); 
                
                fetchPlaylists(); 
                handleClose();

            } catch (error) {
                console.error("Erro ao criar playlist:", error);
                const detail = error?.response?.data?.message || error.message || '';
                alert(`Não foi possível criar a playlist. Detalhe: ${detail}`);
            } finally {
                setIsCreating(false);
            }
        }
    };

    const navigateToDetail = (id) => {
        navigate(`/playlist/${id}`);
    };

    // --- RENDERIZAÇÃO MELHORADA ---

    return (
        <main className="content-area playlist-page">
            <Typography variant="h1" component="h1" sx={{ 
                // Usando sx para garantir que o título tenha a cor e tamanho certos
                color: 'var(--text-color)', 
                fontSize: '2.5rem', 
                marginBottom: '40px',
                paddingLeft: '0px' // O padding será controlado pelo main.playlist-page
            }}>Minhas Playlists</Typography>

            <Box className="playlists-container"> 
                
                {/* 1. BLOCo DE CRIAÇÃO (Card) */}
                <div className="box-playlist add-playlist" onClick={handleOpen}>
                    <button className="btn-add-playlist" disabled={isCreating}>
                        {isCreating 
                            ? <i className="fas fa-spinner fa-spin" style={{ color: 'var(--text-color)', fontSize: '40px' }}></i>
                            : <i className="fas fa-plus" style={{ color: 'var(--text-color)', fontSize: '40px' }}></i>
                        }
                    </button>
                    {/* Título (Primeiro P) */}
                    <p style={{ color: 'var(--text-color)', marginTop: '10px', fontWeight: 'bold' }}>
                        Nova Playlist
                    </p>
                    {/* Subtítulo discreto (Segundo P) */}
                    <p style={{ fontSize: '0.9rem', color: 'var(--secondary-text-color)', fontWeight: 'normal' }}>
                        Crie e personalize
                    </p>
                </div>

                {/* 2. LISTAGEM DAS PLAYLISTS (Cards) */}
                {playlists.map((playlist) => (
                    <div
                        key={playlist.id}
                        className="box-playlist" 
                        onClick={() => navigateToDetail(playlist.id)}
                    >
                        {/* Imagem da Playlist */}
                        <img 
                            src={playlist.img} 
                            alt={`Capa Playlist: ${playlist.name}`} 
                        />
                        
                        {/* Título (Primeiro P - herda bold e text-color) */}
                        <p title={playlist.name}>
                            {playlist.name}
                        </p>
                        
                        {/* Sub-texto/Contagem (Segundo P - herda secondary-text-color) */}
                        <p style={{ 
                            fontWeight: 'normal',
                            fontSize: '0.9rem',
                        }}>
                            {playlist.songCount} músicas
                        </p>
                    </div>
                ))}
            </Box>

            {/* Modal de Criação (MANTIDO) */}
            <Modal
                open={isModalOpen}
                onClose={handleClose}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={ModalStyle} component="form" onSubmit={handleCreatePlaylist}>
                    <Typography
                        id="modal-title"
                        variant="h6"
                        component="h2"
                        sx={{ color: 'var(--orange)', mb: 2 }}
                    >
                        Criar Nova Playlist
                    </Typography>

                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Nome da Playlist"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        InputLabelProps={{ style: { color: 'var(--secondary-text-color)' } }}
                        InputProps={{ style: { color: 'var(--text-color)', border: '1px solid var(--border-color)' } }}
                        sx={{ mb: 3 }}
                        disabled={isCreating}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            onClick={handleClose}
                            sx={{ color: 'var(--secondary-text-color)' }}
                            disabled={isCreating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!newPlaylistName.trim() || isCreating}
                            sx={{
                                backgroundColor: 'var(--orange)',
                                '&:hover': { backgroundColor: '#cc612a' }
                            }}
                        >
                            {isCreating ? 'Criando...' : 'Criar'}
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </main>
    );
}

export default Playlists;