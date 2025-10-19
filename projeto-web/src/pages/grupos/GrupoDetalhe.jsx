import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; 
import { 
    addSingleSongToQueue, 
    removeSongFromQueue 
    // ❌ REMOVIDO: skipNext não é mais usado aqui, pois a lógica de onSongEnd foi para o MainLayout
} from '../../redux/playerSlice'; // Certifique-se que o caminho está correto

import { 
    Box, 
    Typography, 
    Divider, 
    List, 
    ListItem, 
    ListItemText, 
    Button, 
    Grid, 
    Paper,
    styled,
    CircularProgress 
} from '@mui/material';

// ❌ REMOVIDO: O Header agora é gerenciado pelo MainLayout
// import Header from '../../components/Header'; 
import SearchMusicLocal from '../../components/SearchMusic'; 
import UserCard from '../../components/UserCard'; 
import api from '../../services/api.js'; 
// ❌ REMOVIDO: O Player agora é gerenciado pelo MainLayout
// import Player from '../../components/Player'; 
import './Grupo.css'; 


// ----------------------------------------------------
// ESTILO para os Quadrados (Paper)
// ----------------------------------------------------

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    backgroundColor: 'var(--card-bg)',
    borderRadius: '12px',
    boxShadow: '0 4px 12px var(--shadow-color-dark)',
    
    '&.header-box': {
        height: 'auto', 
    },
    '&.queue-box': {
        flexGrow: 1, 
        overflowY: 'auto', 
        minHeight: 'calc(100vh - 280px)', 
    }
}));


