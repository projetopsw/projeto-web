import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    styled
} from '@mui/material';
import api from '../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserPlaylistsDetail } from '../../redux/loginSlice'; 

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

const PlaylistBox = styled('div')({
    width: '220px', 
    marginBottom: '25px', 
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.2s ease',
    '&:hover': {
        cursor: 'pointer',
        transform: 'scale(1.08)',
    },
    
    '& .box-content': {
        backgroundColor: 'var(--card-bg-light)', 
        borderRadius: '8px',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%', 
    },
    
    '& .image-container img': {
        width: '100%',
        height: '180px', 
        objectFit: 'cover',
        borderRadius: '6px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    },
    
    '& p': {
        marginTop: '10px',
        fontWeight: 'bold',
        fontSize: '1rem',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
});

function Playlists() {
    const dispatch = useDispatch();
    const location = useLocation();
    
    const user = useSelector(state => state.user?.user);
    const userPlaylistsDetail = useSelector(state => state.auth?.userPlaylistsDetail);
    const USER_ID = user?.id || user?._id; 
    const userLikedSongs = user?.likedSongs || []; 

    const [playlists, setPlaylists] = useState([]); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    const fetchPlaylists = async () => {
        if (!USER_ID) return; 

        try {
            const userResponse = await api.get(`/users/${USER_ID}`);
            const userData = userResponse.data;
            const userPlaylistsIds = userData.userPlaylists || [];
            
            const likedSongsCount = (userData.likedSongs || []).filter(id => id).length; 

            const playlistsPromises = userPlaylistsIds.map(id => api.get(`/userPlaylists/${id}`));
            const playlistsResponses = await Promise.all(playlistsPromises);
            let userAllPlaylists = playlistsResponses.map(res => res.data);
            
            let userCustomPlaylists = userAllPlaylists.filter(p => String(p.id || p._id) !== String(LIKED_SONGS_PLAYLIST.id));

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
        const name = newPlaylistName.trim();
        
        if (!USER_ID) {
            alert("Faça login para criar uma playlist.");
            return;
        }

        if (name) {
            try {
                const newPlaylist = {
                    name,
                    creatorId: USER_ID,
                    img: DEFAULT_PLAYLIST_COVER, 
                    type: "Playlist do Usuário",
                    description: `Playlist criada por ${user.name || 'usuário'}.`, 
                    songs: [], 
                    duration: "0 min",
                    songCount: 0,
                };
                
                const response = await api.post('/userPlaylists', newPlaylist);
                const createdPlaylist = response.data;

                const userResponse = await api.get(`/users/${USER_ID}`);
                const currentUserPlaylists = userResponse.data.userPlaylists || [];
                
                const updatedPlaylistsList = [...currentUserPlaylists, createdPlaylist.id];

                await api.patch(`/users/${USER_ID}`, { userPlaylists: updatedPlaylistsList });
                
                fetchPlaylists(); 
                handleClose();

            } catch (error) {
                console.error("Erro ao criar playlist:", error);
                alert("Não foi possível criar a playlist. Verifique a conexão com o json-server.");
            }
        }
    };


    return (
        <main className="content-area">
            <h1>Minhas Playlists</h1>

            <Box className="playlists-container" sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '25px', 
                padding: '10px 0' 
            }}>
                
                <PlaylistBox onClick={handleOpen}>
                    <div className="box-content" style={{ 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%', 
                    }}>
                        <button className="btn-add-playlist" style={{ 
                            fontSize: '40px', 
                            color: 'var(--orange)', 
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                        }}>
                            <i className="fas fa-plus"></i>
                        </button>
                        <p style={{ color: 'var(--secondary-text-color)', marginTop: '15px' }}>Nova Playlist</p>
                    </div>
                </PlaylistBox>

                {playlists.map((playlist) => (
                    <Link
                        key={playlist.id}
                        to={`/playlists/${playlist.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <PlaylistBox>
                            <div className="box-content">
                                <div className="image-container">
                                    <img src={playlist.img} alt={`IMG Playlist: ${playlist.name}`} />
                                </div>
                                <p>{playlist.name}</p>
                            </div>
                        </PlaylistBox>
                    </Link>
                ))}
            </Box>

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
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                            onClick={handleClose}
                            sx={{ color: 'var(--secondary-text-color)' }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!newPlaylistName.trim()}
                            sx={{
                                backgroundColor: 'var(--orange)',
                                '&:hover': { backgroundColor: '#cc612a' }
                            }}
                        >
                            Criar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </main>
    );
}

export default Playlists;