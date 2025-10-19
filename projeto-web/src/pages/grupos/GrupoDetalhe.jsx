import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import './Grupo.css'; 



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
    
    const [group, setGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]); 
    const [queue, setQueue] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

  

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
    
    
    const handleAddToQueue = (song) => {
        setQueue(prevQueue => {
            if (prevQueue.some(item => item.id === song.id)) {
                alert(`"${song.title}" já está na fila!`); 
                return prevQueue; 
            }
            const newQueue = [...prevQueue, song];
            
         

            return newQueue;
        });
    };
    
    const handleRemoveFromQueue = (songId) => {
        setQueue(prevQueue => {
            const newQueue = prevQueue.filter(song => song.id !== songId);
            
            
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

                    <Grid item xs={12} sx={{ flexGrow: 1 }}>
                        <StyledPaper elevation={3} className="queue-box">
                            <Typography variant="h5" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                🎵 Adicionar Música à Fila
                            </Typography>
                            
                            <Box sx={{ mb: 4, position: 'relative' }}>
                                <SearchMusicLocal 
                                    onSongSelect={handleAddToQueue} 
                                />
                            </Box>

                            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

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