function GrupoDetalhe() {
    const { id } = useParams(); 
    const dispatch = useDispatch(); 
    
    // Usar useSelector para obter o estado do player
    const queue = useSelector(state => state.player.queue || []);
    const currentSong = useSelector(state => state.player.currentSong);
    const queueIndex = useSelector(state => state.player.queueIndex);
    
    // Variáveis de estado principais
    const [group, setGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ----------------------------------------------------
    // FUNÇÕES DE BUSCA DE DADOS
    // ----------------------------------------------------

    const fetchGroupDetails = async () => {
        setIsLoading(true);
        try {
            const groupResponse = await api.get(`/groups/${id}`); 
            const groupData = groupResponse.data;
            
            setGroup(groupData);

            const usersResponse = await api.get('/users');
            const allUsers = usersResponse.data;

            const memberIds = groupData.members || []; 
            const membersData = memberIds
                .map(memberId => allUsers.find(user => user.id === memberId))
                .filter(member => member); 
            
            setGroupMembers(membersData);
            setError(null);

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            // Fallback (dados de mock)
            setGroup({ id, name: `Grupo ${id} (Mock)` });
            setGroupMembers([
                { id: '1', name: 'Bebel (Mock)' }, 
                { id: '2', name: 'Bia (Mock)' },
                { id: '3', name: 'IgorGodoy (Mock)' }
            ]);
            setError("Não foi possível carregar os dados completos. Usando dados padrão.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // ----------------------------------------------------
    // FUNÇÕES DE GESTÃO DA FILA (COM INTEGRAÇÃO REDUX)
    // ----------------------------------------------------

    const handleAddToQueue = (song) => {
        const isCurrentSong = currentSong && currentSong.id === song.id;
        
        if (isCurrentSong) {
            alert(`"${song.title}" já está tocando. Adicionando novamente à fila.`);
        }

        // Dispatch para adicionar.
        dispatch(addSingleSongToQueue(song));
    };
    
    const handleRemoveFromQueue = (songId) => {
        // Usa a ação do seu slice que lida com a remoção
        dispatch(removeSongFromQueue(songId));
    };
    
    // ❌ REMOVIDO: A função handleSongEnd foi movida para MainLayout
    /*
    const handleSongEnd = () => {
        console.log("Música atual finalizada. O MainLayout cuida do skipNext.");
        // Não é mais necessário o dispatch aqui.
    };
    */


    useEffect(() => {
        if (id) {
            fetchGroupDetails();
        }
    }, [id]);
    
    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-color)' }}>
                <CircularProgress sx={{ color: 'var(--orange)' }} />
                <Typography sx={{ ml: 2 }}>Carregando detalhes do grupo...</Typography>
            </Box>
        );
    }

    if (!group) {
        return <Typography sx={{ p: 5, color: 'red' }}>Grupo não encontrado.</Typography>;
    }
    
    // ----------------------------------------------------
    // RENDERIZAÇÃO
    // ----------------------------------------------------

    return (
        <>
            {/* ❌ REMOVIDO: Header. É renderizado no MainLayout. */}
            <main className="content-area" 
                style={{ 
                    padding: '20px 40px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    // Altura da main é ajustada para o MainLayout
                    minHeight: '100%' 
                }}
            >
                
                <Grid container spacing={4} sx={{ flexGrow: 1 }}>

                    {/* Quadrado 1: Nome do Grupo + Lista de Membros */}
                    <Grid item xs={12}>
                        <StyledPaper elevation={3} className="header-box">
                            <Box sx={{ mb: 1 }}>
                                <Typography variant="h4" sx={{ color: 'var(--title-color)', mb: 0.5 }}>
                                    {group.name}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ color: 'var(--orange)' }}>
                                    {groupMembers.length} {groupMembers.length === 1 ? 'Integrante' : 'Integrantes'}
                                </Typography>
                            </Box>
                            
                            <Divider sx={{ my: 1, borderColor: 'var(--border-color)' }} />

                            <Typography variant="body1" sx={{ color: 'var(--text-color)', mb: 0.5, fontWeight: 'bold' }}>
                                Membros:
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {groupMembers.length > 0 ? (
                                    groupMembers.map((member) => (
                                        <Typography 
                                            key={member.id}
                                            variant="body2" 
                                            sx={{ 
                                                color: 'var(--secondary-text-color)', 
                                                backgroundColor: 'var(--bg-light)', 
                                                padding: '2px 8px',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            {member.name}
                                        </Typography>
                                    ))
                                ) : (
                                    <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)' }}>
                                        Nenhum membro encontrado.
                                    </Typography>
                                )}
                            </Box>
                        </StyledPaper>
                    </Grid>

                    {/* Quadrado 2: Busca e Fila de Reprodução (SEM Player) */}
                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                        <StyledPaper elevation={3} className="queue-box">
                            <Typography variant="h5" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                🎵 Adicionar Música à Fila
                            </Typography>
                            
                            {/* 1. Barra de Pesquisa */}
                            <Box sx={{ mb: 4, position: 'relative' }}>
                                <SearchMusicLocal 
                                    onSongSelect={handleAddToQueue} 
                                />
                            </Box>
                            
                            {/* ❌ REMOVIDO: Player. É renderizado no MainLayout. */}
                            {/* <Box sx={{ mb: 3 }}>
                                <Player onSongEnd={handleSongEnd} /> 
                            </Box> 
                            */}
                            
                            {/* 3. Divisor e Fila */}
                            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

                            {/* Fila de Reprodução Atual */}
                            <Box>
                                <Typography variant="h5" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                    Fila de Reprodução
                                </Typography>
                                
                                {/* Exibe a música que está tocando */}
                                {currentSong ? (
                                    <Paper elevation={1} sx={{ p: 1.5, mb: 2, backgroundColor: 'var(--bg-light)', borderLeft: '4px solid var(--orange)' }}>
                                        <Typography variant="body1" sx={{ color: 'var(--orange)', fontWeight: 'bold' }}>
                                            Tocando Agora ({queueIndex + 1}/{queue.length}):
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                                            {currentSong.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--secondary-text-color)' }}>
                                            {currentSong.artist}
                                        </Typography>
                                    </Paper>
                                ) : (
                                    <Typography sx={{ color: 'var(--secondary-text-color)', mb: 2 }}>
                                        Nenhuma música tocando. Adicione a primeira!
                                    </Typography>
                                )}
                                
                                <Typography variant="h6" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                    Próximas na Fila ({queue.length - (queueIndex + 1)} restantes)
                                </Typography>
                                
                                {/* Exibe apenas o restante da fila, começando no queueIndex + 1 */}
                                {queue.length > 0 && queueIndex !== -1 ? (
                                    <List dense>
                                        {queue.slice(queueIndex + 1).map((song, index) => (
                                            <ListItem
                                                key={song.id + '-' + (queueIndex + 1 + index)} 
                                                secondaryAction={
                                                    <Button 
                                                        onClick={() => handleRemoveFromQueue(song.id)}
                                                        size="small"
                                                        sx={{ color: 'var(--orange)' }}
                                                    >
                                                        Remover
                                                    </Button>
                                                }
                                                sx={{ borderBottom: '1px solid var(--border-color-light)' }}
                                            >
                                                <ListItemText
                                                    primary={<Typography sx={{ color: 'var(--text-color)' }}>#{queueIndex + 2 + index}: {song.title}</Typography>}
                                                    secondary={<Typography sx={{ color: 'var(--secondary-text-color)' }}>{song.artist}</Typography>}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography sx={{ color: 'var(--secondary-text-color)' }}>
                                        A fila de espera está vazia.
                                    </Typography>
                                )}
                            </Box>
                        </StyledPaper>
                    </Grid>

                </Grid>
                
            </main>
        </>
    );
}

export default GrupoDetalhe;