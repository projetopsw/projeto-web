import React from 'react';
import { Box, Typography, Avatar, Button, IconButton } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export default function ProfileHeader({ 
    user, 
    onEditClick, 
    onImageEditClick, 
    onFriendsClick,
    
    isOwner,
    // Primeiro Botão (Ação Principal)
    onFriendAction,
    friendActionText,
    isFriendActionDisabled,
    // Segundo Botão (Ação Secundária, Recusar)
    onSecondFriendAction,
    secondFriendActionText,
}) {
    
    const DYNAMIC_TEXT_COLOR = 'var(--secondary-text-color)'; 
    const ORANGE_COLOR = 'var(--orange)'; 
    const BUTTON_HOVER_BG = 'var(--button-hover-bg)'; 
    const CLICKABLE_HOVER_COLOR = 'var(--text-primary)';
    
    // --- ESTILO DINÂMICO DO PRIMEIRO BOTÃO (AÇÃO PRINCIPAL) ---
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
             // Deixa transparente, mas usa a cor do texto padrão para Pendente
            color = text === "Solicitação Pendente" ? DYNAMIC_TEXT_COLOR : ORANGE_COLOR;
            borderColor = text === "Solicitação Pendente" ? DYNAMIC_TEXT_COLOR : ORANGE_COLOR;
        }

        return { bgColor, color, borderColor, hoverBg, fontWeight };
    };

    const primaryStyles = getButtonStyles(friendActionText);
    
    // --- ESTILO DO SEGUNDO BOTÃO (AÇÃO SECUNDÁRIA: RECUSAR) ---
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
            {/* AVATAR E BOTÃO DE EDIÇÃO DE IMAGEM */}
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

            {/* INFORMAÇÕES E BOTÕES DE AÇÃO */}
            <Box>
                <Typography variant="h2" component="h1" fontWeight={700} sx={{ mb: 1 }}>
                    {safeUser.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, flexWrap: 'wrap' }}>
                    
                    {/* INFORMAÇÕES ESTATÍSTICAS */}
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
                </Box>

                {/* BOTÕES DE AÇÃO - Container para 1 ou 2 botões */}
                <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                    
                    {/* 1. BOTÃO DE EDIÇÃO (SE FOR O DONO) */}
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
                    
                    {/* 2. PRIMEIRO BOTÃO DE AMIZADE (AÇÃO PRINCIPAL) */}
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

                    {/* 3. SEGUNDO BOTÃO DE AMIZADE (RECUSAR) */}
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