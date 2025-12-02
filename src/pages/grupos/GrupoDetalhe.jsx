import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'; 
import { 
    addSingleSongToQueue, 
    removeSongFromQueue 
} from '../../redux/playerSlice'; 

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
    CircularProgress,
    Avatar,
    ListItemAvatar
} from '@mui/material';

import SearchMusicLocal from '../../components/SearchMusic'; 
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
    const dispatch = useDispatch(); 
   
    const user = useSelector((state) => state.user?.user);

    const currentUser = {
        id: user?.id || user?._id || 'unknown-id',
        name: user?.name || user?.username || 'Visitante', 
        username: user?.username || user?.name || 'unknown_user',
    };
    
    const queue = useSelector(state => state.player.queue || []);
    const currentSong = useSelector(state => state.player.currentSong);
    const queueIndex = useSelector(state => state.player.queueIndex);
    
    const [group, setGroup] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);


    const fetchGroupDetails = async () => {
        setIsLoading(true);
        try {
            const groupData = { id, name: `Grupo ${id} (Mock)` };
            const membersData = [
                { id: '1', name: 'Bebel', username: 'bebel_dj' }, 
                { id: '2', name: 'Bia', username: 'bia_dj' },
                { id: currentUser.id, name: currentUser.name, username: currentUser.username }
            ];
            
            setGroup(groupData);
            setGroupMembers(membersData);
            setError(null);

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            setGroup({ id, name: `Grupo ${id} (Mock)` });
            
            setGroupMembers([
                { id: '1', name: 'Bebel', username: 'bebel_dj' }, 
                { id: '2', name: 'Bia', username: 'bia_dj' },
                { id: currentUser.id, name: currentUser.name, username: currentUser.username }
            ]);
            setError("Não foi possível carregar os dados completos. Usando dados padrão.");
        } finally {
            setIsLoading(false);
        }
    };


    const getAddedByName = (addedByValue) => {
        if (addedByValue === currentUser.username || addedByValue === currentUser.id) {
            return `Você`; 
        }
        
        const member = groupMembers.find(m => m.username === addedByValue || m.id === addedByValue);
        
        return member ? member.name : `@${addedByValue}` || 'Desconhecido';
    };


    const handleAddToQueue = (song) => {
        const userIdentifier = currentUser.id === 'unknown-id' ? currentUser.username : currentUser.id;

        if (!userIdentifier || userIdentifier === 'unknown-user') {
            alert("Você precisa estar logado para adicionar músicas à fila.");
            return;
        }

        const songWithUser = {
            ...song,
            addedBy: userIdentifier 
        };

        dispatch(addSingleSongToQueue(songWithUser));
    };
    
    const handleRemoveFromQueue = (songId) => {
        dispatch(removeSongFromQueue(songId));
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
            <main className="content-area" 
                style={{ 
                    padding: '20px 40px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    minHeight: '100%' 
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
                                                color: 'var(--card-bg)', 
                                                backgroundColor: 'var(--orange)', 
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontWeight: 'bold', 
                                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)' 
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
                                 Adicionar Música à Fila
                            </Typography>
                            
                            <Box sx={{ mb: 4, position: 'relative' }}>
                                <SearchMusicLocal 
                                    onSongSelect={handleAddToQueue} 
                                />
                            </Box>
                            
                            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

                            <Box>
                                <Typography variant="h5" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                    Fila de Reprodução
                                </Typography>
                            
                                {currentSong ? (
                                    <Paper elevation={1} sx={{ 
                                            p: 1.5, 
                                            mb: 2, 
                                            backgroundColor: 'var(--bg-light)', 
                                            borderLeft: '4px solid var(--orange)',
                                            display: 'flex', 
                                            alignItems: 'center'
                                        }}>
                                        <Avatar 
                                            src={currentSong.cover} 
                                            alt={currentSong.title} 
                                            variant="square"
                                            sx={{ width: 48, height: 48, mr: 2, borderRadius: '4px' }}
                                        />
                                        <Box>
                                        <Typography variant="body1" sx={{ color: 'var(--orange)', fontWeight: 'bold' }}>
                                            Tocando Agora ({queueIndex + 1}/{queue.length}):
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: 'var(--text-color)' }}>
                                            {currentSong.title}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'var(--secondary-text-color)' }}>
                                            {currentSong.artist} 
                                            {currentSong.addedBy && ` | Adicionado por: ${getAddedByName(currentSong.addedBy)}`}
                                        </Typography>
                                        </Box>
                                    </Paper>
                                ) : (
                                    <Typography sx={{ color: 'var(--secondary-text-color)', mb: 2 }}>
                                        Nenhuma música tocando. Adicione a primeira!
                                    </Typography>
                                )}
                                
                                <Typography variant="h6" sx={{ color: 'var(--title-color)', mb: 2 }}>
                                    Próximas na Fila ({queue.length - (queueIndex + 1)} restantes)
                                </Typography>
                                
                                {queue.length > 0 && queueIndex !== -1 ? (
                                    <List dense>
                                        {queue.slice(queueIndex + 1).map((song, index) => (
                                            <ListItem
                                                key={song.id + '-' + (queueIndex + 1 + index)} 
                                                
                                                sx={{ 
                                                    borderBottom: '1px solid var(--border-color-light)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                    }}
                                            >
                                            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, flexGrow: 1 }}>
                                                     <ListItemAvatar>
                                                         <Avatar 
                                                             src={song.cover} 
                                                             alt={song.title} 
                                                             variant="square"
                                                             sx={{ width: 40, height: 40, borderRadius: '4px' }}
                                                         />
                                                     </ListItemAvatar>
                                                     
                                                     <ListItemText
                                                         primary={<Typography sx={{ color: 'var(--text-color)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                             #{queueIndex + 2 + index}: {song.title}
                                                             </Typography>}
                                                         secondary={<Typography sx={{ color: 'var(--secondary-text-color)' }}>{song.artist}</Typography>}
                                                         sx={{ ml: 1 }} 
                                                     />
                                                 </Box>
                                                 
                                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                                                     {song.addedBy ? (
                                                         <Typography variant="caption" sx={{ color: 'var(--secondary-text-color)', minWidth: 150, textAlign: 'right' }}>
                                                             Adicionado por: <br/><strong>{getAddedByName(song.addedBy)}</strong> 
                                                         </Typography>
                                                     ) : (
                                                             <Typography variant="caption" sx={{ color: 'var(--secondary-text-color)', minWidth: 150, textAlign: 'right' }}>
                                                                 Adicionado por: <br/>Desconhecido
                                                             </Typography>
                                                     )}
                                                     <Button 
                                                         onClick={() => handleRemoveFromQueue(song.id)}
                                                         size="small"
                                                         sx={{ color: 'var(--orange)', minWidth: 80 }}
                                                     >
                                                         Remover
                                                     </Button>
                                                 </Box>
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