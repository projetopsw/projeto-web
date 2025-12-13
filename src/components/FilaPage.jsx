import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'; 
import { useSelector, useDispatch } from 'react-redux'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
// 1. IMPORTANTE: Importe o playFromQueue
import { reorderQueue, togglePlayPause, removeSongFromQueue, playFromQueue } from '../redux/playerSlice'; 

const VolumeIcon = () => (<i className="fas fa-volume-up" style={{ color: 'var(--orange)', fontSize: '12px' }} />);
const INACTIVE_COLOR = 'var(--secondary-text-color)';

const FilaPageContainer = styled(Box)(({ theme }) => ({
    padding: '20px', 
    margin: '0 auto',
    maxWidth: '800px',
    width: '100%', 
    minHeight: 'calc(100vh - 150px)',
    paddingTop: '4em', 
    paddingBottom: '7em',
}));

function FilaPage() {
    const { queue, currentSong } = useSelector(state => state.player); 
    const dispatch = useDispatch();

    const onDragEnd = (result) => {
        if (!result.destination) return; 
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        if (sourceIndex === destinationIndex) return;
        
        dispatch(reorderQueue({ sourceIndex, destinationIndex }));
    };
    
    // 2. CORREÇÃO: Usar playFromQueue e queueId
    const handlePlayQueueItem = (song) => {
        // Se for a mesma música (comparando queueId), pausa/toca
        if (currentSong?.queueId === song.queueId) {
            dispatch(togglePlayPause());
        } else {
            // Se for outra, apenas navega para ela sem recriar a fila
            dispatch(playFromQueue(song.queueId));
        }
    };

    const handleRemoveSong = (e, songId) => {
        e.stopPropagation();
        
        // 3. CORREÇÃO: Comparar queueId
        if (currentSong?.queueId === songId) {
            alert("Não é possível remover a música que está tocando no momento.");
            return;
        }

        dispatch(removeSongFromQueue(songId));
    };

    const renderQueueItem = (song, index) => {
        // 4. CORREÇÃO: Usar queueId para garantir unicidade e status correto
        // Fallback para _id apenas se queueId não existir (para compatibilidade)
        const uniqueId = song.queueId || song._id;
        const isCurrentlyPlaying = currentSong?.queueId === uniqueId; 
        
        return (
            // Usa uniqueId aqui
            <Draggable key={uniqueId} draggableId={String(uniqueId)} index={index}>
                {(provided, snapshot) => (
                    <ListItem 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        onClick={() => handlePlayQueueItem(song)}
                        sx={{
                            padding: { xs: '12px 0', sm: '12px 15px' },
                            backgroundColor: isCurrentlyPlaying ? 'var(--card-bg)' : 'transparent',
                            borderLeft: isCurrentlyPlaying ? '4px solid var(--orange)' : '4px solid transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': { backgroundColor: 'var(--card-bg)' },
                            ...(snapshot.isDragging && { backgroundColor: 'var(--input-bg)' })
                        }}
                    >
                        <Box {...provided.dragHandleProps} sx={{ color: INACTIVE_COLOR, display: { xs: 'none', sm: 'flex' }, alignItems: 'center', mr: 1, cursor: 'grab', flexShrink: 0 }}>
                            <DragIndicatorIcon fontSize="small" />
                        </Box>

                        <Box sx={{ width: '25px', textAlign: 'center', flexShrink: 0 }}>
                            {isCurrentlyPlaying ? (<VolumeIcon />) : (<Typography sx={{ color: INACTIVE_COLOR, fontSize: '0.8rem' }}>{index + 1}</Typography>)}
                        </Box>
                        
                        <ListItemAvatar sx={{ minWidth: '50px', ml: 1, flexShrink: 0 }}>
                            <Avatar src={song.cover} alt="Capa" variant="square" sx={{ width: 50, height: 50 }} /> 
                        </ListItemAvatar>
                        
                        <ListItemText
                            primary={song.title} 
                            // Tratamento para exibir corretamente Artista • Album
                            secondary={(song.artist || 'Artista Desconhecido') + (song.album ? (window.innerWidth > 600 ? ' • ' + (song.album.name || song.album) : '') : '')} 
                            primaryTypographyProps={{ 
                                fontWeight: 'bold', fontSize: { xs: '0.9rem', sm: '1rem' }, 
                                color: isCurrentlyPlaying ? 'var(--orange)' : 'var(--text-color)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}
                            secondaryTypographyProps={{ 
                                color: INACTIVE_COLOR, fontSize: '0.8rem' 
                            }}
                            sx={{ marginLeft: '15px', overflow: 'hidden' }}
                        />
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 2 }}>
                            <Typography 
                                sx={{ 
                                    color: INACTIVE_COLOR, 
                                    fontSize: '0.8rem', 
                                    display: { xs: 'none', sm: 'block' } 
                                }}
                            >
                                {song.duration}
                            </Typography>

                            <IconButton 
                                size="small" 
                                // Passa o uniqueId (queueId) para remover
                                onClick={(e) => handleRemoveSong(e, uniqueId)} 
                                sx={{ color: INACTIVE_COLOR, '&:hover': { color: 'var(--text-color)' } }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    </ListItem>
                )}
            </Draggable>
        );
    };

    return (
        <FilaPageContainer>
            <Typography variant="h4" component="h1" sx={{ color: 'var(--text-color)', fontWeight: 'bold', mb: 3 }}>
                Fila de Reprodução
            </Typography>
            <Typography variant="h6" sx={{ color: 'var(--secondary-text-color)', fontWeight: 'bold', mb: 2 }}>
                Próximas Músicas ({queue.length})
            </Typography>
            
            <Box sx={{ 
                backgroundColor: 'var(--sidebar-bg)', 
                borderRadius: '8px', 
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                padding: { xs: '10px 0', sm: '15px' },
            }}>
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="queue-page">
                        {(provided) => (
                            <List 
                                ref={provided.innerRef} 
                                {...provided.droppableProps} 
                                sx={{ padding: 0 }}
                            >
                                {queue.length === 0 ? (
                                    <Typography sx={{ color: 'var(--secondary-text-color)', padding: '15px' }}>
                                        A fila está vazia. Adicione músicas para começar.
                                    </Typography>
                                ) : (
                                    queue.map((song, index) => renderQueueItem(song, index))
                                )}
                                {provided.placeholder}
                            </List>
                        )}
                    </Droppable>
                </DragDropContext>
            </Box>
        </FilaPageContainer>
    );
}

export default FilaPage;