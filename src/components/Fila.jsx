import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { useSelector, useDispatch } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { reorderQueue, togglePlayPause, setQueue, removeSongFromQueue } from '../redux/playerSlice';

const VolumeIcon = () => (<i className="fas fa-volume-up" style={{ color: 'var(--orange)', fontSize: '12px' }} />);
const INACTIVE_COLOR = 'var(--secondary-text-color)';

const QueueOverlayContainer = styled(Box)(({ theme }) => ({
    position: 'fixed',
    top: '70px',
    left: '100px',
    height: 'calc(100vh - 150px)',
    backgroundColor: 'var(--sidebar-bg)',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
    padding: '0',
    overflowY: 'auto',
    width: { xs: '100%', sm: '350px' }
}));

function QueueOverlay() {
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
        
        if (currentSong?.id === songId) {
             alert("Não é possível remover a música que está tocando no momento.");
             return;
        }

        dispatch(removeSongFromQueue(songId));
    };

    const renderQueueItem = (song, index) => {
        const isCurrentlyPlaying = currentSong?.id === song.id;

        return (
            <Draggable key={song.id} draggableId={String(song.id)} index={index}>
                {(provided, snapshot) => (
                    <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                            padding: '12px 15px',
                            backgroundColor: isCurrentlyPlaying ? 'var(--card-bg)' : 'transparent',
                            borderLeft: isCurrentlyPlaying ? '4px solid var(--orange)' : '4px solid transparent',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            '&:hover': { backgroundColor: 'var(--card-bg)' },
                            ...(snapshot.isDragging && { backgroundColor: 'var(--input-bg)' })
                        }}
                        onClick={() => handlePlayQueueItem(song)}
                    >
                        <Box {...provided.dragHandleProps} sx={{ color: INACTIVE_COLOR, display: 'flex', alignItems: 'center', mr: 1, cursor: 'grab' }}>
                            <DragIndicatorIcon fontSize="small" />
                        </Box>

                        <Box sx={{ width: '25px', textAlign: 'center' }}>
                            {isCurrentlyPlaying ? (<VolumeIcon />) : (<Typography sx={{ color: INACTIVE_COLOR, fontSize: '0.8rem' }}>{index + 1}</Typography>)}
                        </Box>

                        <ListItemAvatar sx={{ minWidth: '50px', ml: 1 }}>
                            <Avatar src={song.cover} alt="Capa" variant="square" sx={{ width: 50, height: 50 }} />
                        </ListItemAvatar>

                        <ListItemText
                            primary={song.title}
                            secondary={song.artist + ' • ' + song.album}
                            primaryTypographyProps={{
                                fontWeight: 'bold', fontSize: '1rem',
                                color: isCurrentlyPlaying ? 'var(--orange)' : 'var(--text-color)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}
                            secondaryTypographyProps={{
                                color: INACTIVE_COLOR, fontSize: '0.8rem'
                            }}
                            sx={{ marginLeft: '15px' }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ color: INACTIVE_COLOR, fontSize: '0.8rem' }}>
                                {song.duration}
                            </Typography>
                            
                            <IconButton 
                                size="small" 
                                onClick={(e) => handleRemoveSong(e, song.id)} 
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
        <QueueOverlayContainer>
            <Typography variant="h6" sx={{ color: 'var(--text-color)', fontWeight: 'bold', padding: '15px 15px 10px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, backgroundColor: 'var(--sidebar-bg)', zIndex: 1 }}>
                Próximas na Fila ({queue.length})
            </Typography>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="queue">
                    {(provided) => (
                        <List
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            sx={{ padding: 0 }}
                        >
                            {queue.length === 0 ? (
                                <Typography sx={{ color: 'var(--secondary-text-color)', padding: '15px' }}>
                                    A fila está vazia.
                                </Typography>
                            ) : (
                                queue.map((song, index) => renderQueueItem(song, index))
                            )}
                            {provided.placeholder}
                        </List>
                    )}
                </Droppable>
            </DragDropContext>
        </QueueOverlayContainer>
    );
}

export default QueueOverlay;