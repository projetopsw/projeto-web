import React, { useState } from 'react';
import { Box, Button, IconButton, Menu, MenuItem, Divider, styled } from '@mui/material';
import { 
    PlayArrow as PlayArrowIcon, 
    Pause as PauseIcon, 
    MoreVert as MoreVertIcon, 
    Delete as DeleteIcon 
} from '@mui/icons-material';

const INACTIVE_ICON_COLOR = 'var(--secondary-text-color)';

const PlayButton = styled(IconButton)(({ theme }) => ({
    width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--orange)', color: 'white', fontSize: '26px', boxShadow: '0 4px 15px rgba(255, 107, 0, 0.4)', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': { transform: 'scale(1.1)', backgroundColor: 'var(--darker-orange)', boxShadow: '0 6px 20px rgba(255, 107, 0, 0.7)' },
}));

const ActionIcon = styled(IconButton)(({ theme }) => ({
    color: INACTIVE_ICON_COLOR, width: '40px', height: '40px', transition: 'color 0.2s ease',
    '&:hover': { color: 'var(--text-color)', backgroundColor: 'transparent' },
}));

const SortButton = styled(Button)(({ theme }) => ({
    color: 'var(--text-color)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '6px 16px', textTransform: 'none', fontSize: '0.9rem', backgroundColor: 'var(--input-bg)', display: 'flex', alignItems: 'center', gap: '8px',
    '&:hover': { backgroundColor: 'var(--card-bg)', borderColor: 'var(--secondary-text-color)' }
}));

const sortOptions = {
    custom: 'Ordem personalizada',
    title: 'Título (A-Z)',
    album: 'Álbum (A-Z)', 
    artist: 'Artista (A-Z)',
    added: 'Adicionado em (Mais Recente)'
};

export default function PlaylistActions({ 
    onPlay, isPlaying, isDisabled, 
    onSortChange, sortKey, 
    onDelete, isOwner, isCustom 
}) {
    const [optionsAnchorEl, setOptionsAnchorEl] = useState(null);
    const [sortAnchorEl, setSortAnchorEl] = useState(null);

    const handleSortSelect = (key) => {
        onSortChange(key);
        setSortAnchorEl(null);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '15px', mb: '30px', px: '20px' }}>
            <PlayButton onClick={onPlay} disabled={isDisabled}>
                {isPlaying ? <PauseIcon sx={{ fontSize: '32px' }} /> : <PlayArrowIcon sx={{ fontSize: '32px' }} />}
            </PlayButton>
         
            <ActionIcon onClick={(e) => setOptionsAnchorEl(e.currentTarget)}>
                <MoreVertIcon sx={{ fontSize: '20px' }} />
            </ActionIcon>
            <Menu anchorEl={optionsAnchorEl} open={Boolean(optionsAnchorEl)} onClose={() => setOptionsAnchorEl(null)} PaperProps={{ sx: { bgcolor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                <MenuItem disabled>Compartilhar (Em breve)</MenuItem>
                {isOwner && isCustom && <Divider sx={{ my: 1, bgcolor: 'var(--border-color)' }} />}
                {isOwner && isCustom && (
                    <MenuItem onClick={() => { setOptionsAnchorEl(null); onDelete(); }} sx={{color: 'red'}}>
                        <DeleteIcon sx={{ mr: 1, fontSize: '18px' }} /> Excluir Playlist
                    </MenuItem>
                )}
            </Menu>
            
            {/* Sort Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', gap: '10px' }}>
                <SortButton onClick={(e) => setSortAnchorEl(e.currentTarget)} endIcon={<i className="fas fa-chevron-down" style={{ fontSize: '12px' }} />}>
                    <i className="fas fa-list-ul" style={{ fontSize: '18px', color: sortKey !== 'custom' ? 'var(--orange)' : INACTIVE_ICON_COLOR }} /> {sortOptions[sortKey]}
                </SortButton>
                <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={() => setSortAnchorEl(null)} PaperProps={{ sx: { bgcolor: 'var(--card-bg)', color: 'var(--text-color)' } }}>
                    {Object.entries(sortOptions).map(([key, label]) => (
                        <MenuItem key={key} onClick={() => handleSortSelect(key)} selected={sortKey === key} disabled={!isCustom && key === 'custom'}>
                            {label}
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
        </Box>
    );
}