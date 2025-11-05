import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'; 
import { useSelector, useDispatch } from 'react-redux'; 
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
import { reorderQueue, togglePlayPause, setQueue } from '../redux/playerSlice'; 

const VolumeIcon = () => (<i className="fas fa-volume-up" style={{ color: 'var(--orange)', fontSize: '12px' }} />);
const INACTIVE_COLOR = 'var(--secondary-text-color)';

const FilaPageContainer = styled(Box)(({ theme }) => ({
    padding: '20px', 
    margin: '0 auto',
    maxWidth: '800px',
    width: '100%', 
    minHeight: 'calc(100vh - 150px)',
    
    paddingTop: '80px', 
}));

function FilaPage() {
    const { queue, currentSong, isPlaying } = useSelector(state => state.player); 
    const dispatch = useDispatch();

    const onDragEnd = (result) => {
        if (!result.destination) return; 
        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;
        if (sourceIndex === destinationIndex) return;
        
        dispatch(reorderQueue({ sourceIndex, destinationIndex }));
    };
    
    const handlePlayQueueItem = (song) => {
        if (currentSong?.id === song.id) {
            dispatch(togglePlayPause());
        } else {
            const startIndex = queue.findIndex(s => s.id === song.id);
            if (startIndex !== -1) {
                dispatch(setQueue({ songs: queue, startIndex: startIndex }));
            }
        }
    };

    const handleRemoveSong = (e, songId) => {
        e.stopPropagation();
        console.log(`Remover música com ID: ${songId}`);
    };

    const renderQueueItem = (song, index) => {
        const isCurrentlyPlaying = currentSong?.id === song.id; 
        
        return (
            <Draggable key={song.id} draggableId={String(song.id)} index={index}>
                {(provided, snapshot) => (
                    <ListItem 
                        onClick={() => handlePlayQueueItem(song)}
                    >
                        
                        <ListItemAvatar sx={{ minWidth: '50px', ml: 1, flexShrink: 0 }}>
                            <Avatar src={song.cover} alt="Capa" variant="square" sx={{ width: 50, height: 50 }} /> 
                        </ListItemAvatar>
                        
                        <ListItemText
                            primary={song.title} 
                            secondary={song.artist + (song.album ? (window.innerWidth > 600 ? ' • ' + song.album : '') : '')} 
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