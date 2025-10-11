import React from 'react';
import { Box, Typography, Avatar, Button, IconButton } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export default function ProfileHeader({ user, onEditClick, onImageEditClick, onFriendsClick }) {
    
    const DYNAMIC_TEXT_COLOR = 'var(--secondary-text-color)'; 
    const ORANGE_COLOR = 'var(--orange)'; 
    const BUTTON_HOVER_BG = 'var(--button-hover-bg)'; 
    const CLICKABLE_HOVER_COLOR = 'var(--text-primary)';

    const safeUser = {
        username: 'Carregando...',
        playlists: 0,
        friends: 0,
        following: [],
        ...user
    };
    
    console.log("ProfileHeader - SafeUser Recebido:", safeUser);

    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' }, 
                alignItems: { xs: 'center', sm: 'flex-end' }, 
                gap: 3, 
                mb: 4,
                textAlign: { xs: 'center', sm: 'left' }
            }}
        >
            <Box sx={{ position: 'relative', width: 150, height: 150 }}>
                <Avatar 
                    src={safeUser.img || "https://placehold.co/250?text=Icone+Vaqueiro"} 
                    sx={{ width: 150, height: 150, bgcolor: 'secondary.main', boxShadow: 8 }}
                />
                {onImageEditClick && (
                    <IconButton 
                        color="primary" 
                        aria-label="upload picture" 
                        component="span" 
                        onClick={onImageEditClick}
                        sx={{ 
                            position: 'absolute', 
                            bottom: 0, 
                            right: 0, 
                            bgcolor: ORANGE_COLOR, 
                            color: 'white', 
                            '&:hover': {
                                bgcolor: ORANGE_COLOR,
                                opacity: 0.9,
                            }
                        }}
                    >
                        <PhotoCameraIcon />
                    </IconButton>
                )}
            </Box>

            <Box>
                <Typography variant="h2" component="h1" fontWeight={700} sx={{ mb: 1 }}>
                    {safeUser.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                    
                    <Typography variant="body1" sx={{ color: DYNAMIC_TEXT_COLOR }}>
                        {safeUser.playlists} Playlists 
                    </Typography>
                    <Typography variant="body1" sx={{ color: DYNAMIC_TEXT_COLOR }}>•</Typography>
                    
                    <Typography 
                        variant="body1" 
                        onClick={onFriendsClick}
                        sx={{ 
                            color: DYNAMIC_TEXT_COLOR,
                            ...(onFriendsClick && {
                                cursor: 'pointer',
                                fontWeight: 700,
                                '&:hover': {
                                    color: CLICKABLE_HOVER_COLOR,
                                }
                            })
                        }}
                    >
                        {safeUser.friends} Peões Amigos
                    </Typography>
                    
                    <Typography variant="body1" sx={{ color: DYNAMIC_TEXT_COLOR }}>•</Typography>
                    
                    <Typography variant="body1" sx={{ color: DYNAMIC_TEXT_COLOR }}>
                        Seguindo {safeUser.following.length} artista(s)
                    </Typography>
                
                    {onEditClick && (
                        <Button 
                            onClick={onEditClick} 
                            variant="outlined" 
                            size="medium" 
                            sx={{ 
                                ml: { sm: 2 }, 
                                mt: { xs: 1, sm: 0 }, 
                                borderRadius: 20,
                                color: ORANGE_COLOR,
                                borderColor: ORANGE_COLOR,
                                '&:hover': {
                                    backgroundColor: BUTTON_HOVER_BG, 
                                    borderColor: ORANGE_COLOR,
                                }
                            }}
                        >
                            Editar
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}