import React from 'react';
import { Box, Typography, Button, Avatar, styled } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Estilo para o botão principal
const StyledPlayButton = styled(Button)(({ theme }) => ({
    backgroundColor: 'var(--orange)',
    color: 'var(--card-bg)', // Texto escuro para contraste
    borderRadius: '500px', // Borda arredondada
    padding: '10px 20px',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'transform 0.2s',
    '&:hover': {
        backgroundColor: 'var(--orange-dark)',
        transform: 'scale(1.05)',
    },
}));

// Estilo para o container principal (Header)
const HeaderContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-end',
    padding: '30px 0',
    backgroundColor: 'var(--bg-light)', // Um fundo levemente diferente para o header
    marginBottom: '20px',
    // Adaptação para mobile
    [theme.breakpoints.down('sm')]: {
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
    },
}));

export default function GroupHeader({ cover, type, title, creator, year, details, onPlay }) {
    const displayYear = year || "N/A";
    
    return (
        <HeaderContainer>
            {/* 1. Capa/Ícone do Grupo */}
            <Avatar 
                src={cover} 
                alt={title} 
                variant="square" // Usar quadrado para capas
                sx={(theme) => ({
                    width: 230, 
                    height: 230, 
                    mr: 4, 
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                    borderRadius: '8px',
                    [theme.breakpoints.down('sm')]: {
                        width: 150,
                        height: 150,
                        mr: 0,
                        mb: 2,
                    }
                })}
            />

            {/* 2. Informações do Grupo */}
            <Box sx={(theme) => ({ 
                color: 'var(--text-color)', 
                [theme.breakpoints.down('sm')]: {
                    textAlign: 'center',
                    alignItems: 'center'
                }
            })}>
                {/* Tipo de Grupo/Playlist */}
                <Typography variant="body2" sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    color: 'var(--secondary-text-color)' 
                }}>
                    {type}
                </Typography>

                {/* Título Principal */}
                <Typography variant="h2" component="h1" sx={{ 
                    color: 'var(--title-color)', 
                    fontWeight: '900',
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    my: 1 
                }}>
                    {title}
                </Typography>
                
                {/* Detalhes e Criador */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mt: 1, 
                    color: 'var(--secondary-text-color)',
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {creator}
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                        • {displayYear} 
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 2 }}>
                        • {details || 'Sem detalhes'} 
                    </Typography>
                </Box>

                {/* Botão Principal de Ação (Entrar/Seguir/Play) */}
                <Box sx={{ mt: 3, textAlign: { xs: 'center', sm: 'left' } }}>
                    <StyledPlayButton onClick={onPlay} startIcon={<PlayArrowIcon />}>
                        Participar
                    </StyledPlayButton>
                </Box>
            </Box>
        </HeaderContainer>
    );
}