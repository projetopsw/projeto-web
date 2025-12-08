import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    Switch,
    FormControlLabel,
    CircularProgress
} from '@mui/material';
import api from '../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserPlaylistsDetail } from '../../redux/loginSlice'; 

const LIKED_SONGS_COVER = '/assets/img/liked_cover_0.png';
const DEFAULT_PLAYLIST_COVER = '/assets/img/vibe_cover_2.png'; 

const LIKED_SONGS_PLAYLIST_TEMPLATE = {
    id: "0",
    name: "Músicas Curtidas",
    img: LIKED_SONGS_COVER,
    type: "Playlist Especial",
    description: "Todas as músicas que você curtiu.",
    creator: "Você",
    songCount: 0,
    duration: "0 músicas",
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


function Playlists() {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    const user = useSelector(state => state.user?.user) || useSelector(state => state.auth?.user);
    const USER_ID = user?.id || user?._id;
    
    // Contagem de likes do Redux para manter atualizado em tempo real
    const reduxLikedCount = user?.likedSongs?.length || 0;

    const [playlists, setPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
    const [newPlaylistCoverUrl, setNewPlaylistCoverUrl] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const fetchPlaylists = async () => {
        if (!USER_ID) {
            setIsLoading(false);
            return;
        }

        try {
            // ESTRATÉGIA NOVA: Busca todas as playlists do usuário de uma vez só.
            // Isso evita buscar IDs órfãos que geram erro 404.
            const response = await api.get('/playlists'); 
            const allPlaylists = response.data;

            // 1. Encontra a playlist real de "Músicas Curtidas" no banco
            const dbLikedPlaylist = allPlaylists.find(p => p.isLikedSongs);
            
            // 2. Separa as playlists customizadas
            const customPlaylists = allPlaylists.filter(p => !p.isLikedSongs);

            // 3. Monta o card de Músicas Curtidas
            let likedPlaylistDisplay = { ...LIKED_SONGS_PLAYLIST_TEMPLATE };
            
            if (dbLikedPlaylist) {
                // Se já existe no banco, usamos os dados reais
                likedPlaylistDisplay = {
                    ...LIKED_SONGS_PLAYLIST_TEMPLATE,
                    id: dbLikedPlaylist._id, // ID real do banco (importante!)
                    songCount: dbLikedPlaylist.songs?.length || 0,
                    duration: `${dbLikedPlaylist.songs?.length || 0} músicas`
                };
            } else {
                // Se não existe (ainda não curtiu nada ou lazy creation), usamos o contador do User
                likedPlaylistDisplay.songCount = reduxLikedCount;
                likedPlaylistDisplay.duration = `${reduxLikedCount} músicas`;
            }

            // 4. Formata as playlists customizadas para exibição
            const formattedCustomPlaylists = customPlaylists.map(p => ({
                id: p._id,
                name: p.name,
                img: p.cover || DEFAULT_PLAYLIST_COVER,
                description: p.description,
                creator: 'Você',
                songCount: p.songs ? p.songs.length : 0,
                duration: `${p.songs ? p.songs.length : 0} músicas`
            }));

            // Combina tudo: Curtidas primeiro, depois as outras
            setPlaylists([likedPlaylistDisplay, ...formattedCustomPlaylists]);

            // Atualiza o Redux em background para manter a Sidebar sincronizada
            dispatch(fetchUserPlaylistsDetail(USER_ID));

        } catch (error) {
            console.error("Erro ao buscar playlists:", error);
            // Em caso de erro total, mostra pelo menos a de curtidas vazia
            setPlaylists([LIKED_SONGS_PLAYLIST_TEMPLATE]);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Atualiza quando o ID do usuário muda ou quando ele curte algo novo (mudando o contador)
    useEffect(() => {
        fetchPlaylists();
    }, [USER_ID, reduxLikedCount]); 

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        if (query.get('openCreateModal') === 'true') {
            handleOpen();
        }
    }, [location.search]);
    

    const handleOpen = () => {
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setNewPlaylistCoverUrl('');
        setIsPublic(false);
        setIsModalOpen(true);
    }
    
    const handleClose = () => {
        if (!isCreating) setIsModalOpen(false);
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
                const coverUrlTrimmed = newPlaylistCoverUrl.trim();
                const cover = coverUrlTrimmed === '' ? DEFAULT_PLAYLIST_COVER : coverUrlTrimmed; 

                const newPlaylist = {
                    name: title, // Backend espera "name"
                    description: newPlaylistDescription.trim() || `Playlist criada por ${user?.name || user?.username || 'usuário'}.`,
                    cover: cover,
                    isPublic: isPublic 
                };

                const response = await api.post('/playlists', newPlaylist);
                
                // O backend retorna a playlist criada (verifique se vem em response.data ou response.data.playlist)
                const createdData = response.data.playlist || response.data;
                const createdPlaylistId = createdData._id;

                await fetchPlaylists(); // Recarrega a lista
                
                setIsModalOpen(false);
                navigate(`/playlist/${createdPlaylistId}`);

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
        // Se o ID for o "0" (template), navegamos para a rota especial
        if (id === "0") navigate('/playlist/0');
        else navigate(`/playlist/${id}`);
    };

    return (
        <main className="content-area playlist-page">
            <Typography variant="h1" component="h1" sx={{ 
                color: 'var(--text-color)', 
                fontSize: '2.5rem', 
                marginBottom: '40px',
                paddingLeft: '0px'
            }}>Minhas Playlists</Typography>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                    <CircularProgress sx={{ color: 'var(--orange)' }} />
                </Box>
            ) : (
                <Box className="playlists-container"> 
                    
                    {/* Card de Nova Playlist */}
                    <div className="box-playlist add-playlist" onClick={handleOpen}>
                        <button className="btn-add-playlist" disabled={isCreating}>
                            <i className="fas fa-plus" style={{ color: 'var(--text-color)', fontSize: '40px' }}></i>
                        </button>
                        <p style={{ color: 'var(--text-color)', marginTop: '10px', fontWeight: 'bold' }}>
                            Nova Playlist
                        </p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--secondary-text-color)', fontWeight: 'normal' }}>
                            Crie e personalize
                        </p>
                    </div>

                    {/* Lista de Playlists */}
                    {playlists.map((playlist) => (
                        <div
                            key={playlist.id}
                            className="box-playlist" 
                            onClick={() => navigateToDetail(playlist.id)}
                        >
                            <img 
                                src={playlist.img} 
                                alt={`Capa Playlist: ${playlist.name}`} 
                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_PLAYLIST_COVER; }}
                                style={{ objectFit: 'cover' }}
                            />
                            
                            <p title={playlist.name}>
                                {playlist.name}
                            </p>
                            
                            <p style={{ fontWeight: 'normal', fontSize: '0.9rem' }}>
                                {playlist.songCount} músicas
                            </p>
                        </div>
                    ))}
                </Box>
            )}

            {/* Modal de Criação */}
            <Modal
                open={isModalOpen}
                onClose={handleClose}
                aria-labelledby="modal-title"
            >
                <Box sx={ModalStyle} component="form" onSubmit={handleCreatePlaylist}>
                    <Typography id="modal-title" variant="h6" component="h2" sx={{ color: 'var(--orange)', mb: 2 }}>
                        Criar Nova Playlist
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: '20px', marginBottom: 2, alignItems: 'center' }}>
                        <img 
                            src={newPlaylistCoverUrl.trim() || DEFAULT_PLAYLIST_COVER} 
                            alt="Preview da Capa" 
                            onError={(e) => { e.target.src = DEFAULT_PLAYLIST_COVER; }} 
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                        <TextField
                            label="URL da Capa"
                            value={newPlaylistCoverUrl} 
                            onChange={(e) => setNewPlaylistCoverUrl(e.target.value)}
                            fullWidth
                            margin="none"
                            sx={{ input: { color: 'var(--text-color)' }, '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, '&:hover fieldset': { borderColor: 'var(--orange)' }, '&.Mui-focused fieldset': { borderColor: 'var(--orange)' }, backgroundColor: 'var(--input-bg)' } }}
                            disabled={isCreating}
                            helperText="Deixe vazio para usar a capa padrão."
                        />
                    </Box>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Nome da Playlist"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        required
                        sx={{ input: { color: 'var(--text-color)' }, '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, '&:hover fieldset': { borderColor: 'var(--orange)' }, '&.Mui-focused fieldset': { borderColor: 'var(--orange)' }, backgroundColor: 'var(--input-bg)' } }}
                        disabled={isCreating}
                    />
                    
                    <TextField
                        label="Descrição (Opcional)"
                        value={newPlaylistDescription}
                        onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        fullWidth
                        multiline
                        rows={2}
                        margin="normal"
                        sx={{ textarea: { color: 'var(--text-color)' }, '& .MuiInputLabel-root': { color: 'var(--secondary-text-color)' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'var(--border-color)' }, '&:hover fieldset': { borderColor: 'var(--orange)' }, '&.Mui-focused fieldset': { borderColor: 'var(--orange)' }, backgroundColor: 'var(--input-bg)' } }}
                        disabled={isCreating}
                    />
                    
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--orange)' }, '& .MuiSwitch-track': { backgroundColor: 'var(--secondary-text-color)' } }}
                            />
                        }
                        label={<Typography sx={{ color: 'var(--text-color)' }}>Playlist Pública</Typography>}
                        sx={{ marginTop: 1, marginBottom: 2 }}
                        disabled={isCreating}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, marginTop: 3 }}>
                        <Button onClick={handleClose} sx={{ color: 'var(--secondary-text-color)' }} disabled={isCreating}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={!newPlaylistName.trim() || isCreating}
                            sx={{ backgroundColor: 'var(--orange)', '&:hover': { backgroundColor: '#cc612a' } }}
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