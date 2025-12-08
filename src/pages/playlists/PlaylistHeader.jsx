import React from 'react';
import { Box, Typography, styled } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const DEFAULT_PLAYLIST_COVER = '/assets/img/vibe_cover_2.png';

const HeaderContainer = styled(Box)(({ theme }) => ({
    display: 'flex', alignItems: 'flex-end', gap: '30px', marginBottom: '40px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px',
    ['@media (max-width:960px)']: { flexDirection: 'column', alignItems: 'flex-start' },
}));

export default function PlaylistHeader({ playlistDetails, isOwner, isCustom, onOpenEdit }) {
    if (!playlistDetails) return null;

    return (
        <HeaderContainer>
            <Box 
                sx={{ position: 'relative', cursor: isOwner && isCustom ? 'pointer' : 'default' }} 
                onClick={isOwner && isCustom ? onOpenEdit : undefined}
            >
                <img 
                    src={playlistDetails.img} 
                    alt="Capa" 
                    onError={(e) => {e.target.src = DEFAULT_PLAYLIST_COVER}} 
                    style={{ width: '250px', height: '250px', borderRadius: '12px', boxShadow: '0 10px 30px var(--shadow-color-dark)', objectFit: 'cover' }} 
                />
                {isOwner && isCustom && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '12px', bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 } }}>
                        <EditIcon sx={{ fontSize: '50px', color: 'white' }} />
                    </Box>
                )}
            </Box>
            <Box className="header-info">
                <Typography variant="overline" sx={{ color: 'var(--secondary-text-color)', fontWeight: 'bold' }}>
                    {playlistDetails.id === '0' ? 'PLAYLIST ESPECIAL' : (playlistDetails.isPublic ? 'PLAYLIST PÚBLICA' : 'PLAYLIST PRIVADA')}
                </Typography>
                <Typography variant="h3" component="h1" sx={{ color: 'var(--text-color)', fontWeight: 'bold', margin: '10px 0' }}>
                    {playlistDetails.name}
                </Typography>
                <Typography sx={{ color: 'var(--secondary-text-color)', maxWidth: '600px' }}>
                    {playlistDetails.description}
                </Typography>
                <Typography variant="body2" sx={{ color: 'var(--secondary-text-color)', mt: '10px' }}>
                    Criada por <strong style={{ color: 'var(--text-color)' }}>{playlistDetails.creator}</strong> • {playlistDetails.songCount} músicas
                </Typography>
            </Box>
        </HeaderContainer>
    );
}