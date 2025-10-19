// src/pages/GrupoDetalhe.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // 💡 Adicionado useDispatch
// 💡 IMPORTANTE: Certifique-se de que este caminho está correto para o seu playerSlice
import { playSong } from '../../redux/playerSlice'; 

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
import Header from '../../components/Header';
import SearchMusicLocal from '../../components/SearchMusic'; 
import UserCard from '../../components/UserCard'; 
import api from '../../services/api.js'; 
import Player from '../../components/Player'; // 💡 IMPORTADO O COMPONENTE PLAYER
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
    const dispatch = useDispatch(); // 💡 Adicionado useDispatch
    
    // Variáveis de estado principais
    const [group, setGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]); 
    const [queue, setQueue] = useState([]); 
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
            setQueue(groupData.queue || groupData.currentQueue || []); 

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
            setQueue([]); 
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
        setQueue(prevQueue => {
            if (prevQueue.some(item => item.id === song.id)) {
                alert(`"${song.title}" já está na fila!`); 
                return prevQueue; 
            }
            
            // 💡 Ação: Se a fila e a música atual estiverem vazias, toca a música imediatamente
            // Note: Não verificamos 'currentSong' aqui, pois o Redux Player faz isso.
            // Apenas tentamos tocar e, se já estiver tocando, a música vai para a fila.
            // A responsabilidade de saber se já está tocando e gerenciar a fila/currentSong
            // no Redux deve ser do playerSlice. Aqui apenas adicionamos e disparamos o play inicial.
            
            const newQueue = [...prevQueue, song];
            
            // Exemplo de como iniciar a reprodução da PRIMEIRA música adicionada
            if (newQueue.length === 1 && !api.getPlayingSongId()) { 
               // Se o backend não tem info de qual toca e esta é a primeira na lista:
               dispatch(playSong(song));
            }
            
            // Opcional: Aqui você pode adicionar a chamada PATCH para o backend
            // api.patch(`/groups/${id}`, { queue: newQueue }).catch(e => console.error("Falha ao salvar fila:", e));

            return newQueue;
        });
    };
    
    const handleRemoveFromQueue = (songId) => {
        setQueue(prevQueue => {
            const newQueue = prevQueue.filter(song => song.id !== songId);
            
            // Opcional: Aqui você pode adicionar a chamada PATCH para o backend
            // api.patch(`/groups/${id}`, { queue: newQueue }).catch(e => console.error("Falha ao salvar fila:", e));
            
            return newQueue;
        });
    };


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
            <Header />
            <main className="content-area" 
                style={{ 
                    padding: '20px 40px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: 'calc(100vh - 64px)' 
                }}
            >
                
                <Grid container spacing={4} sx={{ flexGrow: 1 }}>

                    {/* Quadrado 1: Nome do Grupo + Lista de Membros (ORIGINAL REINCLUÍDO) */}
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
                            
                            {/* LISTA SIMPLES DE NOMES DOS MEMBROS */}
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

                    {/* Quadrado 2: Busca, Player e Fila de Reprodução */}
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
                            
                            {/* 2. 💡 PLAYER DO GRUPO (NOVA POSIÇÃO) */}
                            <Box sx={{ mb: 3 }}>
                                <Player /> 
                            </Box>
                            
                            {/* 3. Divisor e Fila */}
                            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

                            {/* Fila de Reprodução Atual */}
                            <Box>
                                <Typography variant="h5" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                    Lista de Espera ({queue.length})
                                </Typography>
                                
                                {queue.length === 0 ? (
                                    <Typography sx={{ color: 'var(--secondary-text-color)' }}>
                                        A fila está vazia. Comece a adicionar músicas usando a busca!
                                    </Typography>
                                ) : (
                                    <List dense>
                                        {queue.map((song, index) => (
                                            <ListItem
                                                key={song.id}
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
                                                    primary={<Typography sx={{ color: 'var(--text-color)' }}>#{index + 1}: {song.title}</Typography>}
                                                    secondary={<Typography sx={{ color: 'var(--secondary-text-color)' }}>{song.artist}</Typography>}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
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