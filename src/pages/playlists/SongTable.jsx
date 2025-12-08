import React, { useState } from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { AccessTime as AccessTimeIcon, DragIndicator as DragIndicatorIcon } from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';

export default function SongTable({ songs, onDragEnd, isCustom, isOwner, sortKey, currentSong, isPlaying }) {
    const [hoveredSongId, setHoveredSongId] = useState(null);

    const isDraggable = isCustom && isOwner && sortKey === 'custom';

    const renderRow = (song, index, provided = {}) => (
        <TableRow 
            key={song.id}
            ref={provided.innerRef} 
            {...provided.draggableProps} 
            sx={{ '&:hover': { bgcolor: 'var(--card-bg)' } }} 
            onMouseEnter={() => setHoveredSongId(song.id)} 
            onMouseLeave={() => setHoveredSongId(null)}
        >
            <TableCell sx={{borderBottom:'none', width: '40px'}}>
                {isDraggable && (
                    <div {...provided.dragHandleProps} style={{display:'flex',justifyContent:'center',color:INACTIVE_ICON_COLOR}}>
                        <DragIndicatorIcon />
                    </div>
                )}
            </TableCell>
            <TableCell align="center" sx={{borderBottom:'none', color:INACTIVE_ICON_COLOR}}>{index + 1}</TableCell>
            <TableCell sx={{borderBottom:'none', color:'var(--text-color)'}}>
                <Box sx={{display:'flex', alignItems:'center', gap: 2}}>
                    <img src={song.cover} style={{width: 40, height: 40, borderRadius: 4}} alt="" />
                    {song.title}
                </Box>
            </TableCell>
            <TableCell sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.album}</TableCell>
            <TableCell sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.artist}</TableCell>
            <TableCell align="center" sx={{borderBottom:'none', color:'var(--secondary-text-color)'}}>{song.duration}</TableCell>
            <TableCell sx={{borderBottom:'none'}}></TableCell>
        </TableRow>
    );

    return (
        <TableContainer sx={{ mt: '20px', px: '20px' }}>
            <Table stickyHeader sx={{ minWidth: 650, borderSpacing: '0 10px', borderCollapse: 'separate' }}>
                <TableHead>
                    <TableRow sx={{ '& th': { color: 'var(--secondary-text-color)', borderBottom: '1px solid var(--border-color)', bgcolor: 'var(--main-bg)' } }}>
                        <TableCell sx={{ width: '40px' }}></TableCell>
                        <TableCell align="center" sx={{ width: '40px' }}>#</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Álbum</TableCell>
                        <TableCell>Artista</TableCell>
                        <TableCell align="center" sx={{ width: '40px' }}><AccessTimeIcon sx={{ fontSize: '18px' }} /></TableCell>
                        <TableCell sx={{ width: '40px' }}></TableCell>
                    </TableRow>
                </TableHead>

                {isDraggable ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="songs">
                            {(provided) => (
                                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                                    {songs.map((song, index) => (
                                        <Draggable key={song.id} draggableId={String(song.id)} index={index}>
                                            {(provided) => renderRow(song, index, provided)}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </TableBody>
                            )}
                        </Droppable>
                    </DragDropContext>
                ) : (
                    <TableBody>
                        {songs.map((song, index) => renderRow(song, index))}
                    </TableBody>
                )}
            </Table>
        </TableContainer>
    );
}