import React from 'react';
import { Box, Typography, Avatar, Button, IconButton } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export default function ProfileHeader({ 
    user, 
    onEditClick, 
    onImageEditClick, 
    onFriendsClick,
    
    isOwner,
    onFriendAction,
    friendActionText,
    isFriendActionDisabled,
    onSecondFriendAction,
    secondFriendActionText,
}) {
    
    const DYNAMIC_TEXT_COLOR = 'var(--secondary-text-color)'; 
    const ORANGE_COLOR = 'var(--orange)'; 
    const BUTTON_HOVER_BG = 'var(--button-hover-bg)'; 
    const CLICKABLE_HOVER_COLOR = 'var(--text-primary)';
    
    const getButtonStyles = (text) => {
        let bgColor = 'transparent';
        let color = ORANGE_COLOR;
        let borderColor = ORANGE_COLOR;
        let hoverBg = BUTTON_HOVER_BG;
        let fontWeight = 500;

        if (text === "Aceitar Solicitação" || text === "Adicionar aos Amigos") {
            bgColor = ORANGE_COLOR;
            color = 'white';
            fontWeight = 700;
            hoverBg = ORANGE_COLOR;
        } else if (text === "Solicitação Pendente" || text === "Remover Amigo") {
            color = text === "Solicitação Pendente" ? DYNAMIC_TEXT_COLOR : ORANGE_COLOR;
            borderColor = text === "Solicitação Pendente" ? DYNAMIC_TEXT_COLOR : ORANGE_COLOR;
        }

        return { bgColor, color, borderColor, hoverBg, fontWeight };
    };

    const primaryStyles = getButtonStyles(friendActionText);
    
    const secondaryStyles = {
        bgColor: 'transparent',
        color: DYNAMIC_TEXT_COLOR,
        borderColor: DYNAMIC_TEXT_COLOR,
        hoverBg: BUTTON_HOVER_BG,
        fontWeight: 500,
    };
    

    const safeUser = {
        username: 'Carregando...',
        playlists: 0,
        friends: 0,
        following: [],
        ...user
    };
    

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
                <Typography variant="h2" component="h1" fontWeight={700} sx={{ mb: 1 }} className='usernameProfile'>
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
                                        
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    
                    {isOwner && onEditClick && (
                        <Button 
                            onClick={onEditClick} 
                            variant="outlined" 
                            size="medium" 
                            sx={{ 
                                borderRadius: 20,
                                color: ORANGE_COLOR,
                                borderColor: ORANGE_COLOR,
                                '&:hover': {
                                    backgroundColor: BUTTON_HOVER_BG, 
                                    borderColor: ORANGE_COLOR,
                                }
                            }}
                        >
                            Editar Perfil
                        </Button>
                    )}
                    
                    {!isOwner && onFriendAction && (
                        <Button 
                            onClick={onFriendAction} 
                            variant="outlined" 
                            size="medium" 
                            disabled={isFriendActionDisabled}
                            sx={{ 
                                borderRadius: 20,
                                bgcolor: primaryStyles.bgColor,
                                color: primaryStyles.color,
                                borderColor: primaryStyles.borderColor,
                                fontWeight: primaryStyles.fontWeight,
                                '&:hover': {
                                    backgroundColor: primaryStyles.hoverBg, 
                                    opacity: 0.9,
                                }
                            }}
                        >
                            {friendActionText}
                        </Button>
                    )}

                    {!isOwner && onSecondFriendAction && (
                        <Button 
                            onClick={onSecondFriendAction} 
                            variant="outlined" 
                            size="medium" 
                            sx={{ 
                                borderRadius: 20,
                                bgcolor: secondaryStyles.bgColor,
                                color: secondaryStyles.color,
                                borderColor: secondaryStyles.borderColor,
                                fontWeight: secondaryStyles.fontWeight,
                                '&:hover': {
                                    backgroundColor: secondaryStyles.hoverBg, 
                                    opacity: 0.9,
                                }
                            }}
                        >
                            {secondFriendActionText}
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}